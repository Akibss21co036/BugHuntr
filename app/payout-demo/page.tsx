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
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Zap,
  DollarSign,
  Send,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { db } from "@/firebaseConfig";
import {
  doc,
  setDoc,
  getDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";

export default function PayoutDemoPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [demoOrgId, setDemoOrgId] = useState("demo_org_001");
  const [demoWallet, setDemoWallet] = useState({
    balance: 10000000000, // 10,000 USDC in micro-units
    reserved: 0,
  });
  const [demoPayouts, setDemoPayouts] = useState<any[]>([]);

  // Demo payout form
  const [payoutAmount, setPayoutAmount] = useState("100");
  const [hunterWallet, setHunterWallet] = useState(
    "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
  );

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    // Load demo data
    loadDemoData();
  }, [isAuthenticated]);

  const loadDemoData = async () => {
    try {
      // Check if demo wallet exists
      const walletRef = doc(db, "org_wallets", demoOrgId);
      const walletDoc = await getDoc(walletRef);

      if (walletDoc.exists()) {
        setDemoWallet(walletDoc.data() as any);
      }
    } catch (error) {
      console.error("Error loading demo data:", error);
    }
  };

  const initializeDemoWallet = async () => {
    setLoading(true);
    try {
      const walletRef = doc(db, "org_wallets", demoOrgId);

      await setDoc(walletRef, {
        orgId: demoOrgId,
        orgName: "Demo Organization",
        balance: 10000000000, // 10,000 USDC
        reserved: 0,
        currency: "USDC",
        network: "POLYGON",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastTopUpAt: serverTimestamp(),
        totalTopUps: 10000000000,
        totalPayouts: 0,
      });

      setDemoWallet({
        balance: 10000000000,
        reserved: 0,
      });

      toast.success("Demo wallet initialized with 10,000 USDC!");
    } catch (error: any) {
      toast.error("Failed to initialize wallet: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const createDemoPayout = async (
    scenario: "success" | "processing" | "failed"
  ) => {
    setLoading(true);
    try {
      const amount = parseFloat(payoutAmount);
      const amountMicroUnits = Math.floor(amount * 1000000);

      const orderId = `BH-PAYOUT-DEMO-${Date.now()}`;
      const payoutRef = doc(db, "payouts", orderId);

      const newPayout = {
        order_id: orderId,
        orgId: demoOrgId,
        huntId: "demo_hunt_001",
        submissionId: "demo_sub_001",
        hunterUid: user?.id || "demo_hunter",
        hunterWallet: hunterWallet,
        amount: amountMicroUnits,
        currency: "USDC",
        network: "POLYGON",
        status:
          scenario === "success"
            ? "completed"
            : scenario === "failed"
            ? "failed"
            : "processing",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: user?.id || "demo_admin",
        tx_hash:
          scenario === "success"
            ? "0xdemo" + Math.random().toString(36).substring(7)
            : null,
        cryptomus_payout_id: "demo_" + Math.random().toString(36).substring(7),
        cryptomus_response: {
          demo: true,
          scenario: scenario,
        },
      };

      await setDoc(payoutRef, newPayout);

      // Update wallet balance for demo
      if (scenario === "success") {
        const walletRef = doc(db, "org_wallets", demoOrgId);
        await setDoc(
          walletRef,
          {
            balance: demoWallet.balance - amountMicroUnits,
            reserved: demoWallet.reserved,
            updatedAt: serverTimestamp(),
            totalPayouts: amountMicroUnits,
          },
          { merge: true }
        );

        setDemoWallet((prev) => ({
          ...prev,
          balance: prev.balance - amountMicroUnits,
        }));
      }

      setDemoPayouts((prev) => [newPayout, ...prev]);

      toast.success(
        scenario === "success"
          ? `✅ Demo payout successful! $${amount} USDC sent`
          : scenario === "failed"
          ? "❌ Demo payout failed (as expected)"
          : "⏳ Demo payout processing..."
      );
    } catch (error: any) {
      toast.error("Failed to create demo payout: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatUSDC = (microUnits: number) => {
    return (microUnits / 1000000).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "failed":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "processing":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      completed: "bg-green-500/10 text-green-500 border-green-500/20",
      failed: "bg-red-500/10 text-red-500 border-red-500/20",
      processing: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      pending_created: "bg-blue-500/10 text-blue-500 border-blue-500/20",
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
              <Zap className="h-10 w-10 text-cyber-blue" />
              Crypto Payout Demo
            </h1>
            <p className="text-muted-foreground mt-2">
              Test the automated payout system with simulated transactions
            </p>
          </div>
          <Badge className="bg-orange-500 text-white text-lg px-4 py-2">
            DEMO MODE
          </Badge>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This is a demonstration environment. No real cryptocurrency
            transactions will be made. All data shown here is for testing
            purposes only.
          </AlertDescription>
        </Alert>

        {/* Wallet Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-6 w-6 text-cyber-blue" />
              Demo Organization Wallet
            </CardTitle>
            <CardDescription>
              Simulated USDC balance on Polygon network
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground">Total Balance</p>
                <p className="text-2xl font-bold text-cyber-blue">
                  ${formatUSDC(demoWallet.balance)}
                </p>
                <p className="text-xs text-muted-foreground">USDC</p>
              </div>
              <div className="p-4 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground">Reserved</p>
                <p className="text-2xl font-bold text-yellow-500">
                  ${formatUSDC(demoWallet.reserved)}
                </p>
                <p className="text-xs text-muted-foreground">USDC</p>
              </div>
              <div className="p-4 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground">Available</p>
                <p className="text-2xl font-bold text-green-500">
                  ${formatUSDC(demoWallet.balance - demoWallet.reserved)}
                </p>
                <p className="text-xs text-muted-foreground">USDC</p>
              </div>
            </div>

            {demoWallet.balance === 0 && (
              <Button
                onClick={initializeDemoWallet}
                disabled={loading}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Initialize Demo Wallet (10,000 USDC)
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Demo Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Create Demo Payout</CardTitle>
            <CardDescription>
              Simulate different payout scenarios
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount">Amount (USDC)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  placeholder="100.00"
                />
              </div>
              <div>
                <Label htmlFor="wallet">Hunter Wallet Address</Label>
                <Input
                  id="wallet"
                  value={hunterWallet}
                  onChange={(e) => setHunterWallet(e.target.value)}
                  placeholder="0x..."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                onClick={() => createDemoPayout("success")}
                disabled={loading || demoWallet.balance === 0}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Simulate Success
              </Button>
              <Button
                onClick={() => createDemoPayout("processing")}
                disabled={loading || demoWallet.balance === 0}
                className="bg-yellow-600 hover:bg-yellow-700"
              >
                <Clock className="h-4 w-4 mr-2" />
                Simulate Processing
              </Button>
              <Button
                onClick={() => createDemoPayout("failed")}
                disabled={loading || demoWallet.balance === 0}
                variant="destructive"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Simulate Failure
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Payout History */}
        <Card>
          <CardHeader>
            <CardTitle>Demo Payout History</CardTitle>
            <CardDescription>Recently simulated transactions</CardDescription>
          </CardHeader>
          <CardContent>
            {demoPayouts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Send className="h-16 w-16 mx-auto mb-4 opacity-20" />
                <p>No demo payouts yet. Create one above!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {demoPayouts.map((payout, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(payout.status)}
                        <div>
                          <p className="font-mono text-sm">{payout.order_id}</p>
                          <p className="text-xs text-muted-foreground">
                            {payout.hunterWallet.substring(0, 12)}...
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">
                          ${formatUSDC(payout.amount)}
                        </p>
                        {getStatusBadge(payout.status)}
                      </div>
                    </div>
                    {payout.tx_hash && (
                      <div className="mt-2 pt-2 border-t">
                        <p className="text-xs text-muted-foreground">
                          TX Hash:{" "}
                          <span className="font-mono">{payout.tx_hash}</span>
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">How It Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                1. <strong>Initialize</strong> - Set up demo wallet with virtual
                funds
              </p>
              <p>
                2. <strong>Create Payout</strong> - Enter amount and wallet
                address
              </p>
              <p>
                3. <strong>Simulate</strong> - Choose success, processing, or
                failure
              </p>
              <p>
                4. <strong>Observe</strong> - Watch balance update and
                transaction appear
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Scenario Explanations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                ✅ <strong>Success</strong> - Funds deducted, TX hash generated
              </p>
              <p>
                ⏳ <strong>Processing</strong> - Funds reserved, awaiting
                blockchain
              </p>
              <p>
                ❌ <strong>Failure</strong> - Error occurred, funds stay in
                wallet
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
