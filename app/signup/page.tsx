"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Eye,
  EyeOff,
  Shield,
  ArrowLeft,
  Mail,
  CheckCircle,
  User,
  Building,
  GraduationCap,
  Briefcase,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/components/auth/auth-context"
import { db } from "@/firebaseConfig"
import { collection, addDoc } from "firebase/firestore"
import bcrypt from "bcryptjs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"

type UserType = "user" | "admin"
type AdminType = "company" | "firm" | "student" | "individual"

export default function SignUpPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [userType, setUserType] = useState<UserType | "">("")
  const [adminType, setAdminType] = useState<AdminType | "">("")
  const [supportingDoc, setSupportingDoc] = useState<File | null>(null)

  const [formData, setFormData] = useState({
    // Common fields
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",

    // Company/Firm specific
    companyName: "",
    registrationNumber: "",
    businessPhone: "",
    address: "",

    // Student specific
    instituteName: "",
    studentId: "",
    projectName: "",

    // Individual specific
    projectStartupName: "",
  })

  const handleUserTypeSelect = (type: UserType) => {
    setUserType(type)
    setAdminType("") // Reset admin type when user type changes
    setErrors({}) // Clear any existing errors
  }

  const handleAdminTypeSelect = (type: AdminType) => {
    setAdminType(type)
    setErrors({}) // Clear any existing errors
  }

  const validatePassword = (password: string) => {
    const minLength = password.length >= 8
    const hasUppercase = /[A-Z]/.test(password)
    const hasLowercase = /[a-z]/.test(password)
    const hasNumber = /\d/.test(password)
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)

    return {
      isValid: minLength && hasUppercase && hasLowercase && hasNumber && hasSpecialChar,
      errors: {
        minLength: !minLength ? "Password must be at least 8 characters long" : "",
        hasUppercase: !hasUppercase ? "Password must contain at least one uppercase letter" : "",
        hasLowercase: !hasLowercase ? "Password must contain at least one lowercase letter" : "",
        hasNumber: !hasNumber ? "Password must contain at least one number" : "",
        hasSpecialChar: !hasSpecialChar ? "Password must contain at least one special character" : "",
      },
    }
  }

  const validateEmailDomain = (email: string, type: UserType, adminType?: AdminType) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!emailRegex.test(email)) {
      return { isValid: false, error: "Please enter a valid email address" }
    }

    if (type === "admin") {
      if (adminType === "company" || adminType === "firm") {
        // Check for business domain (not common free email providers)
        const freeEmailDomains = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "aol.com"]
        const domain = email.split("@")[1]?.toLowerCase()
        if (freeEmailDomains.includes(domain)) {
          return { isValid: false, error: "Please use your official company/firm email address" }
        }
      } else if (adminType === "student") {
        // Check for educational domain
        const domain = email.split("@")[1]?.toLowerCase()
        if (!domain?.includes("edu") && !domain?.includes("ac.")) {
          return {
            isValid: false,
            error: "Please use your official student email address (e.g., @edu.in, @university.com)",
          }
        }
      }
    }

    return { isValid: true, error: "" }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = "Full name is required"
    }

    const emailValidation = validateEmailDomain(formData.email, userType as UserType, adminType as AdminType)
    if (!emailValidation.isValid) {
      newErrors.email = emailValidation.error
    }

    const passwordValidation = validatePassword(formData.password)
    if (!passwordValidation.isValid) {
      newErrors.password = Object.values(passwordValidation.errors).filter(Boolean).join(". ")
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }

    // Type-specific validations
    if (userType === "admin") {
      if (adminType === "company" || adminType === "firm") {
        if (!formData.companyName.trim()) {
          newErrors.companyName = `${adminType === "company" ? "Company" : "Firm"} name is required`
        }
        if (!formData.registrationNumber.trim()) {
          newErrors.registrationNumber = "Registration number is required"
        }
        if (!formData.businessPhone.trim()) {
          newErrors.businessPhone = "Business phone number is required"
        }
        if (!formData.address.trim()) {
          newErrors.address = "Address is required"
        }
      } else if (adminType === "student") {
        if (!formData.instituteName.trim()) {
          newErrors.instituteName = "Institute/College name is required"
        }
        if (!formData.studentId.trim()) {
          newErrors.studentId = "Student ID/Enrollment number is required"
        }
      } else if (adminType === "individual") {
        if (!formData.phone.trim()) {
          newErrors.phone = "Phone number is required"
        }
      }
    }

    return newErrors
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSupportingDoc(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrors({})

    const newErrors = validateForm()

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setIsLoading(false)
      return
    }

    try {
      // Encrypt password before saving
      const hashedPassword = await bcrypt.hash(formData.password, 10)
      await addDoc(collection(db, "users"), {
        ...formData,
        password: hashedPassword,
        userType,
        adminType,
        createdAt: new Date().toISOString(),
      })
      setEmailSent(true)
    } catch (error) {
      setErrors({ general: "An error occurred during signup. Please try again." })
    } finally {
      setIsLoading(false)
    }
  }

  const renderUserTypeSelection = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-white mb-4">Choose Your Role</h3>
        <div className="grid grid-cols-2 gap-4">
          <Button
            type="button"
            variant={userType === "user" ? "default" : "outline"}
            className={`h-25 flex flex-col items-center justify-center space-y-2 transition-all duration-200 ${
              userType === "user"
                ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                : "bg-slate-700/50 hover:bg-slate-600/70 text-slate-300 border-slate-600 hover:border-slate-500"
            }`}
            onClick={() => handleUserTypeSelect("user")}
          >
          <User className="h-6 w-6" />
          <span className="text-sm font-medium">User</span>
          <span className="text-xs opacity-80">Bug Hunter</span>
          </Button>

          <Button
            type="button"
            variant={userType === "admin" ? "default" : "outline"}
            className={`h-25 flex flex-col items-center justify-center space-y-2 transition-all duration-200 ${
              userType === "admin"
                ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                : "bg-slate-700/50 hover:bg-slate-600/70 text-slate-300 border-slate-600 hover:border-slate-500"
            }`}
            onClick={() => handleUserTypeSelect("admin")}
          >
            <Shield className="h-6 w-6" />
            <span className="text-sm font-medium">Admin</span>
            <span className="text-xs opacity-80">Organization</span>
          </Button>
        </div>
      </div>

      {userType === "admin" && (
        <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
          <div className="text-center">
            <h4 className="text-md font-medium text-slate-300 mb-3">Select Admin Type</h4>
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant={adminType === "student" ? "default" : "outline"}
                className={`h-16 flex flex-col items-center justify-center space-y-1 transition-all duration-200 ${
                  adminType === "student"
                    ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                    : "bg-slate-700/50 hover:bg-slate-600/70 text-slate-300 border-slate-600 hover:border-slate-500"
                }`}
                onClick={() => handleAdminTypeSelect("student")}
              >
                <GraduationCap className="h-5 w-5" />
                <span className="text-xs font-medium">Student</span>
              </Button>

              <Button
                type="button"
                variant={adminType === "company" ? "default" : "outline"}
                className={`h-16 flex flex-col items-center justify-center space-y-1 transition-all duration-200 ${
                  adminType === "company"
                    ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                    : "bg-slate-700/50 hover:bg-slate-600/70 text-slate-300 border-slate-600 hover:border-slate-500"
                }`}
                onClick={() => handleAdminTypeSelect("company")}
              >
                <Building className="h-5 w-5" />
                <span className="text-xs font-medium">Company Rep</span>
              </Button>

              <Button
                type="button"
                variant={adminType === "firm" ? "default" : "outline"}
                className={`h-16 flex flex-col items-center justify-center space-y-1 transition-all duration-200 ${
                  adminType === "firm"
                    ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                    : "bg-slate-700/50 hover:bg-slate-600/70 text-slate-300 border-slate-600 hover:border-slate-500"
                }`}
                onClick={() => handleAdminTypeSelect("firm")}
              >
                <Building className="h-5 w-5" />
                <span className="text-xs font-medium">Firm Rep</span>
              </Button>

              <Button
                type="button"
                variant={adminType === "individual" ? "default" : "outline"}
                className={`h-16 flex flex-col items-center justify-center space-y-1 transition-all duration-200 ${
                  adminType === "individual"
                    ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                    : "bg-slate-700/50 hover:bg-slate-600/70 text-slate-300 border-slate-600 hover:border-slate-500"
                }`}
                onClick={() => handleAdminTypeSelect("individual")}
              >
                <Briefcase className="h-5 w-5" />
                <span className="text-xs font-medium">Individual</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  const renderFormFields = () => {
    if (!userType || (userType === "admin" && !adminType)) return null

    return (
      <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
        {/* Common fields */}
        <div className="space-y-2">
          <Label htmlFor="name" className="text-slate-300">
            Full Name *
          </Label>
          <Input
            id="name"
            type="text"
            placeholder="John Doe"
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            className={`bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500 ${
              errors.name ? "border-red-500" : ""
            }`}
            required
          />
          {errors.name && <p className="text-red-400 text-sm">{errors.name}</p>}
        </div>

        {/* Company/Firm specific fields */}
        {userType === "admin" && (adminType === "company" || adminType === "firm") && (
          <>
            <div className="space-y-2">
              <Label htmlFor="companyName" className="text-slate-300">
                {adminType === "company" ? "Company" : "Firm"} Name *
              </Label>
              <Input
                id="companyName"
                type="text"
                placeholder={`Enter ${adminType} name`}
                value={formData.companyName}
                onChange={(e) => handleInputChange("companyName", e.target.value)}
                className={`bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500 ${
                  errors.companyName ? "border-red-500" : ""
                }`}
                required
              />
              {errors.companyName && <p className="text-red-400 text-sm">{errors.companyName}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="registrationNumber" className="text-slate-300">
                {adminType === "company" ? "Company" : "Firm"} Registration Number *
              </Label>
              <Input
                id="registrationNumber"
                type="text"
                placeholder="Registration/License number"
                value={formData.registrationNumber}
                onChange={(e) => handleInputChange("registrationNumber", e.target.value)}
                className={`bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500 ${
                  errors.registrationNumber ? "border-red-500" : ""
                }`}
                required
              />
              {errors.registrationNumber && <p className="text-red-400 text-sm">{errors.registrationNumber}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessPhone" className="text-slate-300">
                Business Phone Number *
              </Label>
              <Input
                id="businessPhone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={formData.businessPhone}
                onChange={(e) => handleInputChange("businessPhone", e.target.value)}
                className={`bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500 ${
                  errors.businessPhone ? "border-red-500" : ""
                }`}
                required
              />
              {errors.businessPhone && <p className="text-red-400 text-sm">{errors.businessPhone}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="text-slate-300">
                {adminType === "company" ? "Company" : "Firm"} Address *
              </Label>
              <Textarea
                id="address"
                placeholder="Enter complete address"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                className={`bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500 ${
                  errors.address ? "border-red-500" : ""
                }`}
                rows={3}
                required
              />
              {errors.address && <p className="text-red-400 text-sm">{errors.address}</p>}
            </div>
          </>
        )}

        {/* Student specific fields */}
        {userType === "admin" && adminType === "student" && (
          <>
            <div className="space-y-2">
              <Label htmlFor="instituteName" className="text-slate-300">
                Institute/College Name *
              </Label>
              <Input
                id="instituteName"
                type="text"
                placeholder="University/College name"
                value={formData.instituteName}
                onChange={(e) => handleInputChange("instituteName", e.target.value)}
                className={`bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500 ${
                  errors.instituteName ? "border-red-500" : ""
                }`}
                required
              />
              {errors.instituteName && <p className="text-red-400 text-sm">{errors.instituteName}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="studentId" className="text-slate-300">
                Student ID / Enrollment Number *
              </Label>
              <Input
                id="studentId"
                type="text"
                placeholder="Student ID or enrollment number"
                value={formData.studentId}
                onChange={(e) => handleInputChange("studentId", e.target.value)}
                className={`bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500 ${
                  errors.studentId ? "border-red-500" : ""
                }`}
                required
              />
              {errors.studentId && <p className="text-red-400 text-sm">{errors.studentId}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="projectName" className="text-slate-300">
                Academic Project Name (Optional)
              </Label>
              <Input
                id="projectName"
                type="text"
                placeholder="Project or research name"
                value={formData.projectName}
                onChange={(e) => handleInputChange("projectName", e.target.value)}
                className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500"
              />
            </div>
          </>
        )}

        {/* Individual specific fields */}
        {userType === "admin" && adminType === "individual" && (
          <div className="space-y-2">
            <Label htmlFor="projectStartupName" className="text-slate-300">
              Project/Startup Name (Optional)
            </Label>
            <Input
              id="projectStartupName"
              type="text"
              placeholder="Project or startup name"
              value={formData.projectStartupName}
              onChange={(e) => handleInputChange("projectStartupName", e.target.value)}
              className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500"
            />
          </div>
        )}

        {/* Email field */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-slate-300">
            {userType === "admin" && (adminType === "company" || adminType === "firm")
              ? "Official Email Address *"
              : userType === "admin" && adminType === "student"
                ? "Student Email Address *"
                : "Email Address *"}
          </Label>
          <Input
            id="email"
            type="email"
            placeholder={
              userType === "admin" && (adminType === "company" || adminType === "firm")
                ? "john.doe@company.com"
                : userType === "admin" && adminType === "student"
                  ? "student@university.edu"
                  : "john.doe@example.com"
            }
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            className={`bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500 ${
              errors.email ? "border-red-500" : ""
            }`}
            required
          />
          {errors.email && <p className="text-red-400 text-sm">{errors.email}</p>}
        </div>

        {/* Phone field for user and individual admin */}
        {(userType === "user" || (userType === "admin" && adminType === "individual")) && (
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-slate-300">
              Phone Number {userType === "admin" && adminType === "individual" ? "*" : "(Optional)"}
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+1 (555) 123-4567"
              value={formData.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
              className={`bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500 ${
                errors.phone ? "border-red-500" : ""
              }`}
              required={userType === "admin" && adminType === "individual"}
            />
            {errors.phone && <p className="text-red-400 text-sm">{errors.phone}</p>}
          </div>
        )}
        

        {/* Password fields */}
        <div className="space-y-2">
          <Label htmlFor="password" className="text-slate-300">
            Password *
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Create a strong password"
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              className={`bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500 pr-10 ${
                errors.password ? "border-red-500" : ""
              }`}
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
          {errors.password && <p className="text-red-400 text-sm">{errors.password}</p>}
          <p className="text-slate-500 text-xs">Min 8 chars, uppercase, lowercase, number, special character</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-slate-300">
            Confirm Password *
          </Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
              className={`bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500 pr-10 ${
                errors.confirmPassword ? "border-red-500" : ""
              }`}
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
          {errors.confirmPassword && <p className="text-red-400 text-sm">{errors.confirmPassword}</p>}
        </div>

        {/* Supporting documents for company/firm */}
        {userType === "admin" && (adminType === "company" || adminType === "firm") && (
          <div className="space-y-2">
            <Label htmlFor="supportingDoc" className="text-slate-300">
              Supporting Business Documents (Optional)
            </Label>
            <Input
              id="supportingDoc"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={handleFileChange}
              className="bg-slate-700/50 border-slate-600 text-white file:bg-slate-600 file:text-white file:border-0 file:rounded-md file:px-3 file:py-1"
            />
            <p className="text-slate-500 text-xs">Upload GST/Tax ID, certificate, or other business documents</p>
          </div>
        )}
      </div>
    )
  }

  if (emailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
            <CardHeader className="space-y-1 text-center">
              <div className="flex items-center justify-center mb-4">
                <div className="relative">
                  <Mail className="h-12 w-12 text-green-400" />
                  <CheckCircle className="h-6 w-6 text-green-400 absolute -top-1 -right-1" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-white">Check Your Email</CardTitle>
              <CardDescription className="text-slate-400">
                We've sent a verification link to {formData.email}
                {userType === "admin" && (adminType === "company" || adminType === "firm") && supportingDoc && (
                  <span className="block mt-2 text-slate-400">
                    Your supporting documents will be reviewed within 24-48 hours.
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <p className="text-slate-300 text-sm">
                Please check your email and click the verification link to activate your account.
              </p>
              <div className="pt-4">
                <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium">
                  Return to Sign In
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
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
              {userType === "user"
                ? "Create your account to start hunting bugs and earning rewards"
                : userType === "admin" && adminType === "company"
                  ? "Register your company to manage bug bounty programs"
                  : userType === "admin" && adminType === "firm"
                    ? "Register your firm to manage security assessments"
                    : userType === "admin" && adminType === "student"
                      ? "Register for academic projects and research"
                      : userType === "admin" && adminType === "individual"
                        ? "Register your personal project or startup"
                        : "Choose your role to get started"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {errors.general && (
              <Alert className="border-red-500/50 bg-red-500/10">
                <AlertDescription className="text-red-400">{errors.general}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {renderUserTypeSelection()}
              {renderFormFields()}

              {userType && (userType === "user" || (userType === "admin" && adminType)) && (
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={isLoading}>
                  {isLoading ? "Creating Account..." : "Create Account"}
                </Button>
              )}
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
