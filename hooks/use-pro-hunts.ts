"use client";

import { useState, useEffect } from "react";
import { type ProHunt, type ProSubmission } from "@/types/pro";
import { mockProHunts } from "@/data/mock-pro-data";
import { db } from "@/firebaseConfig";
import {
  collection,
  addDoc,
  getDocs,
  Query,
  where,
  query,
  updateDoc,
  doc,
} from "firebase/firestore";

export function useProHunts() {
  const [proHunts, setProHunts] = useState<ProHunt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load persisted pro hunts from Firestore, merge with mock data for dev
    let mounted = true;
    (async () => {
      try {
        const snapshot = await getDocs(collection(db, "proBugHunts"));
        const persisted: ProHunt[] = snapshot.docs.map((d) => ({
          ...(d.data() as any),
        }));
        if (!mounted) return;
        // Merge mock data and persisted data, dedupe by id
        const combined = [...mockProHunts, ...persisted];
        const seen = new Set<string>();
        const deduped: ProHunt[] = [];
        for (const h of combined) {
          if (!seen.has(h.id)) {
            seen.add(h.id);
            deduped.push(h);
          }
        }
        setProHunts(deduped);
      } catch (err) {
        console.error(
          "Failed to load persisted pro hunts, falling back to mocks:",
          err,
        );
        setProHunts(mockProHunts);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const createProHunt = async (
    huntData: Omit<
      ProHunt,
      "id" | "createdAt" | "updatedAt" | "currentHunters"
    >,
  ) => {
    const newHunt: ProHunt = {
      ...huntData,
      id: `prohunt_${Date.now()}`,
      currentHunters: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setProHunts((prev) => [...prev, newHunt]);
    // Persist to Firestore collection 'proBugHunts' when possible
    try {
      await addDoc(collection(db, "proBugHunts"), {
        ...newHunt,
      });
    } catch (err) {
      console.error("Failed to persist pro hunt to Firestore:", err);
    }
    return newHunt;
  };

  const updateProHunt = async (huntId: string, updates: Partial<ProHunt>) => {
    setProHunts((prev) =>
      prev.map((hunt) =>
        hunt.id === huntId
          ? { ...hunt, ...updates, updatedAt: new Date().toISOString() }
          : hunt,
      ),
    );

    // Persist to Firestore
    try {
      const q = query(collection(db, "proBugHunts"), where("id", "==", huntId));
      const snapshot = await getDocs(q);
      if (snapshot.docs.length > 0) {
        const docRef = snapshot.docs[0].ref;
        await updateDoc(docRef, {
          ...updates,
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error("Failed to update pro hunt in Firestore:", err);
    }
  };

  const deleteProHunt = async (huntId: string) => {
    setProHunts((prev) => prev.filter((hunt) => hunt.id !== huntId));
  };

  const getProHuntById = (huntId: string) => {
    return proHunts.find((hunt) => hunt.id === huntId);
  };

  const getActiveProHunts = () => {
    return proHunts.filter((hunt) => hunt.status === "active");
  };

  const getCompanyProHunts = (companyId: string) => {
    return proHunts.filter((hunt) => hunt.companyId === companyId);
  };

  return {
    proHunts,
    loading,
    createProHunt,
    updateProHunt,
    deleteProHunt,
    getProHuntById,
    getActiveProHunts,
    getCompanyProHunts,
  };
}
