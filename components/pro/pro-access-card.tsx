"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Key, Copy, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { type ProAccessToken } from "@/types/pro";
import { toast } from "sonner";
import { useState } from "react";

interface ProAccessCardProps {
  accessToken: ProAccessToken;
  huntTitle: string;
  companyName: string;
}

export function ProAccessCard({
  accessToken,
  huntTitle,
  companyName,
}: ProAccessCardProps) {
  const [copied, setCopied] = useState(false);

  const copyToken = () => {
    navigator.clipboard.writeText(accessToken.token);
    setCopied(true);
    toast.success("Access token copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const isExpired = new Date(accessToken.expiresAt) < new Date();
  const isRevoked = accessToken.revoked;
  const isActive = !isExpired && !isRevoked;

  const timeRemaining = Math.max(
    0,
    Math.floor(
      (new Date(accessToken.expiresAt).getTime() - Date.now()) /
        (1000 * 60 * 60)
    )
  );

  return (
    <Card
      className={`bg-[#181e26] border-2 ${
        isActive ? "border-green-500/30" : "border-red-500/30"
      }`}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Key
              className={`w-5 h-5 ${
                isActive ? "text-green-400" : "text-red-400"
              }`}
            />
            Pro Access Token
          </CardTitle>
          {isActive ? (
            <Badge className="bg-green-600">
              <CheckCircle className="w-3 h-3 mr-1" />
              Active
            </Badge>
          ) : isRevoked ? (
            <Badge className="bg-red-600">
              <AlertCircle className="w-3 h-3 mr-1" />
              Revoked
            </Badge>
          ) : (
            <Badge className="bg-yellow-600">
              <Clock className="w-3 h-3 mr-1" />
              Expired
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Hunt Info */}
        <div>
          <p className="text-sm text-gray-400">Hunt</p>
          <p className="font-semibold">{huntTitle}</p>
          <p className="text-xs text-gray-500">{companyName}</p>
        </div>

        {/* Token Display */}
        {isActive && (
          <div>
            <p className="text-sm text-gray-400 mb-2">Access Token</p>
            <div className="flex gap-2">
              <div className="flex-1 bg-[#10151c] border border-[#23272f] rounded px-3 py-2 font-mono text-xs overflow-x-auto">
                {accessToken.token.substring(0, 40)}...
              </div>
              <Button
                onClick={copyToken}
                size="sm"
                variant="outline"
                className="flex-shrink-0"
              >
                {copied ? (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Time Remaining */}
        {isActive && (
          <div>
            <p className="text-sm text-gray-400">Time Remaining</p>
            <p className="text-2xl font-bold text-blue-400">{timeRemaining}h</p>
            <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{
                  width: `${Math.min(100, (timeRemaining / 24) * 100)}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Allowed Segments */}
        {isActive && accessToken.allowedSegments.length > 0 && (
          <div>
            <p className="text-sm text-gray-400 mb-2">
              Allowed Target Segments
            </p>
            <div className="space-y-1">
              {accessToken.allowedSegments.map((segment, index) => (
                <div
                  key={index}
                  className="bg-[#10151c] border border-[#23272f] rounded px-3 py-2 text-xs font-mono"
                >
                  {segment}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Usage Instructions */}
        {isActive && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <h4 className="font-semibold text-blue-400 mb-2 text-sm">
              Usage Instructions
            </h4>
            <ul className="text-xs text-gray-300 space-y-1">
              <li>
                • Include this token in all API requests as Bearer
                authentication
              </li>
              <li>• Test only the specified target segments listed above</li>
              <li>
                • All findings must be reported through the Pro submission
                interface
              </li>
              <li>• Do not share this token with anyone</li>
            </ul>
          </div>
        )}

        {/* Metadata */}
        <div className="text-xs text-gray-500 space-y-1 pt-2 border-t border-[#23272f]">
          <div className="flex justify-between">
            <span>Issued:</span>
            <span>{new Date(accessToken.issuedAt).toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Expires:</span>
            <span>{new Date(accessToken.expiresAt).toLocaleString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
