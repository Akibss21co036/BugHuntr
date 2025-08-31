"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Shield, ArrowLeft, Building2, Mail, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { useAuth } from "@/components/auth/auth-context"
import { db } from "@/firebaseConfig"
import { collection, query, where, getDocs } from "firebase/firestore"
import bcrypt from "bcryptjs"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isAdminLogin, setIsAdminLogin] = useState(false)
  const [showTwoFactor, setShowTwoFactor] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const router = useRouter()
  const { login } = useAuth()
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
    companyId: "",
    twoFactorCode: "",
  })

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (validationErrors.length > 0) {
      setValidationErrors([])
    }
  }

  const validateCompanyEmail = (email: string): boolean => {
    const companyDomains = ["@company.com", "@corp.com", "@enterprise.com"]
    return companyDomains.some((domain) => email.toLowerCase().endsWith(domain))
  }

  const validatePassword = (password: string): string[] => {
    const errors: string[] = []
    if (password.length < 8) errors.push("Password must be at least 8 characters long")
    if (!/[A-Z]/.test(password)) errors.push("Password must contain at least one uppercase letter")
    if (!/[a-z]/.test(password)) errors.push("Password must contain at least one lowercase letter")
    if (!/\d/.test(password)) errors.push("Password must contain at least one number")
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push("Password must contain at least one special character")
    return errors
  }

  const validateForm = (): boolean => {
    const errors: string[] = []
    // Only validate password for admin, not email domain
    if (isAdminLogin) {
      const passwordErrors = validatePassword(formData.password)
      errors.push(...passwordErrors)
    }
    setValidationErrors(errors)
    return errors.length === 0
  }

  const sendTwoFactorCode = async (email: string): Promise<void> => {
    console.log(`Sending 2FA code to ${email}`)
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      // Fetch user from Firestore
      const q = query(collection(db, "users"), where("email", "==", formData.email))
      const querySnapshot = await getDocs(q)
      if (querySnapshot.empty) {
        setValidationErrors(["User not found. Please sign up first."])
        setIsLoading(false)
        return
      }
      const userDoc = querySnapshot.docs[0].data()
      // Debug: log userDoc
      console.log("Fetched userDoc:", userDoc)
      if (!userDoc.password) {
        setValidationErrors(["User password not set. Please sign up again."])
        setIsLoading(false)
        return
      }
      // Compare encrypted password
      const passwordMatch = await bcrypt.compare(formData.password, userDoc.password)
      if (!passwordMatch) {
        setValidationErrors(["Incorrect password. Please try again."])
        setIsLoading(false)
        return
      }

      // Optionally check userType/adminType for admin login
      if (isAdminLogin && userDoc.userType !== "admin") {
        setValidationErrors(["Not an admin account."])
        setIsLoading(false)
        return
      }

      // 2FA logic (if needed)
      if (isAdminLogin && !showTwoFactor) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
        await sendTwoFactorCode(formData.email)
        setShowTwoFactor(true)
        setIsLoading(false)
        return
      }
      if (isAdminLogin) {
        if (formData.twoFactorCode !== "123456") {
          setValidationErrors(["Invalid 2FA code. Please try again."])
          setIsLoading(false)
          return
        }
        login(formData.email, formData.email, "admin", userDoc)
      } else {
        login(formData.email, formData.email, "user", userDoc)
      }
      router.push("/feed")
    } catch (error) {
      console.error("Login error:", error)
      setValidationErrors(["Login failed. Please try again."])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
          <CardHeader className="space-y-1 text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="relative">
                {isAdminLogin ? (
                  <Building2 className="h-12 w-12 text-orange-400" />
                ) : (
                  <Shield className="h-12 w-12 text-blue-400" />
                )}
                <div
                  className={`absolute inset-0 ${isAdminLogin ? "bg-orange-400/20" : "bg-blue-400/20"} rounded-full blur-lg`}
                />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-white">
              {showTwoFactor ? "Two-Factor Authentication" : "Welcome Back"}
            </CardTitle>
            <CardDescription className="text-slate-400">
              {showTwoFactor
                ? "Enter the verification code sent to your company email"
                : isAdminLogin
                  ? "Sign in to your company admin account to manage bug hunts"
                  : "Sign in to your BugHuntr account to continue hunting"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {validationErrors.length > 0 && (
              <Alert className="border-red-500/50 bg-red-500/10">
                <AlertCircle className="h-4 w-4 text-red-400" />
                <AlertDescription className="text-red-400">
                  <ul className="list-disc list-inside space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {!showTwoFactor && (
              <div className="flex items-center justify-center space-x-4 mb-4">
                <Button
                  type="button"
                  variant={!isAdminLogin ? "default" : "outline"}
                  size="sm"
                  onClick={() => setIsAdminLogin(false)}
                  className={!isAdminLogin ? "bg-blue-600 hover:bg-blue-700" : "border-slate-600 text-slate-300"}
                >
                  User Login
                </Button>
                <Button
                  type="button"
                  variant={isAdminLogin ? "default" : "outline"}
                  size="sm"
                  onClick={() => setIsAdminLogin(true)}
                  className={isAdminLogin ? "bg-orange-600 hover:bg-orange-700" : "border-slate-600 text-slate-300"}
                >
                  Company Admin
                </Button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {showTwoFactor ? (
                <div className="space-y-2">
                  <Label htmlFor="twoFactorCode" className="text-slate-300">
                    Verification Code
                  </Label>
                  <Input
                    id="twoFactorCode"
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={formData.twoFactorCode}
                    onChange={(e) => handleInputChange("twoFactorCode", e.target.value)}
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-orange-500 text-center text-lg tracking-widest"
                    maxLength={6}
                    required
                  />
                  <p className="text-xs text-slate-400 text-center">
                    Didn't receive the code?{" "}
                    <button
                      type="button"
                      onClick={() => sendTwoFactorCode(formData.email)}
                      className="text-orange-400 hover:text-orange-300"
                    >
                      Resend
                    </button>
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-300">
                      {isAdminLogin ? "Admin Email Address" : "Email"}
                    </Label>
                    <div className="relative">
                      <Input
                        id="email"
                        type="email"
                        placeholder={isAdminLogin ? "admin@company.com" : "john.doe@example.com"}
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500 pl-10"
                        required
                      />
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    </div>
                    {isAdminLogin && (
                      <p className="text-xs text-slate-400">Use the email you registered with as admin</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-slate-300">
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
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
                    {isAdminLogin && (
                      <p className="text-xs text-slate-400">
                        Must contain 8+ chars, uppercase, lowercase, number, and special character
                      </p>
                    )}
                  </div>

                  {isAdminLogin && (
                    <div className="space-y-2">
                      <Label htmlFor="companyId" className="text-slate-300">
                        Company ID / Registration Number <span className="text-slate-500">(Optional)</span>
                      </Label>
                      <Input
                        id="companyId"
                        type="text"
                        placeholder="COMP001 or REG123456"
                        value={formData.companyId}
                        onChange={(e) => handleInputChange("companyId", e.target.value)}
                        className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-orange-500"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="rememberMe"
                        checked={formData.rememberMe}
                        onCheckedChange={(checked: boolean) => handleInputChange("rememberMe", checked)}
                        className="border-slate-600 data-[state=checked]:bg-blue-600"
                      />
                      <Label htmlFor="rememberMe" className="text-sm text-slate-300">
                        Remember me
                      </Label>
                    </div>
                    <Link href="/forgot-password" className="text-sm text-blue-400 hover:text-blue-300">
                      Forgot password?
                    </Link>
                  </div>
                </>
              )}

              <Button
                type="submit"
                className={`w-full text-white ${isAdminLogin ? "bg-orange-600 hover:bg-orange-700" : "bg-blue-600 hover:bg-blue-700"}`}
                disabled={isLoading}
              >
                {isLoading
                  ? showTwoFactor
                    ? "Verifying..."
                    : isAdminLogin
                      ? "Authenticating..."
                      : "Signing In..."
                  : showTwoFactor
                    ? "Verify & Sign In"
                    : isAdminLogin
                      ? "Sign In as Company Admin"
                      : "Sign In"}
              </Button>

              {showTwoFactor && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
                  onClick={() => setShowTwoFactor(false)}
                >
                  Back to Login
                </Button>
              )}
            </form>

            {!showTwoFactor && (
              <div className="text-center">
                <p className="text-slate-400 text-sm">
                  Don't have an account?{" "}
                  <Link href="/signup" className="text-blue-400 hover:text-blue-300 font-medium">
                    Sign up
                  </Link>
                </p>
              </div>
            )}
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
