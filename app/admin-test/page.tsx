"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { migrateUserProfilesWithUsernames, updateUserRole } from "@/lib/migrate-users"

export default function AdminTestPage() {
  const [migrationResult, setMigrationResult] = useState<string>("")
  const [roleUpdateResult, setRoleUpdateResult] = useState<string>("")
  const [username, setUsername] = useState("")
  const [loading, setLoading] = useState(false)

  const handleMigration = async () => {
    setLoading(true)
    try {
      const result = await migrateUserProfilesWithUsernames()
      if (result.success) {
        setMigrationResult(`✅ Migration successful! Updated ${result.updatedCount} user profiles.`)
      } else {
        setMigrationResult(`❌ Migration failed: ${result.error}`)
      }
    } catch (error) {
      setMigrationResult(`❌ Migration error: ${error}`)
    }
    setLoading(false)
  }

  const handleMakeAdmin = async () => {
    if (!username.trim()) {
      setRoleUpdateResult("❌ Please enter a username")
      return
    }

    setLoading(true)
    try {
      const result = await updateUserRole(username.trim(), "admin")
      if (result.success) {
        setRoleUpdateResult(`✅ Successfully made ${username} an admin!`)
      } else {
        setRoleUpdateResult(`❌ Failed to update role: ${result.error}`)
      }
    } catch (error) {
      setRoleUpdateResult(`❌ Update error: ${error}`)
    }
    setLoading(false)
  }

  const handleMakeUser = async () => {
    if (!username.trim()) {
      setRoleUpdateResult("❌ Please enter a username")
      return
    }

    setLoading(true)
    try {
      const result = await updateUserRole(username.trim(), "user")
      if (result.success) {
        setRoleUpdateResult(`✅ Successfully made ${username} a regular user!`)
      } else {
        setRoleUpdateResult(`❌ Failed to update role: ${result.error}`)
      }
    } catch (error) {
      setRoleUpdateResult(`❌ Update error: ${error}`)
    }
    setLoading(false)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Admin Testing & Migration</h1>
      <p className="text-muted-foreground">
        Use this page to migrate existing users and test admin verification badges.
      </p>

      {/* Migration Section */}
      <Card>
        <CardHeader>
          <CardTitle>User Profile Migration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This will update existing users to have proper usernames extracted from their emails.
            For example: "john.doe@gmail.com" → "johndoe"
          </p>
          <Button 
            onClick={handleMigration} 
            disabled={loading}
            variant="outline"
          >
            {loading ? "Migrating..." : "Run Migration"}
          </Button>
          {migrationResult && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm">{migrationResult}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Role Update Section */}
      <Card>
        <CardHeader>
          <CardTitle>Update User Role</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Enter a username to make them an admin (they'll get the blue verification badge).
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="Enter username (e.g., johndoe)"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={handleMakeAdmin} 
              disabled={loading}
              variant="default"
            >
              Make Admin
            </Button>
            <Button 
              onClick={handleMakeUser} 
              disabled={loading}
              variant="outline"
            >
              Make User
            </Button>
          </div>
          {roleUpdateResult && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm">{roleUpdateResult}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Testing Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <strong>1. Run Migration:</strong> Click "Run Migration" to update existing users.
          </div>
          <div>
            <strong>2. Create Admin:</strong> Enter your username and click "Make Admin".
          </div>
          <div>
            <strong>3. Check Results:</strong> Go to the leaderboard, profile, or sidebar to see the blue verification badge.
          </div>
          <div>
            <strong>4. Test Login:</strong> If you login with an email like "test@gmail.com", it should create username "test".
          </div>
        </CardContent>
      </Card>
    </div>
  )
}