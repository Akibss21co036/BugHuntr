"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, Upload } from "lucide-react";
import { toast } from "sonner";
import { useProApplications } from "@/hooks/use-pro-applications";
import { type ProHunt } from "@/types/pro";

interface ProApplyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hunt: ProHunt;
  hunterId: string;
  hunterName: string;
  hunterRank: string;
}

export function ProApplyModal({
  open,
  onOpenChange,
  hunt,
  hunterId,
  hunterName,
  hunterRank,
}: ProApplyModalProps) {
  const { submitApplication } = useProApplications();
  const [cover, setCover] = useState("");
  const [bidAmount, setBidAmount] = useState("");
  const [agreedToNDA, setAgreedToNDA] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!cover.trim()) {
      toast.error("Please provide a cover letter");
      return;
    }

    if (!agreedToNDA) {
      toast.error("You must agree to the NDA terms");
      return;
    }

    if (hunt.allowBids && !bidAmount) {
      toast.error("Please enter your bid amount");
      return;
    }

    setSubmitting(true);
    try {
      await submitApplication(
        hunt.id,
        hunt.title,
        hunterId,
        hunterName,
        hunterRank,
        cover,
        hunt.allowBids ? parseInt(bidAmount) : undefined
      );
      toast.success("Application submitted successfully!");
      onOpenChange(false);
      setCover("");
      setBidAmount("");
      setAgreedToNDA(false);
    } catch (error) {
      toast.error("Failed to submit application");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#181e26] border-[#23272f] max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Apply to Pro Hunt</DialogTitle>
          <DialogDescription>
            {hunt.title} - {hunt.companyName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Cover Letter */}
          <div>
            <Label>Cover Letter *</Label>
            <p className="text-sm text-gray-400 mb-2">
              Explain your relevant experience, expertise, and why you're a
              great fit for this hunt.
            </p>
            <Textarea
              value={cover}
              onChange={(e) => setCover(e.target.value)}
              placeholder="I have extensive experience in..."
              rows={8}
              className="bg-[#10151c] border-[#23272f]"
            />
          </div>

          {/* Bid Amount (if allowed) */}
          {hunt.allowBids && (
            <div>
              <Label>Your Bid (USD) *</Label>
              <p className="text-sm text-gray-400 mb-2">
                Enter your proposed compensation for participating in this hunt.
              </p>
              <Input
                type="number"
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                placeholder="5000"
                className="bg-[#10151c] border-[#23272f]"
              />
            </div>
          )}

          {/* File Attachments */}
          <div>
            <Label>Attachments (Optional)</Label>
            <p className="text-sm text-gray-400 mb-2">
              Upload certifications, portfolio, or other supporting documents
            </p>
            <div className="border-2 border-dashed border-[#23272f] rounded-lg p-8 text-center bg-[#10151c] hover:border-blue-500/30 transition-colors cursor-pointer">
              <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-400">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-gray-500 mt-1">
                PDF, DOC, or images (max 10MB)
              </p>
            </div>
          </div>

          {/* NDA Preview */}
          <div>
            <Label>Non-Disclosure Agreement</Label>
            <div className="mt-2 bg-[#10151c] border border-[#23272f] rounded-lg p-4 max-h-48 overflow-y-auto">
              <pre className="text-xs text-gray-400 whitespace-pre-wrap">
                {hunt.ndaTemplateText.substring(0, 500)}...
              </pre>
            </div>
          </div>

          {/* NDA Agreement Checkbox */}
          <div className="flex items-start space-x-3 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <Checkbox
              id="nda-agree"
              checked={agreedToNDA}
              onCheckedChange={(checked: boolean) => setAgreedToNDA(checked)}
            />
            <div className="flex-1">
              <label
                htmlFor="nda-agree"
                className="text-sm font-medium cursor-pointer"
              >
                I agree to the Non-Disclosure Agreement *
              </label>
              <p className="text-xs text-gray-400 mt-1">
                By checking this box, you acknowledge that you have read and
                agree to be bound by the terms of the NDA. Upon acceptance to
                this hunt, you will be required to provide a formal digital
                signature.
              </p>
            </div>
          </div>

          {/* Requirements Notice */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
            <h4 className="font-semibold text-amber-400 mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Important Requirements
            </h4>
            <ul className="text-sm text-gray-300 space-y-1">
              {hunt.requireKYC && (
                <li>• KYC verification will be required if accepted</li>
              )}
              {hunt.requireCerts && (
                <li>• Certification verification may be requested</li>
              )}
              <li>• Formal NDA signature required before access is granted</li>
              <li>
                • All testing must remain within specified target segments
              </li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !agreedToNDA}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {submitting ? "Submitting..." : "Submit Application"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
