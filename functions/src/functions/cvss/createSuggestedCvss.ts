/**
 * Cloud Function: Create Suggested CVSS for Submission
 *
 * This callable function auto-suggests a CVSS v3.1 vector based on submission metadata,
 * computes the base score and BugHuntr score, and stores it for triager review.
 *
 * The suggestion is advisory only — triagers must explicitly approve it.
 *
 * Trigger: https.onCall
 * Auth: triagers or security researchers
 * Input: { submissionId: string }
 * Output: { vulnId: string, suggestedVector: string, baseScore: number, bughuntrScore: number }
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import {
  suggestVectorFromSubmission,
  computeBaseScore,
  SubmissionMetadata,
} from "../../cvss/cvssEngine";
import {
  computeBugHuntrScore,
  getDefaultScoringFactorsForAsset,
  adjustForExploitability,
  adjustForProofOfConcept,
} from "../../cvss/bughuntrScoring";
import { validateCvssVector } from "../../utils/validateCvssVector";

const db = admin.firestore();

interface CreateSuggestedCvssInput {
  submissionId: string;
  override?: {
    vector?: string; // Allow triager to pre-populate vector suggestion
  };
}

export const createSuggestedCvss = functions
  .region("us-central1")
  .https.onCall(async (data: CreateSuggestedCvssInput, context) => {
    try {
      // Auth check: must be triager or admin
      if (!context.auth) {
        throw new functions.https.HttpsError(
          "unauthenticated",
          "User must be logged in"
        );
      }

      const uid = context.auth.uid;

      // Check user role (TODO: verify against org permissions)
      const userDoc = await db.collection("users").doc(uid).get();
      if (!userDoc.exists) {
        throw new functions.https.HttpsError(
          "not-found",
          "User profile not found"
        );
      }

      const userData = userDoc.data() || {};
      if (userData.role !== "admin" && userData.role !== "triager") {
        throw new functions.https.HttpsError(
          "permission-denied",
          "Only triagers and admins can create CVSS suggestions"
        );
      }

      // Load submission
      const submissionDoc = await db
        .collection("bug_submissions")
        .doc(data.submissionId)
        .get();
      if (!submissionDoc.exists) {
        throw new functions.https.HttpsError(
          "not-found",
          "Submission not found"
        );
      }

      const submission = submissionDoc.data() || {};

      // Extract metadata for suggestion heuristics
      const metadata: SubmissionMetadata = {
        vulnerabilityType: submission.vulnerabilityType || "UNKNOWN",
        authenticatedRequired: submission.authenticatedRequired || false,
        userInteractionRequired: submission.userInteractionRequired || false,
        hasPublicPoC: submission.hasPublicPoC || false,
        affectedAssetType: submission.assetType || "web_app",
        impactedSystems: submission.impactedSystems || [],
      };

      // Generate suggested vector
      let suggestedVectorStr: string;
      const suggested = suggestVectorFromSubmission(metadata);
      if (typeof suggested === "string") {
        suggestedVectorStr = suggested;
      } else {
        // Convert vector object to string
        suggestedVectorStr = `CVSS:3.1/AV:${suggested.AV}/AC:${suggested.AC}/PR:${suggested.PR}/UI:${suggested.UI}/S:${suggested.S}/C:${suggested.C}/I:${suggested.I}/A:${suggested.A}`;
      }

      if (data.override?.vector) {
        suggestedVectorStr = data.override.vector;
      }

      // Validate vector
      const validation = validateCvssVector(suggestedVectorStr);
      if (!validation.valid) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          validation.error || "Invalid CVSS vector"
        );
      }

      // Compute CVSS base score
      const cvssResult = computeBaseScore(suggestedVectorStr);
      if (!cvssResult) {
        throw new functions.https.HttpsError(
          "internal",
          "Failed to compute CVSS base score"
        );
      }

      // Load organization to get asset importance map
      const orgId = submission.orgId || "default";
      const orgDoc = await db.collection("orgs").doc(orgId).get();
      const orgData = orgDoc.data() || {};
      const assetImportanceMap = orgData.assetImportanceMap || {};

      // Get default scoring factors based on asset type
      let factors = getDefaultScoringFactorsForAsset(
        metadata.affectedAssetType || "web_app",
        assetImportanceMap
      );

      // Adjust for exploitability if PoC exists
      factors = adjustForExploitability(
        factors,
        metadata.hasPublicPoC || false,
        false // TODO: check against known vuln database
      );

      // Adjust for PoC quality (default to 'evidence_provided')
      const pocType = submission.pocType || "evidence_provided";
      factors = adjustForProofOfConcept(factors, pocType);

      // Compute BugHuntr score
      const bughuntrResult = computeBugHuntrScore(
        cvssResult.baseScore,
        factors
      );

      // Generate unique vulnerability ID
      const vulnId = `BH-VULN-${data.submissionId}`;

      // Prepare audit entry
      const auditEntry = {
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        actorUid: uid,
        action: "suggestion_created",
        vector: suggestedVectorStr,
        baseScore: cvssResult.baseScore,
        bughuntrScore: bughuntrResult.score,
        factors: {
          exploitabilityModifier: bughuntrResult.exploitabilityModifier,
          businessImpactMultiplier: bughuntrResult.businessImpactMultiplier,
          confidenceFactor: bughuntrResult.confidenceFactor,
        },
        metadata,
      };

      // Write to Firestore (idempotent: merge with existing)
      await db
        .collection("vulnerabilities")
        .doc(vulnId)
        .set(
          {
            submissionId: data.submissionId,
            huntId: submission.huntId,
            orgId,
            title: submission.title,
            description: submission.description,
            cvss: {
              suggestedVector: suggestedVectorStr,
              baseScoreSuggested: cvssResult.baseScore,
              severity: cvssResult.severity,
              suggestedBy: "auto-bot",
              suggestedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            bughuntrScore: {
              suggested: bughuntrResult.score,
              components: {
                exploitabilityModifier: bughuntrResult.exploitabilityModifier,
                businessImpactMultiplier:
                  bughuntrResult.businessImpactMultiplier,
                confidenceFactor: bughuntrResult.confidenceFactor,
              },
              version: bughuntrResult.version,
            },
            status: "triage_pending",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

      // Append audit record
      await db
        .collection("vulnerabilities")
        .doc(vulnId)
        .collection("audit")
        .add(auditEntry);

      // Also update submission with vuln reference
      await db.collection("bug_submissions").doc(data.submissionId).update({
        vulnerabilityId: vulnId,
        cvssStatus: "pending_triager_review",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return {
        success: true,
        vulnId,
        suggestedVector: suggestedVectorStr,
        baseScore: cvssResult.baseScore,
        severity: cvssResult.severity,
        bughuntrScore: bughuntrResult.score,
        factors: {
          exploitabilityModifier: bughuntrResult.exploitabilityModifier,
          businessImpactMultiplier: bughuntrResult.businessImpactMultiplier,
          confidenceFactor: bughuntrResult.confidenceFactor,
        },
      };
    } catch (error) {
      console.error("Error creating suggested CVSS:", error);
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      throw new functions.https.HttpsError(
        "internal",
        "Failed to create CVSS suggestion"
      );
    }
  });
