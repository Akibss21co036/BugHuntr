"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth/auth-context"
import { db } from "@/firebaseConfig"
import { collection, getDocs, query, where } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function DebugPage() {
  const { user } = useAuth()
  const [userProfile, setUserProfile] = useState<any>(null)
  const [allProfiles, setAllProfiles] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const fetchUserProfile = async () => {
    if (!user?.username) return
    setLoading(true)
    try {
      const q = query(collection(db, "userProfiles"), where("username", "==", user.username))
      const snapshot = await getDocs(q)
      if (!snapshot.empty) {
        setUserProfile({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() })
      } else {
        setUserProfile(null)
      }
    } catch (error) {
      console.error("Error fetching user profile:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAllProfiles = async () => {
    setLoading(true)
    try {
      const snapshot = await getDocs(collection(db, "userProfiles"))
      const profiles = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setAllProfiles(profiles)
    } catch (error) {
      console.error("Error fetching all profiles:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.username) {
      fetchUserProfile()
    }
  }, [user?.username])

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Debug - User Profiles</h1>
      
      <div className="flex gap-4">
        <Button onClick={fetchUserProfile} disabled={loading}>
          Refresh My Profile
        </Button>
        <Button onClick={fetchAllProfiles} disabled={loading}>
          Load All Profiles
        </Button>
      </div>

      {user && (
        <Card>
          <CardHeader>
            <CardTitle>Current User Info</CardTitle>
          </CardHeader>
          <CardContent>
            <pre>{JSON.stringify(user, null, 2)}</pre>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>My Profile in Firestore</CardTitle>
        </CardHeader>
        <CardContent>
          {userProfile ? (
            <pre>{JSON.stringify(userProfile, null, 2)}</pre>
          ) : (
            <p>No profile found for username: {user?.username}</p>
          )}
        </CardContent>
      </Card>

      {allProfiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>All Profiles ({allProfiles.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {allProfiles.map((profile, index) => (
                <div key={profile.id} className="border p-4 rounded">
                  <h3 className="font-bold">{profile.username || "No username"}</h3>
                  <p>Points: {profile.points || 0}</p>
                  <p>Bugs: {profile.bugsSubmitted || 0}</p>
                  <p>Created: {profile.createdAt || "Unknown"}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}