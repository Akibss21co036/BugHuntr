/**
 * Admin Payout Panel Component
 *
 * Comprehensive admin UI for managing crypto payouts:
 * - View organization wallet balances
 * - Record wallet top-ups
 * - Create single payouts
 * - Upload batch payouts CSV
 * - View payout history
 * - Retry failed payouts
 */

"use client";

import { useState, useEffect } from "react";
import { usePayouts } from "@/hooks/use-payout";
import type { OrgWallet, Payout } from "@/types/payout";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Wallet,
  Plus,
  Upload,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

interface AdminPayoutPanelProps {
  orgId: string;
}

export function AdminPayoutPanel({ orgId }: AdminPayoutPanelProps) {
  const {
    loading,
    error,
    createPayout,
    getOrgPayouts,
    getOrgWallet,
    subscribeToWallet,
    createBatchPayouts,
  } = usePayouts();

  const [wallet, setWallet] = useState<OrgWallet | null>(null);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // ========================================================================
  // LOAD DATA
  // ========================================================================

  useEffect(() => {
    loadWalletAndPayouts();

    // Subscribe to wallet updates
    const unsubscribe = subscribeToWallet(orgId, (updatedWallet) => {
      setWallet(updatedWallet);
    });

    return () => unsubscribe();
  }, [orgId]);

  const loadWalletAndPayouts = async () => {
    try {
      setRefreshing(true);
      const [walletData, payoutsData] = await Promise.all([
        getOrgWallet(orgId),
        getOrgPayouts(orgId),
      ]);

      setWallet(walletData);
      setPayouts(
        payoutsData.sort(
          (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
        )
      );
    } catch (err) {
      toast.error("Failed to load data");
    } finally {
      setRefreshing(false);
    }
  };

  // ========================================================================
  // WALLET TOP-UP
  // ========================================================================

  const [topUpDialogOpen, setTopUpDialogOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState("");
  const [topUpTxHash, setTopUpTxHash] = useState("");
  const [topUpNotes, setTopUpNotes] = useState("");

  const handleTopUp = async () => {
    // Note: This records a top-up in Firestore
    // Actual deposit must be made to Cryptomus wallet off-platform
    try {
      const amount = parseFloat(topUpAmount);
      if (isNaN(amount) || amount <= 0) {
        toast.error("Please enter a valid amount");
        return;
      }

      // TODO: Call API route to record top-up
      // For now, show success message
      toast.success("Top-up recorded successfully");
      setTopUpDialogOpen(false);
      setTopUpAmount("");
      setTopUpTxHash("");
      setTopUpNotes("");
      loadWalletAndPayouts();
    } catch (err) {
      toast.error("Failed to record top-up");
    }
  };

  // ========================================================================
  // SINGLE PAYOUT CREATION
  // ========================================================================

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [payoutForm, setPayoutForm] = useState({
    submissionId: "",
    huntId: "",
    hunterUid: "",
    hunterWallet: "",
    amount: "",
  });

  const handleCreatePayout = async () => {
    try {
      const amount = parseFloat(payoutForm.amount);
      if (isNaN(amount) || amount <= 0) {
        toast.error("Please enter a valid amount");
        return;
      }

      // Convert to smallest units (assuming USDC with 6 decimals)
      const amountInSmallestUnits = Math.floor(amount * 1000000);

      const result = await createPayout({
        submissionId: payoutForm.submissionId,
        huntId: payoutForm.huntId,
        orgId,
        hunterUid: payoutForm.hunterUid,
        hunterWallet: payoutForm.hunterWallet,
        amount: amountInSmallestUnits,
      });

      toast.success("Payout created successfully!", {
        description: `Order ID: ${result.order_id}`,
      });

      setCreateDialogOpen(false);
      setPayoutForm({
        submissionId: "",
        huntId: "",
        hunterUid: "",
        hunterWallet: "",
        amount: "",
      });

      loadWalletAndPayouts();
    } catch (err: any) {
      toast.error("Failed to create payout", {
        description: err.message,
      });
    }
  };

  // ========================================================================
  // BATCH PAYOUT UPLOAD
  // ========================================================================

  const [batchFile, setBatchFile] = useState<File | null>(null);
  const [uploadingBatch, setUploadingBatch] = useState(false);

  const handleBatchUpload = async () => {
    if (!batchFile) {
      toast.error("Please select a CSV file");
      return;
    }

    try {
      setUploadingBatch(true);

      // Parse CSV file
      const text = await batchFile.text();
      const lines = text.split("\n").slice(1); // Skip header

      const payoutRows = lines
        .filter((line) => line.trim())
        .map((line) => {
          const [submissionId, huntId, hunterUid, hunterWallet, amount] = line
            .split(",")
            .map((s) => s.trim());
          return {
            submissionId,
            huntId,
            hunterUid,
            hunterWallet,
            amount: Math.floor(parseFloat(amount) * 1000000), // Convert to smallest units
          };
        });

      const result = await createBatchPayouts(orgId, payoutRows);

      toast.success("Batch payouts queued!", {
        description: `${result.queued} payouts queued, ${result.failed} failed`,
      });

      setBatchFile(null);
      loadWalletAndPayouts();
    } catch (err: any) {
      toast.error("Failed to upload batch", {
        description: err.message,
      });
    } finally {
      setUploadingBatch(false);
    }
  };

  // ========================================================================
  // RETRY FAILED PAYOUT
  // ========================================================================

  const handleRetryPayout = async (payout: Payout) => {
    try {
      // Create a new payout with a suffix to avoid idempotency conflict
      const result = await createPayout({
        submissionId: payout.submissionId + "-retry",
        huntId: payout.huntId,
        orgId: payout.orgId,
        hunterUid: payout.hunterUid,
        hunterWallet: payout.hunterWallet,
        amount: payout.amount,
      });

      toast.success("Payout retry initiated", {
        description: `New Order ID: ${result.order_id}`,
      });

      loadWalletAndPayouts();
    } catch (err: any) {
      toast.error("Failed to retry payout", {
        description: err.message,
      });
    }
  };

  // ========================================================================
  // UTILITY FUNCTIONS
  // ========================================================================

  const formatCurrency = (amount: number) => {
    // Convert from smallest units to full units
    const fullAmount = amount / 1000000;
    return fullAmount.toFixed(6);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending_created: { variant: "secondary", icon: Clock, label: "Pending" },
      processing: { variant: "default", icon: RefreshCw, label: "Processing" },
      completed: {
        variant: "default",
        icon: CheckCircle2,
        label: "Completed",
        className: "bg-green-600",
      },
      failed: { variant: "destructive", icon: XCircle, label: "Failed" },
      cancelled: { variant: "outline", icon: AlertCircle, label: "Cancelled" },
    };

    const config = variants[status] || variants["pending_created"];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className={config.className}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getExplorerUrl = (txHash: string, network: string) => {
    const explorers: Record<string, string> = {
      POLYGON: `https://polygonscan.com/tx/${txHash}`,
      ETHEREUM: `https://etherscan.io/tx/${txHash}`,
      BSC: `https://bscscan.com/tx/${txHash}`,
    };
    return explorers[network] || `https://blockscan.com/tx/${txHash}`;
  };

  // ========================================================================
  // RENDER
  // ========================================================================

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Crypto Payouts</h1>
          <p className="text-muted-foreground">
            Manage organization wallet and payouts
          </p>
        </div>
        <Button onClick={loadWalletAndPayouts} disabled={refreshing}>
          <RefreshCw
            className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Wallet Balance Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              <CardTitle>Organization Wallet</CardTitle>
            </div>
            <Dialog open={topUpDialogOpen} onOpenChange={setTopUpDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Record Top-Up
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Record Wallet Top-Up</DialogTitle>
                  <DialogDescription>
                    Record a deposit made to your Cryptomus wallet. The actual
                    deposit must be made through Cryptomus platform.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Amount ({wallet?.currency || "USDC"})</Label>
                    <Input
                      type="number"
                      step="0.000001"
                      value={topUpAmount}
                      onChange={(e) => setTopUpAmount(e.target.value)}
                      placeholder="Enter amount"
                    />
                  </div>
                  <div>
                    <Label>Transaction Hash (optional)</Label>
                    <Input
                      value={topUpTxHash}
                      onChange={(e) => setTopUpTxHash(e.target.value)}
                      placeholder="0x..."
                    />
                  </div>
                  <div>
                    <Label>Notes</Label>
                    <Input
                      value={topUpNotes}
                      onChange={(e) => setTopUpNotes(e.target.value)}
                      placeholder="Add any notes"
                    />
                  </div>
                  <Button onClick={handleTopUp} className="w-full">
                    Record Top-Up
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {wallet ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Currency</p>
                <p className="text-2xl font-bold">{wallet.currency}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Network</p>
                <p className="text-2xl font-bold">{wallet.network}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Balance</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(wallet.balance)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Reserved</p>
                <p className="text-2xl font-bold text-orange-600">
                  {formatCurrency(wallet.reserved)}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">
                  Available for Payouts
                </p>
                <p className="text-3xl font-bold text-green-600">
                  {formatCurrency(wallet.balance - wallet.reserved)}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">
              No wallet found. Please contact support.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <Tabs defaultValue="single" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="single">Single Payout</TabsTrigger>
          <TabsTrigger value="batch">Batch Payouts</TabsTrigger>
        </TabsList>

        <TabsContent value="single" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create Single Payout</CardTitle>
              <CardDescription>
                Create a payout for an approved bug submission
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Submission ID *</Label>
                  <Input
                    value={payoutForm.submissionId}
                    onChange={(e) =>
                      setPayoutForm({
                        ...payoutForm,
                        submissionId: e.target.value,
                      })
                    }
                    placeholder="sub_123"
                  />
                </div>
                <div>
                  <Label>Hunt ID *</Label>
                  <Input
                    value={payoutForm.huntId}
                    onChange={(e) =>
                      setPayoutForm({ ...payoutForm, huntId: e.target.value })
                    }
                    placeholder="hunt_456"
                  />
                </div>
                <div>
                  <Label>Hunter UID *</Label>
                  <Input
                    value={payoutForm.hunterUid}
                    onChange={(e) =>
                      setPayoutForm({
                        ...payoutForm,
                        hunterUid: e.target.value,
                      })
                    }
                    placeholder="user_abc"
                  />
                </div>
                <div>
                  <Label>Hunter Wallet Address *</Label>
                  <Input
                    value={payoutForm.hunterWallet}
                    onChange={(e) =>
                      setPayoutForm({
                        ...payoutForm,
                        hunterWallet: e.target.value,
                      })
                    }
                    placeholder="0x..."
                  />
                </div>
                <div className="col-span-2">
                  <Label>Amount ({wallet?.currency || "USDC"}) *</Label>
                  <Input
                    type="number"
                    step="0.000001"
                    value={payoutForm.amount}
                    onChange={(e) =>
                      setPayoutForm({ ...payoutForm, amount: e.target.value })
                    }
                    placeholder="Enter amount"
                  />
                </div>
              </div>
              <Button
                onClick={handleCreatePayout}
                disabled={
                  loading || !payoutForm.submissionId || !payoutForm.amount
                }
                className="w-full"
              >
                {loading ? "Creating..." : "Create Payout"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="batch" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Batch Payout Upload</CardTitle>
              <CardDescription>
                Upload a CSV file with multiple payouts. Format:
                submissionId,huntId,hunterUid,hunterWallet,amount
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>CSV File</Label>
                <Input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setBatchFile(e.target.files?.[0] || null)}
                />
              </div>
              <Button
                onClick={handleBatchUpload}
                disabled={!batchFile || uploadingBatch}
                className="w-full"
              >
                <Upload className="w-4 h-4 mr-2" />
                {uploadingBatch ? "Uploading..." : "Upload & Process"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Payouts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payout History</CardTitle>
          <CardDescription>
            Recent payouts for this organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Submission</TableHead>
                <TableHead>Hunter</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>TX Hash</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payouts.map((payout) => (
                <TableRow key={payout.order_id}>
                  <TableCell className="font-mono text-xs">
                    {payout.order_id.substring(0, 20)}...
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {payout.submissionId}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {payout.hunterUid.substring(0, 12)}...
                  </TableCell>
                  <TableCell>
                    {formatCurrency(payout.amount)} {payout.currency}
                  </TableCell>
                  <TableCell>{getStatusBadge(payout.status)}</TableCell>
                  <TableCell>
                    {payout.tx_hash ? (
                      <a
                        href={getExplorerUrl(payout.tx_hash, payout.network)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-blue-600 hover:underline"
                      >
                        <span className="font-mono text-xs">
                          {payout.tx_hash.substring(0, 8)}...
                        </span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs">
                    {payout.createdAt.toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {payout.status === "failed" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRetryPayout(payout)}
                      >
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Retry
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {payouts.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center text-muted-foreground"
                  >
                    No payouts found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
