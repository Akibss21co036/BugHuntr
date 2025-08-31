"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building2, Shield, CheckCircle } from "lucide-react"
import { useAuth } from "@/components/auth/auth-context"

export function CompanyProfileDisplay() {
  const { user } = useAuth()

  if (!user || user.role !== "admin") {
    return null
  }

  return (
    <Card className="border-orange-200 bg-orange-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-orange-900">
          <Building2 className="h-5 w-5" />
          Company Profile
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-orange-800">Company Name</p>
            <p className="text-orange-900">{user.companyName || "Not specified"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-orange-800">Company ID</p>
            <p className="text-orange-900">{user.companyId || "Not specified"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-orange-800">Representative</p>
            <p className="text-orange-900">{user.representativeName || user.username}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-orange-800">Domain</p>
            <p className="text-orange-900">@{user.companyDomain}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Verified Company Admin
          </Badge>
          {user.twoFactorEnabled && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              <Shield className="h-3 w-3 mr-1" />
              2FA Enabled
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
