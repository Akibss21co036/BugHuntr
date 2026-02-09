/**
 * use-auth.ts
 *
 * React hook for Firebase Authentication
 * Provides current user, loading state, and authentication utilities.
 */

"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/firebaseConfig";

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  role?: "admin" | "triager" | "user";
  org?: string;
  customClaims?: {
    role?: "admin" | "triager" | "user";
    org?: string;
  };
}

export interface UseAuthResult {
  user: AuthUser | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Hook for managing authentication state
 * Returns current user, loading state, and any errors
 */
export function useAuth(): UseAuthResult {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    try {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          // Get custom claims from ID token
          const idTokenResult = await firebaseUser.getIdTokenResult();
          const customClaims = idTokenResult.claims;

          const authUser: AuthUser = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            emailVerified: firebaseUser.emailVerified,
            role: customClaims.role as "admin" | "triager" | "user" | undefined,
            org: customClaims.org as string | undefined,
            customClaims: {
              role: customClaims.role as
                | "admin"
                | "triager"
                | "user"
                | undefined,
              org: customClaims.org as string | undefined,
            },
          };

          setUser(authUser);
        } else {
          setUser(null);
        }
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown auth error"));
      setLoading(false);
    }
  }, []);

  return { user, loading, error };
}
