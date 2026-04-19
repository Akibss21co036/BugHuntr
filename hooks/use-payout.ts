/**
 * Custom Hook for Payout Operations
 *
 * Provides client-side functions to interact with Cloud Functions
 * for payout creation, status tracking, and management.
 */

"use client";

import { useState, useCallback } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/firebaseConfig"; // Adjust import path as needed
import type {
  Payout,
  OrgWallet,
  CreatePayoutRequest,
  CreatePayoutResponse,
  BatchPayoutResponse,
} from "@/types/payout";

const functions = getFunctions();

export function usePayouts() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Create a single payout
   */
  const createPayout = useCallback(
    async (request: CreatePayoutRequest): Promise<CreatePayoutResponse> => {
      setLoading(true);
      setError(null);

      try {
        const createPayoutFn = httpsCallable<
          CreatePayoutRequest,
          CreatePayoutResponse
        >(functions, "createPayout");

        const result = await createPayoutFn(request);

        return result.data;
      } catch (err: any) {
        const errorMessage = err.message || "Failed to create payout";
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Get payout by order_id
   */
  const getPayout = useCallback(
    async (order_id: string): Promise<Payout | null> => {
      try {
        const payoutDoc = await getDoc(doc(db, "payouts", order_id));

        if (!payoutDoc.exists()) {
          return null;
        }

        return {
          ...payoutDoc.data(),
          order_id: payoutDoc.id,
          createdAt: payoutDoc.data().createdAt?.toDate(),
          updatedAt: payoutDoc.data().updatedAt?.toDate(),
        } as Payout;
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    []
  );

  /**
   * Get all payouts for an organization
   */
  const getOrgPayouts = useCallback(
    async (orgId: string): Promise<Payout[]> => {
      try {
        const q = query(collection(db, "payouts"), where("orgId", "==", orgId));

        const snapshot = await getDocs(q);

        return snapshot.docs.map((doc) => ({
          ...doc.data(),
          order_id: doc.id,
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
        })) as Payout[];
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    []
  );

  /**
   * Get payouts for a hunter
   */
  const getHunterPayouts = useCallback(
    async (hunterUid: string): Promise<Payout[]> => {
      try {
        const q = query(
          collection(db, "payouts"),
          where("hunterUid", "==", hunterUid)
        );

        const snapshot = await getDocs(q);

        return snapshot.docs.map((doc) => ({
          ...doc.data(),
          order_id: doc.id,
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
        })) as Payout[];
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    []
  );

  /**
   * Subscribe to payout status updates
   */
  const subscribeToPayout = useCallback(
    (order_id: string, onUpdate: (payout: Payout) => void) => {
      const unsubscribe = onSnapshot(
        doc(db, "payouts", order_id),
        (doc) => {
          if (doc.exists()) {
            onUpdate({
              ...doc.data(),
              order_id: doc.id,
              createdAt: doc.data().createdAt?.toDate(),
              updatedAt: doc.data().updatedAt?.toDate(),
            } as Payout);
          }
        },
        (err) => {
          setError(err.message);
        }
      );

      return unsubscribe;
    },
    []
  );

  /**
   * Get organization wallet
   */
  const getOrgWallet = useCallback(
    async (orgId: string): Promise<OrgWallet | null> => {
      try {
        const walletDoc = await getDoc(doc(db, "org_wallets", orgId));

        if (!walletDoc.exists()) {
          return null;
        }

        return {
          ...walletDoc.data(),
          orgId: walletDoc.id,
          updatedAt: walletDoc.data().updatedAt?.toDate(),
        } as OrgWallet;
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    []
  );

  /**
   * Subscribe to wallet balance updates
   */
  const subscribeToWallet = useCallback(
    (orgId: string, onUpdate: (wallet: OrgWallet) => void) => {
      const unsubscribe = onSnapshot(
        doc(db, "org_wallets", orgId),
        (doc) => {
          if (doc.exists()) {
            onUpdate({
              ...doc.data(),
              orgId: doc.id,
              updatedAt: doc.data().updatedAt?.toDate(),
            } as OrgWallet);
          }
        },
        (err) => {
          setError(err.message);
        }
      );

      return unsubscribe;
    },
    []
  );

  /**
   * Create batch payouts from CSV data
   */
  const createBatchPayouts = useCallback(
    async (
      orgId: string,
      payouts: Array<{
        submissionId: string;
        huntId: string;
        hunterUid: string;
        hunterWallet: string;
        amount: number;
      }>
    ): Promise<BatchPayoutResponse> => {
      setLoading(true);
      setError(null);

      try {
        const createBatchFn = httpsCallable<any, BatchPayoutResponse>(
          functions,
          "createBatchPayouts"
        );

        const result = await createBatchFn({ orgId, payouts });

        return result.data;
      } catch (err: any) {
        const errorMessage = err.message || "Failed to create batch payouts";
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    loading,
    error,
    createPayout,
    getPayout,
    getOrgPayouts,
    getHunterPayouts,
    subscribeToPayout,
    getOrgWallet,
    subscribeToWallet,
    createBatchPayouts,
  };
}
