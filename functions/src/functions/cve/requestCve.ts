/**
 * Cloud Function: Request CVE Assignment
 *
 * This callable initiates the CVE request workflow. It packages the disclosure
 * information and creates a CVE request record that tracks status through the
 * CNAassignment process.
 *
 * Workflow:
 * 1. Validate vulnerability triage status
 * 2. Prepare disclosure packet (description, timeline, PoC pointer, CVSS, etc.)
 * 3. Create cve_requests record with initial status
 * 4. TODO: Notify CNA or implement external API call
 *
 * Trigger: https.onCall
 * Auth: triagers, researchers
 * Input: { vulnId, requestorUid, disclosureType, notes }
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

const db = admin.firestore();

interface RequestCveInput {
  vulnId: string;
  requestorUid: string;
  disclosureType: "public" | "coordinated";
  notes?: string;
  cnaContactEmail?: string; // Optional: pre-populate CNA email
}

interface DisclosurePacket {
  vulnId: string;
  title: string;
  description: string;
  cvssVector: string;
  cvssBaseScore: number;
  bughuntrScore: number;
  timeline: {
    discoveredDate: FieldValue;
    reportedDate: FieldValue;
    disclosureDate?: string; // Proposed disclosure date
  };
  pocPointer: string; // Encrypted CID or location
  pocRedacted: string; // Redacted PoC for public CVE
  mitigation: string;
  references: string[];
  contactEmail: string;
  orgConsent: boolean;
  disclosureType: "public" | "coordinated";
}

export const requestCve = functions
  .region("us-central1")
  .https.onCall(async (data: RequestCveInput, context) => {
    try {
      // Auth check
      if (!context.auth) {
        throw new functions.https.HttpsError(
          "unauthenticated",
          "Must be logged in"
        );
      }

      const uid = context.auth.uid;

      // Verify user is triager
      const userDoc = await db.collection("users").doc(uid).get();
      if (!userDoc.exists) {
        throw new functions.https.HttpsError("not-found", "User not found");
      }

      const userData = userDoc.data() || {};
      if (userData.role !== "admin" && userData.role !== "triager") {
        throw new functions.https.HttpsError(
          "permission-denied",
          "Only triagers and admins can request CVE"
        );
      }

      // Load vulnerability
      const vulnDoc = await db
        .collection("vulnerabilities")
        .doc(data.vulnId)
        .get();
      if (!vulnDoc.exists) {
        throw new functions.https.HttpsError(
          "not-found",
          "Vulnerability not found"
        );
      }

      const vulnData = vulnDoc.data() || {};

      // Check triage status
      if (vulnData.status !== "triaged" && vulnData.status !== "disclosed") {
        throw new functions.https.HttpsError(
          "invalid-argument",
          `Vulnerability status must be "triaged" or "disclosed", got "${vulnData.status}"`
        );
      }

      // Ensure CVSS is approved
      if (!vulnData.cvss?.baseScore) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "CVSS must be approved before requesting CVE"
        );
      }

      // Load submission for additional context
      const submissionDoc = await db
        .collection("bug_submissions")
        .doc(vulnData.submissionId)
        .get();
      const submissionData = submissionDoc.data() || {};

      // Load org to check consent requirement
      const orgDoc = await db.collection("orgs").doc(vulnData.orgId).get();
      const orgData = orgDoc.data() || {};

      // For coordinated disclosure, require org consent (or triager override documented)
      if (
        data.disclosureType === "coordinated" &&
        !orgData.cveCoordinationConsent
      ) {
        if (!data.notes?.includes("OVERRIDE:")) {
          throw new functions.https.HttpsError(
            "invalid-argument",
            "Organization has not consented to CVE coordination. Add override notes to proceed."
          );
        }
      }

      // For public disclosure, require researcher consent
      if (
        data.disclosureType === "public" &&
        !submissionData.publicDisclosureConsent
      ) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "Reporter has not consented to public disclosure"
        );
      }

      // Prepare disclosure packet
      const disclosurePacket: DisclosurePacket = {
        vulnId: data.vulnId,
        title: vulnData.title,
        description: vulnData.description,
        cvssVector: vulnData.cvss.vector,
        cvssBaseScore: vulnData.cvss.baseScore,
        bughuntrScore: vulnData.bughuntrScore?.approved || 0,
        timeline: {
          discoveredDate:
            submissionData.discoveredDate ||
            admin.firestore.FieldValue.serverTimestamp(),
          reportedDate:
            submissionData.reportedDate ||
            admin.firestore.FieldValue.serverTimestamp(),
          // disclosureDate: to be filled by user or auto-calculated (e.g., 90 days from report)
        },
        pocPointer: submissionData.pocStorageId || "", // CID or storage location (encrypted)
        pocRedacted: submissionData.pocRedacted || "", // Public-safe version
        mitigation: submissionData.mitigation || "",
        references: submissionData.references || [],
        contactEmail: orgData.securityEmail || "security@bughuntr.io",
        orgConsent:
          data.disclosureType === "coordinated"
            ? orgData.cveCoordinationConsent || false
            : true,
        disclosureType: data.disclosureType,
      };

      // Generate unique CVE request ID
      const now = new Date();
      const timestamp = now.getTime();
      const reqId = `BH-CVE-${data.vulnId.replace(
        "BH-VULN-",
        ""
      )}-${timestamp}`;

      // Create CVE request record
      const cveRequestRecord = {
        reqId,
        vulnId: data.vulnId,
        requestedBy: uid,
        requestorEmail: userData.email || "",
        status: "requested", // requested -> cna_acknowledged -> cve_assigned -> public -> (or rejected)
        disclosureType: data.disclosureType,
        disclosurePacket,
        cveId: null, // To be filled when CNA assigns CVE
        notes: data.notes || "",
        cnaContactEmail:
          data.cnaContactEmail || orgData.cnaContactEmail || null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        requestedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        statusHistory: [
          {
            status: "requested",
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            changedBy: uid,
            notes: "CVE request initiated",
          },
        ],
      };

      // Use transaction
      await db.runTransaction(async (transaction) => {
        // Create CVE request record
        transaction.set(
          db.collection("cve_requests").doc(reqId),
          cveRequestRecord
        );

        // Update vulnerability with CVE request reference
        transaction.update(db.collection("vulnerabilities").doc(data.vulnId), {
          cveRequestId: reqId,
          status: "cve_requested",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Add audit entry
        transaction.set(
          db
            .collection("vulnerabilities")
            .doc(data.vulnId)
            .collection("audit")
            .doc(),
          {
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            actorUid: uid,
            action: "cve_requested",
            disclosureType: data.disclosureType,
            cveRequestId: reqId,
            notes: data.notes || "",
          }
        );
      });

      // TODO: Call external CNA API or send email
      // For now, just log the action
      console.log(
        `CVE request created: ${reqId} for vulnerability ${data.vulnId}`,
        `Disclosure Type: ${data.disclosureType}`,
        `CNA Email: ${data.cnaContactEmail || "not-provided"}`
      );

      return {
        success: true,
        reqId,
        status: "requested",
        vulnId: data.vulnId,
        disclosureType: data.disclosureType,
        nextStep:
          "Awaiting CNA acknowledgment. Check status at /admin/cve-requests",
      };
    } catch (error) {
      console.error("Error requesting CVE:", error);
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      throw new functions.https.HttpsError("internal", "Failed to request CVE");
    }
  });
