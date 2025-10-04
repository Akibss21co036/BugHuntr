"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { markAdminUsers, setUserAsAdmin } from "@/lib/admin-utils"

export default function AdminUtilsPage() {
  const [username, setUsername] = useState("")
  const [result, setResult] = useState("")
  const [loading, setLoading] = useState(false)

  const handleMarkAllAdmins = async () => {
    setLoading(true)
    setResult("Updating admin roles...")
    try {
      await markAdminUsers()
      setResult("✅ Successfully updated all admin users")
    } catch (error) {
      setResult(`❌ Error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSetUserAsAdmin = async () => {
    if (!username.trim()) {
      setResult("Please enter a username")
      return
    }
    
    setLoading(true)
    setResult("Setting user as admin...")
    try {
      const success = await setUserAsAdmin(username.trim())
      if (success) {
        setResult(`✅ Successfully set ${username} as admin`)
      } else {
        setResult(`❌ User ${username} not found`)
      }
    } catch (error) {
      setResult(`❌ Error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Admin Utilities</h1>
      
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Mark All Admin Users</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This will update all predefined admin usernames with admin role in the database.
            </p>
            <Button 
              onClick={handleMarkAllAdmins} 
              disabled={loading}
              className="w-full"
            >
              {loading ? "Updating..." : "Mark All Admins"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Set Individual User as Admin</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Username:</label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="mt-1"
              />
            </div>
            <Button 
              onClick={handleSetUserAsAdmin} 
              disabled={loading || !username.trim()}
              className="w-full"
            >
              {loading ? "Setting..." : "Set as Admin"}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm font-mono whitespace-pre-wrap">{result}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}