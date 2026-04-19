"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Briefcase,
  MapPin,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { type ProOffer } from "@/types/pro";
import { toast } from "sonner";

interface ProOffersPanelProps {
  offers: ProOffer[];
  onRespond?: (offerId: string, accept: boolean) => void;
}

export function ProOffersPanel({ offers, onRespond }: ProOffersPanelProps) {
  const [responding, setResponding] = useState<string | null>(null);

  const handleRespond = async (offerId: string, accept: boolean) => {
    setResponding(offerId);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast.success(accept ? "Offer accepted!" : "Offer declined");
      onRespond?.(offerId, accept);
    } catch (error) {
      toast.error("Failed to respond to offer");
    } finally {
      setResponding(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "issued":
        return "bg-primary";
      case "accepted":
        return "bg-[var(--low)]";
      case "declined":
        return "bg-[var(--critical)]";
      case "expired":
        return "bg-gray-600";
      default:
        return "bg-gray-600";
    }
  };

  const getOfferTypeIcon = (type: string) => {
    return type === "job" ? Briefcase : Clock;
  };

  if (offers.length === 0) {
    return (
      <Card className="bg-[#181e26] border-[#23272f]">
        <CardContent className="py-12 text-center">
          <Briefcase className="w-16 h-16 mx-auto mb-4 text-gray-600" />
          <h3 className="text-xl font-bold mb-2">No Offers Yet</h3>
          <p className="text-gray-400">
            Companies may extend job or internship offers based on your
            performance in Pro hunts.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold mb-2">Talent Pipeline Offers</h2>
        <p className="text-gray-400">
          Job and internship opportunities from companies
        </p>
      </div>

      {offers.map((offer) => {
        const Icon = getOfferTypeIcon(offer.offerType);
        const isPending = offer.status === "issued";
        const isExpiringSoon =
          new Date(offer.expiresAt).getTime() - Date.now() <
          7 * 24 * 60 * 60 * 1000;

        return (
          <Card
            key={offer.id}
            className="bg-[#181e26] border-[#23272f] hover:border-[var(--border-light)] transition-colors"
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-12 h-12 bg-[var(--accent-soft)] border border-[var(--border-light)] rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <CardTitle className="text-lg">
                        {offer.roleTitle}
                      </CardTitle>
                      <Badge
                        className={`text-xs ${
                          offer.offerType === "job"
                            ? "bg-secondary"
                            : "bg-primary"
                        }`}
                      >
                        {offer.offerType === "job" ? "Full-Time" : "Internship"}
                      </Badge>
                    </div>
                    <CardDescription>
                      {offer.companyName} • {offer.location}
                    </CardDescription>
                  </div>
                </div>
                <Badge className={getStatusColor(offer.status)}>
                  {offer.status.toUpperCase()}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Role Details */}
              <p className="text-sm text-gray-300">{offer.roleDetails}</p>

              {/* Offer Details */}
              <div className="grid grid-cols-2 gap-4">
                {offer.salary && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-[var(--low)]" />
                    <div>
                      <p className="text-xs text-gray-400">Salary</p>
                      <p className="text-sm font-semibold">{offer.salary}</p>
                    </div>
                  </div>
                )}
                {offer.duration && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    <div>
                      <p className="text-xs text-gray-400">Duration</p>
                      <p className="text-sm font-semibold">{offer.duration}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-secondary" />
                  <div>
                    <p className="text-xs text-gray-400">Location</p>
                    <p className="text-sm font-semibold">{offer.location}</p>
                  </div>
                </div>
              </div>

              {/* Related Hunt */}
              <div className="text-xs text-gray-500">
                Based on your performance in:{" "}
                <span className="text-gray-400 font-semibold">
                  {offer.huntTitle}
                </span>
              </div>

              {/* Expiration Warning */}
              {isPending && isExpiringSoon && (
                <div className="bg-[color:color-mix(in_srgb,var(--medium)_12%,transparent)] border border-[color:color-mix(in_srgb,var(--high)_25%,transparent)] rounded-lg p-3">
                  <p className="text-sm text-[var(--high)]">
                    ⚠️ Offer expires on{" "}
                    {new Date(offer.expiresAt).toLocaleDateString()}
                  </p>
                </div>
              )}

              {/* Actions */}
              {isPending && (
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={() => handleRespond(offer.id, true)}
                    disabled={responding === offer.id}
                    className="flex-1 bg-[var(--low)] hover:bg-[color:color-mix(in_srgb,var(--low)_85%,black)]"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Accept Offer
                  </Button>
                  <Button
                    onClick={() => handleRespond(offer.id, false)}
                    disabled={responding === offer.id}
                    variant="outline"
                    className="flex-1"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Decline
                  </Button>
                </div>
              )}

              {offer.status === "accepted" && offer.acceptedAt && (
                <div className="bg-[color:color-mix(in_srgb,var(--low)_12%,transparent)] border border-[color:color-mix(in_srgb,var(--low)_25%,transparent)] rounded-lg p-3">
                  <p className="text-sm text-[var(--low)]">
                    ✓ Accepted on{" "}
                    {new Date(offer.acceptedAt).toLocaleDateString()}
                  </p>
                </div>
              )}

              {offer.status === "declined" && offer.declinedAt && (
                <div className="bg-gray-500/10 border border-gray-500/30 rounded-lg p-3">
                  <p className="text-sm text-gray-400">
                    Declined on{" "}
                    {new Date(offer.declinedAt).toLocaleDateString()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
