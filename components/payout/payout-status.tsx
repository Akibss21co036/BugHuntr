/**
 * Payout Status Component for Hunters
 *
 * Displays payout status on approved bug submissions.
 * Shows order ID, current status, and transaction link when completed.
 */

"use client";

import { useState, useEffect } from "react";
import { usePayouts } from "@/hooks/use-payout";
import type { Payout } from "@/types/payout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle2,
  Clock,
  RefreshCw,
  XCircle,
  ExternalLink,
  AlertCircle,
  Coins,
} from "lucide-react";

interface PayoutStatusProps {
  submissionId: string;
  huntId: string;
}

export function PayoutStatus({ submissionId, huntId }: PayoutStatusProps) {
  const { getPayout, subscribeToPayout } = usePayouts();
  const [payout, setPayout] = useState<Payout | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    loadPayout();
  }, [submissionId, huntId]);

  const loadPayout = async () => {
    try {
      setLoading(true);
      const order_id = `BH-PAYOUT-${huntId}-${submissionId}`;
      const payoutData = await getPayout(order_id);

      if (!payoutData) {
        // Try without huntId
        const altOrderId = `BH-PAYOUT-${submissionId}`;
        const altPayoutData = await getPayout(altOrderId);

        if (altPayoutData) {
          setPayout(altPayoutData);
          // Subscribe to updates
          subscribeToPayout(altOrderId, (updated) => setPayout(updated));
        } else {
          setNotFound(true);
        }
      } else {
        setPayout(payoutData);
        // Subscribe to updates
        subscribeToPayout(order_id, (updated) => setPayout(updated));
      }
    } catch (err) {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const getExplorerUrl = (txHash: string, network: string) => {
    const explorers: Record<string, string> = {
      POLYGON: `https://polygonscan.com/tx/${txHash}`,
      ETHEREUM: `https://etherscan.io/tx/${txHash}`,
      BSC: `https://bscscan.com/tx/${txHash}`,
      TRON: `https://tronscan.org/#/transaction/${txHash}`,
    };
    return explorers[network] || `https://blockscan.com/tx/${txHash}`;
  };

  const formatAmount = (amount: number, currency: string) => {
    // Assuming 6 decimals for USDC/USDT
    const decimals = ["USDC", "USDT"].includes(currency) ? 6 : 18;
    const fullAmount = amount / Math.pow(10, decimals);
    return fullAmount.toFixed(decimals);
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, any> = {
      pending_created: {
        icon: Clock,
        color: "text-[var(--medium)]",
        bg: "bg-secondary",
        label: "Payout Pending",
        description: "Your payout is being prepared...",
      },
      processing: {
        icon: RefreshCw,
        color: "text-primary",
        bg: "bg-secondary",
        label: "Processing",
        description: "Your payout is being processed on the blockchain...",
        animate: true,
      },
      completed: {
        icon: CheckCircle2,
        color: "text-[var(--low)]",
        bg: "bg-secondary",
        label: "Completed",
        description: "Your payout has been successfully sent!",
      },
      failed: {
        icon: XCircle,
        color: "text-[var(--critical)]",
        bg: "bg-secondary",
        label: "Failed",
        description: "Payout failed. Our team will retry shortly.",
      },
      cancelled: {
        icon: AlertCircle,
        color: "text-gray-600",
        bg: "bg-gray-100",
        label: "Cancelled",
        description: "This payout was cancelled.",
      },
    };

    return configs[status] || configs["pending_created"];
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
    );
  }

  if (notFound || !payout) {
    return null; // Don't show anything if no payout exists yet
  }

  const statusConfig = getStatusConfig(payout.status);
  const StatusIcon = statusConfig.icon;
  const method = payout.method || "crypto";
  const bankDestination =
    payout.destination && payout.destination.type === "bank"
      ? payout.destination
      : null;
  const displayDestination = bankDestination
    ? `${bankDestination.bankName} • ${bankDestination.accountNumber.slice(-4)}`
    : payout.hunterWallet;

  return (
    <Card className={statusConfig.bg}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Coins className={`w-5 h-5 ${statusConfig.color}`} />
            <CardTitle className={statusConfig.color}>
              {statusConfig.label}
            </CardTitle>
          </div>
          <Badge variant="outline">
            {method === "crypto"
              ? `${payout.currency} on ${payout.network}`
              : "Bank Transfer"}
          </Badge>
        </div>
        <CardDescription>{statusConfig.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Amount */}
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold">
            {formatAmount(payout.amount, payout.currency)}
          </span>
          <span className="text-lg font-semibold text-muted-foreground">
            {payout.currency}
          </span>
        </div>

        {/* Status Icon */}
        <div className="flex items-center gap-2">
          <StatusIcon
            className={`w-6 h-6 ${statusConfig.color} ${
              statusConfig.animate ? "animate-spin" : ""
            }`}
          />
          <span className={`font-medium ${statusConfig.color}`}>
            {statusConfig.label}
          </span>
        </div>

        {/* Order ID */}
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Order ID</p>
          <p className="font-mono text-sm">{payout.order_id}</p>
        </div>

        {/* Wallet Address */}
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Recipient Address</p>
          <p className="font-mono text-sm break-all">{displayDestination}</p>
        </div>

        {/* Transaction Hash (if completed) */}
        {payout.tx_hash && method === "crypto" && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Transaction Hash</p>
            <Button variant="outline" size="sm" asChild className="w-full">
              <a
                href={getExplorerUrl(payout.tx_hash, payout.network)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between"
              >
                <span className="font-mono text-xs">
                  {payout.tx_hash.substring(0, 16)}...
                  {payout.tx_hash.substring(payout.tx_hash.length - 8)}
                </span>
                <ExternalLink className="w-4 h-4 ml-2" />
              </a>
            </Button>
          </div>
        )}

        {/* Error Message (if failed) */}
        {payout.status === "failed" && payout.error && (
          <div className="p-3 bg-[color:color-mix(in_srgb,var(--critical)_10%,transparent)] border border-[color:color-mix(in_srgb,var(--critical)_25%,transparent)] rounded-md">
            <p className="text-sm text-[var(--critical)]">
              <strong>Error:</strong> {payout.error.message}
            </p>
            <p className="text-xs text-[var(--critical)] mt-1">
              Our team has been notified and will retry the payout.
            </p>
          </div>
        )}

        {/* Timestamp */}
        <div className="text-xs text-muted-foreground">
          {payout.status === "completed" ? "Completed" : "Created"} on{" "}
          {payout.updatedAt.toLocaleDateString()} at{" "}
          {payout.updatedAt.toLocaleTimeString()}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Compact version for inline display in submission cards
 */
export function PayoutStatusBadge({ submissionId, huntId }: PayoutStatusProps) {
  const { getPayout } = usePayouts();
  const [payout, setPayout] = useState<Payout | null>(null);

  useEffect(() => {
    loadPayout();
  }, [submissionId, huntId]);

  const loadPayout = async () => {
    try {
      const order_id = `BH-PAYOUT-${huntId}-${submissionId}`;
      const payoutData = await getPayout(order_id);

      if (!payoutData) {
        const altOrderId = `BH-PAYOUT-${submissionId}`;
        setPayout(await getPayout(altOrderId));
      } else {
        setPayout(payoutData);
      }
    } catch (err) {
      // Silently fail
    }
  };

  if (!payout) return null;

  const statusIcons: Record<string, any> = {
    pending_created: Clock,
    processing: RefreshCw,
    completed: CheckCircle2,
    failed: XCircle,
    cancelled: AlertCircle,
  };

  const statusColors: Record<string, string> = {
    pending_created: "bg-secondary text-[var(--medium)]",
    processing: "bg-secondary text-primary",
    completed: "bg-secondary text-[var(--low)]",
    failed: "bg-secondary text-[var(--critical)]",
    cancelled: "bg-gray-100 text-gray-800",
  };

  const Icon = statusIcons[payout.status] || Clock;

  return (
    <Badge
      className={statusColors[payout.status] || "bg-gray-100 text-gray-800"}
    >
      <Icon className="w-3 h-3 mr-1" />
      Payout: {payout.status.replace("_", " ")}
    </Badge>
  );
}
