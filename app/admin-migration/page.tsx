"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { migrateUsernamesFromEmails, updateUserRole } from "@/lib/migration-utils"

export default function AdminMigrationPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState("")

  const migrateUsers = async () => {
    setIsLoading(true)
    setResult("")
    
    try {
      const result = await migrateUsernamesFromEmails()
      
      // Also set some test admin users with company names
      const adminUsers = [
        { username: "admin", companyName: "Google" },
        { username: "testadmin", companyName: "Microsoft" },
        { username: "khanakib", companyName: "Meta" }
      ]
      
      for (const admin of adminUsers) {
        await updateUserRole(admin.username, "admin", admin.companyName)
      }
      
      setResult(`Migration completed successfully! Updated ${result.updated} profiles, created ${result.created} new profiles. Set admin roles for test users.`)
    } catch (error) {
      console.error("Migration error:", error)
      setResult(`Migration failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
    
    setIsLoading(false)
  }

  const setTestAdmins = async () => {
    setIsLoading(true)
    setResult("")
    
    try {
      // Set some users as admins with different company names
      await updateUserRole("khanakib", "admin", "Google")
      await updateUserRole("admin", "admin", "Microsoft")
      await updateUserRole("testadmin", "admin", "Meta")
      await updateUserRole("john", "admin") // No company name - will show just "Verified"
      
      setResult("Successfully set test admin users with company verification!")
    } catch (error) {
      console.error("Error setting admin roles:", error)
      setResult(`Failed to set admin roles: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
    
    setIsLoading(false)
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Admin Migration Tools</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold">Migrate Usernames from Emails</h3>
            <p className="text-sm text-muted-foreground">
              This will convert email-based usernames to proper usernames (e.g., xyz@gmail.com → xyz)
            </p>
            <Button onClick={migrateUsers} disabled={isLoading}>
              {isLoading ? "Migrating..." : "Migrate Users"}
            </Button>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-semibold">Set Test Admin Users</h3>
            <p className="text-sm text-muted-foreground">
              This will set specific users as admins with company verification badges
            </p>
            <Button onClick={setTestAdmins} disabled={isLoading} variant="outline">
              {isLoading ? "Setting..." : "Set Test Admins"}
            </Button>
          </div>
          
          {result && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm">{result}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}