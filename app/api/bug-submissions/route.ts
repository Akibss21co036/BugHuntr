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
}

const CONTRACT_ABI = [
  // Expect a simple method that records the bug ID + reporter + IPFS CID.
  "function storeBug(string bugId,string reporter,string ipfsCid) public returns (bytes32)",
]

const formatDate = (value?: string) => {
  if (!value) return new Date().toISOString()
  return new Date(value).toISOString()
}

// Minimal PDF generator (no external deps) — produces a single-page text-only PDF
const generatePdf = (payload: BugPayload): Buffer => {
  const escapeText = (text: string) =>
    text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)").replace(/\r?\n/g, "\\n")

  const bodyLines = [
    "BugHuntr - Vulnerability Report",
    `Bug ID: ${payload.bugId}`,
    `Title: ${payload.title}`,
    `Company: ${payload.company ?? "N/A"}`,
    `Category: ${payload.category ?? "General"}`,
    `Severity: ${payload.severity ?? "unspecified"}`,
    `Submitted By: ${payload.submittedBy}`,
    `Reporter Email: ${payload.submittedEmail ?? "N/A"}`,
    `Submitted At: ${formatDate(payload.submittedAt)}`,
    "",
    "Executive Summary:",
    payload.summary ?? "No summary provided.",
    "",
    "Technical Description:",
    payload.description || "No description provided.",
    "",
    payload.proofOfConceptUrl ? `Proof of Concept: ${payload.proofOfConceptUrl}` : "",
  ].filter(Boolean)

  const textContent = escapeText(bodyLines.join("\n"))
  const contentStream = `BT /F1 12 Tf 50 750 Td (${textContent}) Tj ET`

  const objects: string[] = []
  const addObject = (str: string) => objects.push(str)

  addObject("1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj")
  addObject("2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj")
  addObject(
    "3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>endobj",
  )
  addObject(`4 0 obj<< /Length ${contentStream.length} >>stream\n${contentStream}\nendstream endobj`)
  addObject("5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj")

  // Build PDF with xref offsets
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

  const file = new Blob([pdfBuffer], { type: "application/pdf" })
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

const storeBugOnChain = async (payload: BugPayload, ipfsCid: string) => {
  // Default to Sepolia public RPC if none provided
  const rpcUrl = process.env.BLOCKCHAIN_RPC_URL || "https://rpc.sepolia.org"
  const privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY
  const contractAddress = process.env.BUG_CONTRACT_ADDRESS || "0x7EF2e0048f5bAeDe046f6BF797943daF4ED8CB47"

  if (!rpcUrl || !privateKey) {
    return { skipped: true, reason: "Missing blockchain RPC URL or private key" }
  }

  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl)
    const wallet = new ethers.Wallet(privateKey, provider)
    const contract = new ethers.Contract(contractAddress, CONTRACT_ABI, wallet)

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

