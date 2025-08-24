"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Shield, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/components/auth/auth-context"

export default function SignUpPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    mobileNumber: "",
    password: "",
    confirmPassword: "",
    age: "",
    profession: "",
    gender: "",
    role: "user", // Added role field
  })

  const professions = [
    "Student",
    "Software Engineer",
    "Cybersecurity Analyst",
    "Web Developer",
    "System Administrator",
    "Network Engineer",
    "Data Scientist",
    "Product Manager",
    "Security Researcher",
    "Penetration Tester",
    "DevOps Engineer",
    "IT Consultant",
    "Other",
  ]

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Simulate signup process
    await new Promise((resolve) => setTimeout(resolve, 1500))

    console.log("Signup data:", formData)

    login(formData.email, formData.email, formData.role as "user" | "admin")
    router.push("/feed")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
          <CardHeader className="space-y-1 text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="relative">
                <Shield className="h-12 w-12 text-blue-400" />
                <div className="absolute inset-0 bg-blue-400/20 rounded-full blur-lg" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-white">Join BugHuntr</CardTitle>
            <CardDescription className="text-slate-400">
              Create your account to start hunting bugs and earning rewards
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="role" className="text-slate-300">
                  Account Type
                </Label>
                <Select value={formData.role} onValueChange={(value) => handleInputChange("role", value)}>
                  <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white focus:border-blue-500">
                    <SelectValue placeholder="Select account type..." />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    <SelectItem value="user" className="text-white hover:bg-slate-700">
                      🔍 Bug Hunter (User)
                    </SelectItem>
                    <SelectItem value="admin" className="text-white hover:bg-slate-700">
                      🎯 Bug Hunt Creator (Admin)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-slate-300">
                    First Name
                  </Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-slate-300">
                    Last Name
                  </Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john.doe@example.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500"
                  required
                />
              </div>

              {/* Mobile Number */}
              <div className="space-y-2">
                <Label htmlFor="mobileNumber" className="text-slate-300">
                  Mobile Number
                </Label>
                <Input
                  id="mobileNumber"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={formData.mobileNumber}
                  onChange={(e) => handleInputChange("mobileNumber", e.target.value)}
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender" className="text-slate-300">
                  Gender
                </Label>
                <Select value={formData.gender} onValueChange={(value) => handleInputChange("gender", value)}>
                  <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white focus:border-blue-500">
                    <SelectValue placeholder="Select gender..." />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    <SelectItem value="male" className="text-white hover:bg-slate-700">
                      👨 Male
                    </SelectItem>
                    <SelectItem value="female" className="text-white hover:bg-slate-700">
                      👩 Female
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Age and Profession */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="age" className="text-slate-300">
                    Age
                  </Label>
                  <Input
                    id="age"
                    type="number"
                    placeholder="25"
                    min="13"
                    max="100"
                    value={formData.age}
                    onChange={(e) => handleInputChange("age", e.target.value)}
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profession" className="text-slate-300">
                    Profession
                  </Label>
                  <Select value={formData.profession} onValueChange={(value) => handleInputChange("profession", value)}>
                    <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white focus:border-blue-500">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      {professions.map((profession) => (
                        <SelectItem
                          key={profession}
                          value={profession.toLowerCase()}
                          className="text-white hover:bg-slate-700"
                        >
                          {profession}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500 pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-slate-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-slate-400" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-slate-300">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500 pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-slate-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-slate-400" />
                    )}
                  </Button>
                </div>
              </div>

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={isLoading}>
                {isLoading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>

            <div className="text-center">
              <p className="text-slate-400 text-sm">
                Already have an account?{" "}
                <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium">
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-4 text-center">
          <Link href="/" className="inline-flex items-center text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
