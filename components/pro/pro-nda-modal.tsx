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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileSignature, Shield } from "lucide-react";
import { toast } from "sonner";
import { generateNDASignatureHash } from "@/lib/pro-utils";

interface ProNdaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  huntId: string;
  huntTitle: string;
  companyName: string;
  ndaText: string;
  hunterId: string;
  hunterName: string;
  onSign?: (signatureHash: string) => void;
}

export function ProNdaModal({
  open,
  onOpenChange,
  huntId,
  huntTitle,
  companyName,
  ndaText,
  hunterId,
  hunterName,
  onSign,
}: ProNdaModalProps) {
  const [fullName, setFullName] = useState(hunterName);
  const [signing, setSigning] = useState(false);

  const handleSign = async () => {
    if (!fullName.trim()) {
      toast.error("Please enter your full name");
      return;
    }

    setSigning(true);
    try {
      const timestamp = new Date().toISOString();
      const signatureHash = generateNDASignatureHash(
        ndaText,
        hunterId,
        timestamp
      );

      // Simulate signing delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success("NDA signed successfully!");
      onSign?.(signatureHash);
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to sign NDA");
    } finally {
      setSigning(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#181e26] border-[#23272f] max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Shield className="w-6 h-6 text-primary" />
            Non-Disclosure Agreement
          </DialogTitle>
          <DialogDescription>
            {huntTitle} - {companyName}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 py-4">
          {/* NDA Text */}
          <div className="bg-[#10151c] border border-[#23272f] rounded-lg p-6">
            <pre className="text-sm text-gray-300 whitespace-pre-wrap font-sans leading-relaxed">
              {ndaText.replace("[COMPANY_NAME]", companyName)}
            </pre>
          </div>

          {/* Signature Section */}
          <div className="border-t border-[#23272f] pt-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <FileSignature className="w-5 h-5 text-primary" />
              Electronic Signature
            </h3>

            <div className="space-y-4">
              <div>
                <Label>Full Legal Name *</Label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full legal name"
                  className="bg-[#10151c] border-[#23272f] text-lg font-semibold"
                />
              </div>

              <div className="bg-[var(--accent-soft)] border border-[var(--border-light)] rounded-lg p-4">
                <h4 className="font-semibold text-primary mb-2">
                  By signing this agreement, you acknowledge:
                </h4>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>✓ You have read and understood all terms of this NDA</li>
                  <li>✓ You agree to be legally bound by these terms</li>
                  <li>
                    ✓ Your signature is equivalent to a handwritten signature
                  </li>
                  <li>
                    ✓ A cryptographic hash of your signature will be stored as
                    proof
                  </li>
                  <li>✓ Breach of this agreement may result in legal action</li>
                </ul>
              </div>

              <div className="bg-[color:color-mix(in_srgb,var(--medium)_12%,transparent)] border border-[color:color-mix(in_srgb,var(--high)_25%,transparent)] rounded-lg p-4">
                <p className="text-sm text-[var(--high)] font-medium">
                  ⚠️ This is a legally binding agreement. By clicking "Sign
                  NDA", you are creating an immutable record that cannot be
                  revoked.
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="border-t border-[#23272f] pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={signing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSign}
            disabled={signing || !fullName.trim()}
            className="bg-primary hover:bg-[var(--accent-hover)]"
          >
            {signing ? (
              "Signing..."
            ) : (
              <>
                <FileSignature className="w-4 h-4 mr-2" />
                Sign NDA
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
