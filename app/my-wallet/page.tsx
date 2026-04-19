"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/auth-context";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Wallet,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Copy,
  ExternalLink,
  DollarSign,
  ArrowUpRight,
  Download,
  Eye,
  EyeOff,
  Coins,
} from "lucide-react";
import { toast } from "sonner";
import { db } from "@/firebaseConfig";
import { formatCurrency } from "@/lib/pro-utils";
import {
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";

export default function MyWalletPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showBalance, setShowBalance] = useState(true);

  // User wallet data
  const [walletAddress, setWalletAddress] = useState("");
  const [savedWalletAddress, setSavedWalletAddress] = useState("");
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [walletBalance, setWalletBalance] = useState(0);
  const [pendingPayouts, setPendingPayouts] = useState<any[]>([]);
  const [completedPayouts, setCompletedPayouts] = useState<any[]>([]);
  const [failedPayouts, setFailedPayouts] = useState<any[]>([]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    loadWalletData();
  }, [isAuthenticated, user]);

  const loadWalletData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // Load saved wallet address
      const userWalletDoc = await getDoc(doc(db, "user_wallets", user.id));
      if (userWalletDoc.exists()) {
        const address = userWalletDoc.data().walletAddress;
        setSavedWalletAddress(address);
        setWalletAddress(address);
      }

      // Load all payouts for this user
      const payoutsQuery = query(
        collection(db, "payouts"),
        where("hunterUid", "==", user.id)
      );

      const payoutsSnapshot = await getDocs(payoutsQuery);
      const allPayouts: any[] = payoutsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Categorize payouts
      const completed = allPayouts.filter((p) => p.status === "completed");
      const pending = allPayouts.filter(
        (p) => p.status === "pending_created" || p.status === "processing"
      );
      const failed = allPayouts.filter((p) => p.status === "failed");

      setCompletedPayouts(completed);
      setPendingPayouts(pending);
      setFailedPayouts(failed);

      // Calculate total earnings
      const total = completed.reduce((sum, p) => sum + (p.amount || 0), 0);
      setTotalEarnings(total);

      const profileQuery = query(
        collection(db, "userProfiles"),
        where("username", "==", user.id)
      );
      const profileSnapshot = await getDocs(profileQuery);
      if (!profileSnapshot.empty) {
        const profile = profileSnapshot.docs[0].data();
        setWalletBalance(profile.walletBalance || 0);
      } else {
        setWalletBalance(0);
      }
    } catch (error) {
      console.error("Error loading wallet data:", error);
      toast.error("Failed to load wallet data");
    } finally {
      setLoading(false);
    }
  };

  const saveWalletAddress = async () => {
    if (!user?.id || !walletAddress) {
      toast.error("Please enter a valid wallet address");
      return;
    }

    // Basic validation
    if (!walletAddress.startsWith("0x") || walletAddress.length !== 42) {
      toast.error("Invalid Ethereum/Polygon wallet address");
      return;
    }

    try {
      setLoading(true);

      await setDoc(
        doc(db, "user_wallets", user.id),
        {
          userId: user.id,
          username: user.username,
          walletAddress: walletAddress,
          network: "POLYGON",
          updatedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
        },
        { merge: true }
      );

      setSavedWalletAddress(walletAddress);
      toast.success("Wallet address saved successfully!");
    } catch (error: any) {
      toast.error("Failed to save wallet address: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const createDemoEarning = async () => {
    if (!user?.id || !savedWalletAddress) {
      toast.error("Please save your wallet address first");
      return;
    }

    try {
      setLoading(true);

      // Create a demo completed payout
      const demoAmount = Math.floor(Math.random() * 500) + 50; // ₹50-₹550
      const amountMicroUnits = demoAmount * 1000000;
      const orderId = `BH-PAYOUT-DEMO-${user.id}-${Date.now()}`;

      await setDoc(doc(db, "payouts", orderId), {
        order_id: orderId,
        orgId: "demo_org_001",
        huntId: `demo_hunt_${Date.now()}`,
        submissionId: `demo_sub_${Date.now()}`,
        hunterUid: user.id,
        hunterWallet: savedWalletAddress,
        amount: amountMicroUnits,
        currency: "USDC",
        network: "POLYGON",
        status: "completed",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: "demo_admin",
        tx_hash:
          "0xdemo" +
          Math.random().toString(36).substring(7) +
          Math.random().toString(36).substring(7),
        cryptomus_payout_id: "demo_" + Math.random().toString(36).substring(7),
        cryptomus_response: {
          demo: true,
          scenario: "hunter_demo",
        },
      });

      toast.success(`🎉 Demo earning added: ₹${demoAmount} INR!`);

      // Reload data
      setTimeout(() => loadWalletData(), 500);
    } catch (error: any) {
      toast.error("Failed to create demo earning: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatINR = (microUnits: number) => {
    return (microUnits / 1000000).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    });
  };

  const formatShortAddress = (address: string) => {
    if (!address) return "";
    return `${address.substring(0, 6)}...${address.substring(
      address.length - 4
    )}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-[var(--low)]" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-[var(--critical)]" />;
      case "processing":
        return <Clock className="h-4 w-4 text-[var(--medium)]" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      completed: "bg-[color:color-mix(in_srgb,var(--low)_12%,transparent)] text-[var(--low)] border-[color:color-mix(in_srgb,var(--low)_25%,transparent)]",
      failed: "bg-[color:color-mix(in_srgb,var(--critical)_12%,transparent)] text-[var(--critical)] border-[color:color-mix(in_srgb,var(--critical)_25%,transparent)]",
      processing: "bg-[color:color-mix(in_srgb,var(--medium)_12%,transparent)] text-[var(--medium)] border-[color:color-mix(in_srgb,var(--medium)_25%,transparent)]",
      pending_created: "bg-[var(--accent-soft)] text-primary border-[var(--border-light)]",
    };

    return (
      <Badge className={variants[status] || "bg-gray-500/10 text-gray-500"}>
        {status.replace(/_/g, " ").toUpperCase()}
      </Badge>
    );
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold flex items-center gap-3">
              <Wallet className="h-10 w-10 text-primary" />
              My Crypto Wallet
            </h1>
            <p className="text-muted-foreground mt-2">
              Track your bug bounty earnings and manage your wallet
            </p>
          </div>
          <Badge className="bg-primary text-white text-lg px-4 py-2">
            Hunter
          </Badge>
        </div>

        {/* Wallet Setup Alert */}
        {!savedWalletAddress && (
          <Alert className="border-[color:color-mix(in_srgb,var(--medium)_35%,transparent)] bg-[color:color-mix(in_srgb,var(--medium)_10%,transparent)]">
            <AlertCircle className="h-4 w-4 text-[var(--medium)]" />
            <AlertDescription className="text-[var(--medium)]">
              Set up your crypto wallet address to receive bug bounty payments
            </AlertDescription>
          </Alert>
        )}

        {/* Earnings Overview */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="col-span-1 md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-primary" />
                  Total Earnings
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowBalance(!showBalance)}
                >
                  {showBalance ? (
                    <Eye className="h-4 w-4" />
                  ) : (
                    <EyeOff className="h-4 w-4" />
                  )}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-4xl font-bold text-[var(--low)]">
                  {showBalance ? `₹${formatINR(totalEarnings)}` : "••••••"}
                </div>
                <p className="text-sm text-muted-foreground">
                  INR (internal ledger)
                </p>
                {completedPayouts.length > 0 && (
                  <div className="flex items-center gap-1 text-sm text-[var(--low)]">
                    <TrendingUp className="h-4 w-4" />
                    <span>
                      {completedPayouts.length} completed payment
                      {completedPayouts.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Internal Wallet</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-primary">
                  {showBalance ? formatCurrency(walletBalance) : "••••"}
                </div>
                <p className="text-xs text-muted-foreground">
                  Bug hunt rewards balance
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-[var(--medium)]">
                  {showBalance
                    ? `₹${formatINR(
                        pendingPayouts.reduce((sum, p) => sum + p.amount, 0)
                      )}`
                    : "••••"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {pendingPayouts.length} transaction
                  {pendingPayouts.length !== 1 ? "s" : ""}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Failed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-[var(--critical)]">
                  {failedPayouts.length}
                </div>
                <p className="text-xs text-muted-foreground">Requires retry</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Wallet Address Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              Wallet Address
            </CardTitle>
            <CardDescription>
              Your Polygon (MATIC) wallet address for receiving payments
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {savedWalletAddress ? (
              <div className="p-4 rounded-lg bg-muted space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Current Address
                    </p>
                    <p className="font-mono text-lg">{savedWalletAddress}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(savedWalletAddress)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-[color:color-mix(in_srgb,var(--low)_12%,transparent)] text-[var(--low)]">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                  <Badge variant="outline">Polygon Network</Badge>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="wallet">Polygon Wallet Address</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      id="wallet"
                      value={walletAddress}
                      onChange={(e) => setWalletAddress(e.target.value)}
                      placeholder="0x..."
                      className="font-mono"
                    />
                    <Button onClick={saveWalletAddress} disabled={loading}>
                      Save
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Make sure this is a Polygon-compatible wallet (MetaMask,
                    Trust Wallet, etc.)
                  </p>
                </div>
              </div>
            )}

            {savedWalletAddress && (
                <Button
                  onClick={createDemoEarning}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-hover)] text-black"
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Add Demo Earning (Test)
                </Button>
            )}
          </CardContent>
        </Card>

        {/* Transaction History */}
        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
            <CardDescription>
              All your bug bounty payments and their status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="completed">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="completed">
                  Completed ({completedPayouts.length})
                </TabsTrigger>
                <TabsTrigger value="pending">
                  Pending ({pendingPayouts.length})
                </TabsTrigger>
                <TabsTrigger value="failed">
                  Failed ({failedPayouts.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="completed" className="space-y-3 mt-4">
                {completedPayouts.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <CheckCircle2 className="h-16 w-16 mx-auto mb-4 opacity-20" />
                    <p>No completed payments yet</p>
                    <p className="text-sm mt-2">
                      Your earnings will appear here once approved
                    </p>
                  </div>
                ) : (
                  completedPayouts.map((payout) => (
                    <div
                      key={payout.id}
                      className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(payout.status)}
                          <span className="font-mono text-sm text-muted-foreground">
                            {payout.order_id}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg text-[var(--low)]">
                            +₹{formatINR(payout.amount)}
                          </p>
                          {getStatusBadge(payout.status)}
                        </div>
                      </div>
                      {payout.tx_hash && (
                        <div className="flex items-center justify-between mt-3 pt-3 border-t">
                          <p className="text-xs text-muted-foreground font-mono">
                            {payout.tx_hash}
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              window.open(
                                `https://polygonscan.com/tx/${payout.tx_hash}`,
                                "_blank"
                              )
                            }
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            View
                          </Button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </TabsContent>

              <TabsContent value="pending" className="space-y-3 mt-4">
                {pendingPayouts.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Clock className="h-16 w-16 mx-auto mb-4 opacity-20" />
                    <p>No pending payments</p>
                  </div>
                ) : (
                  pendingPayouts.map((payout) => (
                    <div
                      key={payout.id}
                      className="p-4 rounded-lg border bg-card"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(payout.status)}
                          <span className="font-mono text-sm">
                            {payout.order_id}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg text-[var(--medium)]">
                            ₹{formatINR(payout.amount)}
                          </p>
                          {getStatusBadge(payout.status)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>

              <TabsContent value="failed" className="space-y-3 mt-4">
                {failedPayouts.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <CheckCircle2 className="h-16 w-16 mx-auto mb-4 opacity-20" />
                    <p>No failed payments</p>
                  </div>
                ) : (
                  failedPayouts.map((payout) => (
                    <div
                      key={payout.id}
                      className="p-4 rounded-lg border border-[color:color-mix(in_srgb,var(--critical)_25%,transparent)] bg-card"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(payout.status)}
                          <span className="font-mono text-sm">
                            {payout.order_id}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg text-[var(--critical)]">
                            ₹{formatINR(payout.amount)}
                          </p>
                          {getStatusBadge(payout.status)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Info Section */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Demo Mode:</strong> Use "Add Demo Earning" to simulate
            receiving payments. In production, payments are automatically sent
            when your bug submissions are approved.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
