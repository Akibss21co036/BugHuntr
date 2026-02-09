/**
 * BugHuntr Cloud Functions - Main Index
 *
 * This file exports all Cloud Functions for the automated crypto payout system.
 *
 * Functions:
 * - createPayout: Create a new payout for approved submission
 * - cryptomusWebhook: Receive webhook updates from Cryptomus
 * - reconcilePayouts: Daily reconciliation job
 * - createBatchPayouts: Process batch CSV uploads
 * - processQueuedPayout: Process payouts from queue
 */

import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK
admin.initializeApp();

// Export all Cloud Functions
export { createPayout } from "./functions/createPayout";
export { cryptomusWebhook } from "./functions/cryptomusWebhook";
export { reconcilePayouts } from "./functions/reconcilePayouts";
export {
  createBatchPayouts,
  processQueuedPayout,
} from "./functions/createBatchPayouts";
