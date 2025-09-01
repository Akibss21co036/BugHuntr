"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, ExternalLink, QrCode, Shield, Calendar, Award } from "lucide-react"

interface CertificatePreviewProps {
  certificate: {
    id: number
    title: string
    issuer: string
    issueDate: string
    expiryDate: string
    credentialId: string
    skills: string[]
    verificationUrl: string
    status: "active" | "expiring" | "expired"
  }
}

export function CertificatePreview({ certificate }: CertificatePreviewProps) {
  const handleDownload = () => {
    // In a real app, this would generate and download a PDF
    console.log("Downloading certificate:", certificate.id)
  }

  const handleVerify = () => {
    if (typeof window !== "undefined") {
<<<<<<< HEAD
      window.open(certificate.verificationUrl, "_blank")
=======
      window.open(certificate.verificationUrl, "_blank");
>>>>>>> e43e63133f4241c27aa6a4baff57a456e061bff2
    }
  }

  return (
    <Card className="h-fit">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-xl mb-2">{certificate.title}</CardTitle>
            <p className="text-muted-foreground">{certificate.issuer}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleVerify} className="gap-2 bg-transparent">
              <ExternalLink className="h-4 w-4" />
              Verify
            </Button>
            <Button size="sm" onClick={handleDownload} className="gap-2">
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Certificate Preview */}
        <div className="bg-gradient-to-br from-cyber-blue/5 to-cyber-purple/5 border-2 border-cyber-blue/20 rounded-lg p-8 text-center">
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-cyber-blue/10 rounded-full flex items-center justify-center">
              <Award className="h-8 w-8 text-cyber-blue" />
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-2">{certificate.title}</h2>
              <p className="text-lg text-muted-foreground mb-4">
                This certifies that <strong>Alex Chen</strong> has successfully completed
              </p>
              <p className="text-muted-foreground">the requirements for this certification as verified by</p>
              <p className="font-semibold text-cyber-blue">{certificate.issuer}</p>
            </div>

            <div className="flex items-center justify-center gap-8 pt-4 border-t border-border/50">
              <div className="text-center">
                <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                  <Calendar className="h-3 w-3" />
                  <span>Issued</span>
                </div>
                <p className="font-semibold">{new Date(certificate.issueDate).toLocaleDateString()}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                  <Shield className="h-3 w-3" />
                  <span>Credential ID</span>
                </div>
                <p className="font-mono text-sm">{certificate.credentialId}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                  <QrCode className="h-3 w-3" />
                  <span>QR Verification</span>
                </div>
                <div className="w-12 h-12 bg-foreground/10 rounded border-2 border-dashed border-foreground/20 flex items-center justify-center">
                  <QrCode className="h-6 w-6 text-muted-foreground" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Certificate Details */}
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Skills Validated</h3>
            <div className="flex flex-wrap gap-2">
              {certificate.skills.map((skill) => (
                <Badge key={skill} variant="secondary" className="bg-cyber-blue/10 text-cyber-blue">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Issue Date:</span>
              <p className="font-medium">{new Date(certificate.issueDate).toLocaleDateString()}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Expiry Date:</span>
              <p className="font-medium">{new Date(certificate.expiryDate).toLocaleDateString()}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Credential ID:</span>
              <p className="font-mono text-xs">{certificate.credentialId}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Verification:</span>
              <Button variant="link" size="sm" onClick={handleVerify} className="h-auto p-0 text-cyber-blue">
                Verify Online
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
