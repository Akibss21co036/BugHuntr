/**
 * Type declarations for use-auth hook
 */

declare module "@/hooks/use-auth" {
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

  export function useAuth(): UseAuthResult;
}
