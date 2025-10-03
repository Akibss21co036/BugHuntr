"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { updateUserStats } from "@/lib/update-user-stats"
import { getUserProfileByUsername } from "@/lib/get-user-profile"

export default function TestPointsPage() {
  const [username, setUsername] = useState("")
  const [points, setPoints] = useState(100)
  const [result, setResult] = useState("")
  const [profile, setProfile] = useState<any>(null)

  const testAddPoints = async () => {
    if (!username) {
      setResult("Please enter a username")
      return
    }

    try {
      setResult("Adding points...")
      const success = await updateUserStats(username, points, 1)
      if (success) {
        setResult(`Successfully added ${points} points to ${username}`)
        // Fetch updated profile
        const updatedProfile = await getUserProfileByUsername(username)
        setProfile(updatedProfile)
      } else {
        setResult("Failed to add points")
      }
    } catch (error) {
      setResult(`Error: ${error}`)
    }
  }

  const fetchProfile = async () => {
    if (!username) {
      setResult("Please enter a username")
      return
    }

    try {
      setResult("Fetching profile...")
      const userProfile = await getUserProfileByUsername(username)
      setProfile(userProfile)
      setResult("Profile fetched successfully")
    } catch (error) {
      setResult(`Error fetching profile: ${error}`)
      setProfile(null)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Test Points System</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label>Username:</label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
            />
          </div>
          
          <div>
            <label>Points to add:</label>
            <Input
              type="number"
              value={points}
              onChange={(e) => setPoints(Number(e.target.value))}
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={testAddPoints}>Add Points</Button>
            <Button variant="outline" onClick={fetchProfile}>Fetch Profile</Button>
          </div>

          {result && (
            <div className="p-3 bg-gray-100 rounded">
              <strong>Result:</strong> {result}
            </div>
          )}

          {profile && (
            <div className="p-3 bg-green-100 rounded">
              <strong>Profile Data:</strong>
              <pre>{JSON.stringify(profile, null, 2)}</pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}