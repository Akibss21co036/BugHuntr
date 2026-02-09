/**
 * Cloud Function: Approve & Triage CVSS Vector
 *
 * This callable allows triagers to approve the suggested CVSS vector, make edits,
 * and sign off on the triage decision. Once approved, the vulnerability status
 * moves to 'triaged' and the reward decision flow is triggered.
 *
 * Trigger: https.onCall
 * Auth: triagers or org admins
 * Input: { vulnId, cvssVector, triageNotes, finalSignOff: boolean }
 * Output: { success, updatedCvss, auditId }
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { computeBaseScore, parseVectorString } from "../../cvss/cvssEngine";
import {
  computeBugHuntrScore,
  getDefaultScoringFactorsForAsset,
  adjustForExploitability,
} from "../../cvss/bughuntrScoring";
import {
  validateCvssVector,
  diffVectors,
  isSignificantChange,
} from "../../utils/validateCvssVector";

const db = admin.firestore();

interface ApproveCvssInput {
  vulnId: string;
  cvssVector: string;
  triageNotes: string;
  finalSignOff: boolean;
}

export const approveCvss = functions
  .region("us-central1")
  .https.onCall(async (data: ApproveCvssInput, context) => {
    try {
      // Auth check
      if (!context.auth) {
        throw new functions.https.HttpsError(
          "unauthenticated",
          "User must be logged in"
        );
      }

      const uid = context.auth.uid;

      // Load vulnerability document
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

      // Check user permissions (must be triager or admin for this org)
      const userDoc = await db.collection("users").doc(uid).get();
      if (!userDoc.exists) {
        throw new functions.https.HttpsError("not-found", "User not found");
      }

      const userData = userDoc.data() || {};
      const orgId = vulnData.orgId || "default";

      // TODO: Implement org-based permission checking
      // For now, just check for triager or admin role
      if (userData.role !== "admin" && userData.role !== "triager") {
        throw new functions.https.HttpsError(
          "permission-denied",
          "Only triagers and admins can approve CVSS"
        );
      }

      // Validate the new CVSS vector
      const validation = validateCvssVector(data.cvssVector);
      if (!validation.valid) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          validation.error || "Invalid vector"
        );
      }

      // Compute new base score
      const cvssResult = computeBaseScore(data.cvssVector);
      if (!cvssResult) {
        throw new functions.https.HttpsError(
          "internal",
          "Failed to compute base score"
        );
      }

      // Load org config for scoring factors
      const orgDoc = await db.collection("orgs").doc(orgId).get();
      const orgData = orgDoc.data() || {};
      const assetImportanceMap = orgData.assetImportanceMap || {};

      // Load submission to get metadata
      const submissionDoc = await db
        .collection("bug_submissions")
        .doc(vulnData.submissionId)
        .get();
      const submissionData = submissionDoc.data() || {};

      // Compute BugHuntr score with org-specific factors
      let factors = getDefaultScoringFactorsForAsset(
        submissionData.assetType || "web_app",
        assetImportanceMap
      );

      // Adjust for PoC
      factors = adjustForExploitability(
        factors,
        submissionData.hasPublicPoC || false,
        false
      );

      const bughuntrResult = computeBugHuntrScore(
        cvssResult.baseScore,
        factors
      );

      // Prepare the new CVSS object
      const newCvssObject = {
        vector: data.cvssVector,
        baseScore: cvssResult.baseScore,
        severity: cvssResult.severity,
        approvedBy: uid,
        approvedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      // Get old CVSS for diff
      const oldCvss = vulnData.cvss?.vector || null;
      const oldVector = oldCvss ? parseVectorString(oldCvss) : null;
      const newVector = parseVectorString(data.cvssVector);

      let vectorDiff = null;
      let isSignificantEdit = false;

      if (oldVector && newVector) {
        vectorDiff = diffVectors(oldVector, newVector);
        isSignificantEdit = isSignificantChange(oldVector, newVector);
      }

      // Prepare audit entry
      const auditEntry = {
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        actorUid: uid,
        action: "cvss_approved",
        oldVector: oldCvss,
        newVector: data.cvssVector,
        oldBaseScore: vulnData.cvss?.baseScoreSuggested || null,
        newBaseScore: cvssResult.baseScore,
        oldBughuntrScore: vulnData.bughuntrScore?.suggested || null,
        newBughuntrScore: bughuntrResult.score,
        triageNotes: data.triageNotes,
        vectorDiff: vectorDiff || [],
        isSignificantChange: isSignificantEdit,
        finalSignOff: data.finalSignOff,
        ip: context.rawRequest.ip || "unknown",
        userAgent: context.rawRequest.headers["user-agent"] || "unknown",
      };

      // Use transaction to ensure consistency
      const updateResult = await db.runTransaction(async (transaction) => {
        // Update vulnerability document
        const updatedVulnData = {
          cvss: newCvssObject,
          bughuntrScore: {
            approved: bughuntrResult.score,
            components: {
              exploitabilityModifier: bughuntrResult.exploitabilityModifier,
              businessImpactMultiplier: bughuntrResult.businessImpactMultiplier,
              confidenceFactor: bughuntrResult.confidenceFactor,
            },
            version: bughuntrResult.version,
          },
          status: data.finalSignOff ? "triaged" : "triage_pending_final_review",
          triage: {
            reviewedBy: uid,
            reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
            triageNotes: data.triageNotes,
          },
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        transaction.update(
          db.collection("vulnerabilities").doc(data.vulnId),
          updatedVulnData
        );

        // Add audit record
        const auditRef = db
          .collection("vulnerabilities")
          .doc(data.vulnId)
          .collection("audit")
          .doc();
        transaction.set(auditRef, auditEntry);

        // If final sign-off, trigger reward decision
        if (data.finalSignOff) {
          // TODO: Call decideRewardAndPayoutDecision Cloud Function
          // For now, just log the action
          console.log(`Triggering reward decision for ${data.vulnId}`);
        }

        return {
          auditId: auditRef.id,
          updatedData: updatedVulnData,
        };
      });

      // Update submission record
      await db
        .collection("bug_submissions")
        .doc(vulnData.submissionId)
        .update({
          cvssStatus: data.finalSignOff ? "approved" : "pending_final_review",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

      return {
        success: true,
        vulnId: data.vulnId,
        auditId: updateResult.auditId,
        cvss: newCvssObject,
        bughuntrScore: bughuntrResult.score,
        status: data.finalSignOff ? "triaged" : "pending_final_review",
      };
    } catch (error) {
      console.error("Error approving CVSS:", error);
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      throw new functions.https.HttpsError(
        "internal",
        "Failed to approve CVSS"
      );
    }
  });
