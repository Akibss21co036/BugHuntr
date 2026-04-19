"use client";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Bell,
  Search,
  Menu,
  User,
  LogOut,
  Settings,
} from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import Link from "next/link";
import { Logo } from "./logo";
import { usePathname } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/components/auth/auth-context";
import { useState, useEffect, memo } from "react";
import { useSearch } from "@/components/search/search-context";
import { toast } from "sonner";
import { db } from "@/firebaseConfig";
import {
  collection,
  onSnapshot,
  query,
  where,
  updateDoc,
  doc,
  getDocs,
  increment,
} from "firebase/firestore";

interface TopNavbarProps {
  onMenuClick: () => void;
}

function TopNavbarComponent({ onMenuClick }: TopNavbarProps) {
  const { isAuthenticated, logout, user } = useAuth();
  const { searchTerm, setSearchTerm, suggestions, setSuggestions } =
    useSearch();
  const pathname = usePathname();
  const isFeedPage = pathname === "/feed";
  const [localSearchTerm, setLocalSearchTerm] = useState<string>(
    searchTerm ?? "",
  );
  const [invitations, setInvitations] = useState<any[]>([]);

  // Debounce search input to reduce re-renders
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setSearchTerm(localSearchTerm);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [localSearchTerm, setSearchTerm]);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      setInvitations([]);
      return;
    }

    const hunterId = user.id;
    const hunterUsername = user.username || user.id;

    let byId: any[] = [];
    let byUsername: any[] = [];

    const mergeInvites = () => {
      const seen = new Set<string>();
      const merged: any[] = [];
      [...byId, ...byUsername].forEach((invite) => {
        if (!seen.has(invite.id)) {
          seen.add(invite.id);
          merged.push(invite);
        }
      });
      setInvitations(merged);
    };

    const invitationsByIdQuery = query(
      collection(db, "proInvitations"),
      where("hunterId", "==", hunterId),
      where("status", "==", "pending"),
    );

    const invitationsByUsernameQuery = query(
      collection(db, "proInvitations"),
      where("hunterUsername", "==", hunterUsername),
      where("status", "==", "pending"),
    );

    const unsubId = onSnapshot(invitationsByIdQuery, (snapshot) => {
      byId = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as any),
      }));
      mergeInvites();
    });

    const unsubUsername = onSnapshot(invitationsByUsernameQuery, (snapshot) => {
      byUsername = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as any),
      }));
      mergeInvites();
    });

    return () => {
      unsubId();
      unsubUsername();
    };
  }, [isAuthenticated, user?.id, user?.username]);

  const handleInvitationAction = async (
    invitationId: string,
    huntId: string,
    status: "accepted" | "declined",
  ) => {
    try {
      await updateDoc(doc(db, "proInvitations", invitationId), {
        status,
        respondedAt: new Date().toISOString(),
      });

      if (status === "accepted") {
        toast.success("Invitation accepted");
        const huntSnapshot = await getDocs(
          query(collection(db, "proBugHunts"), where("id", "==", huntId)),
        );
        if (!huntSnapshot.empty) {
          await Promise.all(
            huntSnapshot.docs.map((docSnap) =>
              updateDoc(docSnap.ref, {
                currentHunters: increment(1),
                updatedAt: new Date().toISOString(),
              }),
            ),
          );
        }
      } else {
        toast.info("Invitation declined");
      }
    } catch (error) {
      console.error("Failed to update invitation:", error);
    }
  };

  const handleLogout = () => {
    logout();
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  };

  return (
    <header
      className="sticky top-0 z-50 w-full border-b border-[var(--border)] backdrop-blur supports-[backdrop-filter]:bg-background/90"
      style={{
        background: "var(--bg-primary)",
        color: "var(--text-primary)",
        transition: "background 0.3s, color 0.3s",
      }}
    >
      <div className="flex h-14 md:h-16 items-center justify-between gap-2 px-3 sm:px-4 lg:px-6 xl:px-8">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="min-w-0">
            <Logo />
          </div>
        </div>

        {isFeedPage ? (
          <div className="hidden sm:block flex-1 min-w-0 max-w-xs md:max-w-md lg:max-w-lg mx-1 sm:mx-3 lg:mx-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search vulnerabilities..."
                className="w-full pl-10 pr-4 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all text-sm text-foreground placeholder:text-muted-foreground"
                value={localSearchTerm}
                onChange={(e) => setLocalSearchTerm(e.target.value)}
              />
              {localSearchTerm.trim().length > 0 && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 rounded-lg border border-border bg-popover shadow-md overflow-hidden z-50">
                  {suggestions.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className="w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors"
                      onClick={() => {
                        setLocalSearchTerm(item.title);
                        setSearchTerm(item.title);
                        setSuggestions([]);
                        const target = document.getElementById(
                          `bug-${item.id}`,
                        );
                        if (target) {
                          target.scrollIntoView({
                            behavior: "smooth",
                            block: "end",
                          });
                        }
                      }}
                    >
                      {item.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 min-w-0" />
        )}

        <div className="flex items-center gap-1 sm:gap-2 md:gap-3">
          <div className="flex-shrink-0">
            <ThemeToggle />
          </div>

          {isAuthenticated ? (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative hidden sm:inline-flex">
                    <Bell className="h-5 w-5" />
                    {invitations.length > 0 && (
                      <span className="absolute -top-1 -right-1 h-2.5 w-2.5 bg-[var(--high)] rounded-full"></span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <div className="px-3 py-2 text-sm font-semibold">
                    Invitations
                  </div>
                  <DropdownMenuSeparator />
                  {invitations.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      No pending invitations
                    </div>
                  ) : (
                    invitations.map((invite) => (
                      <div key={invite.id} className="px-3 py-2">
                        <div className="text-sm font-medium">
                          {invite.huntTitle || "Pro Hunt"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {invite.companyName || "Company"}
                        </div>
                        <div className="mt-2 flex gap-2">
                          <Button
                            size="sm"
                            className="h-7"
                            onClick={() =>
                              handleInvitationAction(
                                invite.id,
                                invite.huntId,
                                "accepted",
                              )
                            }
                          >
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7"
                            onClick={() =>
                              handleInvitationAction(
                                invite.id,
                                invite.huntId,
                                "declined",
                              )
                            }
                          >
                            Decline
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Avatar className="h-7 w-7 sm:h-8 sm:w-8 cursor-pointer hover:ring-2 hover:ring-primary transition-all">
                    <AvatarImage src="/placeholder.svg?height=28&width=28" />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      JD
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="flex items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-[var(--critical)]"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
                <Link href="/login">Login</Link>
              </Button>
              <Button
                size="sm"
                asChild
                className="bg-primary hover:bg-[var(--accent-hover)]"
              >
                <Link href="/signup" className="px-1 sm:px-0">Sign Up</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export const TopNavbar = memo(TopNavbarComponent);
