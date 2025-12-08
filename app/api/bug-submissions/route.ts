import { NextResponse } from "next/server"
import { ethers } from "ethers"

export const runtime = "nodejs"

type BugPayload = {
  bugId: string
  title: string
  company?: string
  category?: string
  severity?: string
  summary?: string
  description: string
  proofOfConceptUrl?: string
  submittedBy: string
  submittedEmail?: string
  submittedAt?: string
  reporter?: string
  reportedAt?: string
  impact?: string
  stepsToReproduce?: string
  affectedAssets?: string
  status?: string
}

const formatDate = (value?: string) => {
  if (!value) return new Date().toISOString()
  return new Date(value).toISOString()
}

const generatePdf = (payload: BugPayload): Buffer => {
  const escapeText = (text: string) =>
    (text ?? "")
      .replace(/\\/g, "\\\\")
      .replace(/\(/g, "\\(")
      .replace(/\)/g, "\\)")
      .replace(/\r?\n/g, "\\n")

  const wrapLines = (text: string, max = 90) => {
    const words = (text || "N/A").split(/\s+/)
    const lines: string[] = []
    let current = ""

    for (const w of words) {
      if (!w) continue
      if ((current + " " + w).trim().length > max) {
        if (current) lines.push(current.trim())
        current = w
      } else {
        current = `${current} ${w}`.trim()
      }
    }

    if (current) lines.push(current.trim())
    return lines
  }

  const lines: string[] = []
  const addLine = (t: string = "") => {
    lines.push(escapeText(t))
  }

  const addLabelValue = (label: string, value?: string) => {
    addLine(`${label}: ${value?.trim() || "N/A"}`)
  }

  const addWrapped = (label: string, value?: string) => {
    addLine(label + ":")
    wrapLines(value || "N/A").forEach((l) => addLine("  " + l))
    addLine("") // blank line for spacing
  }

  const addSection = (title: string) => {
    addLine("") // top spacing
    addLine(`── ${title} ──`)
    addLine("") // bottom spacing
  }

  // ─────────────────────────────────────────────
  // BUILD CONTENT LINES
  // ─────────────────────────────────────────────
  addSection("Report Metadata")
  addLabelValue("Company", payload.company)
  addLabelValue("Bug ID", payload.bugId)
  addLabelValue("Severity", payload.severity)
  addLabelValue("Status", payload.status ?? "Submitted")
  addLabelValue("Reporter", payload.reporter ?? payload.submittedBy)
  addLabelValue("Reported At", payload.reportedAt ?? formatDate(payload.submittedAt))

  addSection("Summary")
  addWrapped("Overview", payload.summary)

  addSection("Impact")
  addWrapped("Impact Details", payload.impact ?? payload.description)

  addSection("Steps to Reproduce")
  addWrapped("Steps", payload.stepsToReproduce)

  addSection("Affected Assets")
  addWrapped("Assets", payload.affectedAssets ?? payload.category)

  // ─────────────────────────────────────────────
  // LAYOUT TEXT (NO JUMBLING)
  // ─────────────────────────────────────────────
  const startY = 680           // start under subtitle
  const lineHeight = 14        // compact but readable
  let y = startY

  const textParts: string[] = []

  for (const raw of lines) {
    // Even for blank lines, move the cursor down
    if (!raw) {
      y -= lineHeight
      continue
    }

    // Stop before we hit the bottom border
    if (y <= 60) break

    const l = raw
    const chunk = `BT /F1 10 Tf 0 0 0 rg 70 ${y} Td (${l}) Tj ET`
    textParts.push(chunk)
    y -= lineHeight
  }

  const textChunks = textParts.join("\n")

  // ─────────────────────────────────────────────
  // DECORATIVE ELEMENTS
  // ─────────────────────────────────────────────
  // Header bar
  const headerBar = "q 0.09 0.14 0.32 rg 40 720 532 40 re f Q"
  // Thin accent bar below header
  const subBar = "q 0.0 0.55 0.85 rg 40 705 532 6 re f Q"
  // Left accent strip along the full card
  const accentStrip = "q 0.0 0.55 0.85 rg 40 40 6 712 re f Q"
  // Soft background panel
  const bgPanel = "q 0.96 0.97 0.99 rg 40 40 532 712 re f Q"
  // Border
  const border = "q 1 w 0.7 0.7 0.7 RG 40 40 532 712 re S Q"

  const titleText = `BT /F1 18 Tf 1 1 1 rg 70 745 Td (BugHuntr Vulnerability Certificate) Tj ET`
  const subtitleText = `BT /F1 12 Tf 1 1 1 rg 70 728 Td (${escapeText(
    `Issued for ${payload.company ?? "N/A"} | Bug ID: ${payload.bugId ?? "N/A"}`,
  )}) Tj ET`

  const contentStream =
    [
      bgPanel,
      accentStrip,
      headerBar,
      subBar,
      border,
      titleText,
      subtitleText,
      textChunks,
    ].join("\n")

  // ─────────────────────────────────────────────
  // PDF OBJECTS
  // ─────────────────────────────────────────────
  const objects: string[] = []
  const addObject = (str: string) => objects.push(str)

  addObject("1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj")
  addObject("2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj")
  addObject(
    "3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>endobj",
  )

  // Use byte length, not string length (handles UTF-8 correctly)
  const contentLength = Buffer.byteLength(contentStream, "utf-8")
  addObject(`4 0 obj<< /Length ${contentLength} >>stream\n${contentStream}\nendstream endobj`)
  addObject("5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj")

  const header = "%PDF-1.4\n"
  const bodyParts: string[] = []
  const offsets: number[] = []
  let cursor = header.length

  for (const obj of objects) {
    offsets.push(cursor)
    bodyParts.push(obj + "\n")
    cursor += obj.length + 1
  }

  const xrefStart = cursor
  const pad = (n: number) => n.toString().padStart(10, "0")
  const xrefEntries = ["0000000000 65535 f "]
  offsets.forEach((off) => xrefEntries.push(`${pad(off)} 00000 n `))

  const xref = `xref\n0 ${objects.length + 1}\n${xrefEntries.join("\n")}\n`
  const trailer = `trailer<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`

  const pdfString = header + bodyParts.join("") + xref + trailer
  return Buffer.from(pdfString, "utf-8")
}


const uploadPdfToPinata = async (pdfBuffer: Buffer, filename: string) => {
  const pinataJwt = process.env.PINATA_JWT
  if (!pinataJwt) {
    throw new Error("Missing PINATA_JWT environment variable")
  }

  const file = new Blob([new Uint8Array(pdfBuffer)], { type: "application/pdf" })
  const formData = new FormData()
  formData.append("file", file, filename)

  const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${pinataJwt}`,
    },
    body: formData,
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Pinata upload failed: ${res.status} ${text}`)
  }

  const data = (await res.json()) as { IpfsHash: string }
  return {
    cid: data.IpfsHash,
    url: `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`,
  }
}

// (Optional) server-side anchoring; currently unused by client MetaMask flow
const storeBugOnChain = async (payload: BugPayload, ipfsCid: string) => {
  const rpcUrl = process.env.BLOCKCHAIN_RPC_URL || "https://rpc.sepolia.org"
  const privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY
  const contractAddress = process.env.BUG_CONTRACT_ADDRESS

  if (!rpcUrl || !privateKey || !contractAddress) {
    return { skipped: true, reason: "Missing blockchain RPC URL, private key, or contract address" }
  }

  try {
    const JsonRpcProvider = (ethers as any).JsonRpcProvider || (ethers as any).providers?.JsonRpcProvider
    if (!JsonRpcProvider) {
      return { skipped: true, reason: "No JsonRpcProvider available in ethers build" }
    }
    const provider = new JsonRpcProvider(rpcUrl)
    const wallet = new ethers.Wallet(privateKey, provider)
    const contract = new ethers.Contract(
      contractAddress,
      ["function storeBug(string bugId,string reporter,string ipfsCid) public returns (bytes32)"],
      wallet,
    )

    const tx = await contract.storeBug(payload.bugId, payload.submittedBy, ipfsCid)
    const receipt = await tx.wait()
    return {
      txHash: tx.hash,
      blockNumber: receipt?.blockNumber,
    }
  } catch (error) {
    return { error: (error as Error).message }
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<BugPayload>
    if (!body.bugId || !body.title || !body.description || !body.submittedBy) {
      return NextResponse.json({ error: "bugId, title, description, and submittedBy are required" }, { status: 400 })
    }

    const payload: BugPayload = {
      bugId: body.bugId,
      title: body.title,
      company: body.company,
      category: body.category,
      severity: body.severity,
      summary: body.summary,
      description: body.description,
      proofOfConceptUrl: body.proofOfConceptUrl,
      submittedBy: body.submittedBy,
      submittedEmail: body.submittedEmail,
      submittedAt: body.submittedAt,
    }

    const pdfBuffer = await generatePdf(payload)
    const pdf = await uploadPdfToPinata(pdfBuffer, `${payload.bugId || "bug"}-report.pdf`)
    const chain = await storeBugOnChain(payload, pdf.cid)

    return NextResponse.json({
      pdfCid: pdf.cid,
      pdfUrl: pdf.url,
      chain,
    })
  } catch (error) {
    console.error("Bug submission processing failed:", error)
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}

