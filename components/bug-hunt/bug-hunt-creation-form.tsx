"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { useAuth } from "@/components/auth/auth-context"
import { useBugHunt } from "@/hooks/use-bug-hunt"
import { useRouter } from "next/navigation"
import { Target, Calendar, Award, Settings, Plus, X, Trash2 } from "lucide-react"
import { FadeIn } from "@/components/animations/fade-in"
import type { BugHunt } from "@/types/bug-hunt"

export function BugHuntCreationForm() {
  const { user } = useAuth()
  const { createBugHunt, removeBugHunt, getActiveBugHunts, BUG_HUNT_TEMPLATES } = useBugHunt()
  const router = useRouter()
  const [isCreating, setIsCreating] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState("")
  const [showExistingHunts, setShowExistingHunts] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    company: "",
    scope: [""],
    categories: [] as string[],
    difficulty: "intermediate" as BugHunt["difficulty"],
    status: "draft" as BugHunt["status"],
    startDate: "",
    endDate: "",
    maxParticipants: "",
    rewards: {
      critical: 2000,
      high: 1000,
      medium: 500,
      low: 200,
    },
    rules: [""],
    assets: [""],
  })

  const activeBugHunts = getActiveBugHunts()

  const handleRemoveHunt = (huntId: string, huntTitle: string) => {
    if (
      confirm(
        `Are you sure you want to remove the bug hunt "${huntTitle}"? This action cannot be undone and will remove the hunt from all users' submissions.`,
      )
    ) {
      removeBugHunt(huntId)
      alert(`Bug hunt "${huntTitle}" has been successfully removed.`)
    }
  }

  const handleTemplateSelect = (templateId: string) => {
    const template = BUG_HUNT_TEMPLATES.find((t) => t.id === templateId)
    if (template) {
      setFormData((prev) => ({
        ...prev,
        scope: [...template.defaultScope],
        categories: [...template.defaultCategories],
        rules: [...template.defaultRules],
        difficulty: template.difficulty,
      }))
      setSelectedTemplate(templateId)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsCreating(true)

    try {
      const huntData = {
        ...formData,
        maxParticipants: formData.maxParticipants ? Number.parseInt(formData.maxParticipants) : undefined,
        scope: formData.scope.filter((s) => s.trim()),
        rules: formData.rules.filter((r) => r.trim()),
        assets: formData.assets.filter((a) => a.trim()),
        createdBy: user.id,
      }

      const newHunt = createBugHunt(huntData)

      alert(`Bug Hunt "${newHunt.title}" created successfully!`)
      router.push(`/admin/bug-hunts/${newHunt.id}`)
    } catch (error) {
      console.error("Error creating bug hunt:", error)
      alert("Error creating bug hunt. Please try again.")
    } finally {
      setIsCreating(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleArrayChange = (field: "scope" | "rules" | "assets", index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].map((item, i) => (i === index ? value : item)),
    }))
  }

  const addArrayItem = (field: "scope" | "rules" | "assets") => {
    setFormData((prev) => ({
      ...prev,
      [field]: [...prev[field], ""],
    }))
  }

  const removeArrayItem = (field: "scope" | "rules" | "assets", index: number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }))
  }

  const handleCategoryToggle = (category: string) => {
    setFormData((prev) => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category],
    }))
  }

  const availableCategories = [
    "Web Application",
    "API Security",
    "Mobile Application",
    "Network Security",
    "Infrastructure",
    "Social Engineering",
    "Authentication",
    "Authorization",
    "Data Storage",
  ]

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-4xl">
        <FadeIn>
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">Admin: Bug Hunt Management</h1>
                <p className="text-muted-foreground">Create new bug bounty programs and manage existing hunts.</p>
              </div>
              <Button variant="outline" onClick={() => setShowExistingHunts(!showExistingHunts)}>
                {showExistingHunts ? "Hide" : "Show"} Existing Hunts ({activeBugHunts.length})
              </Button>
            </div>
          </div>
        </FadeIn>

        {showExistingHunts && activeBugHunts.length > 0 && (
          <FadeIn delay={0.05}>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-cyber-blue" />
                  Existing Bug Hunts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {activeBugHunts.map((hunt) => (
                    <div
                      key={hunt.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{hunt.title}</h4>
                          <Badge
                            variant="outline"
                            className={
                              hunt.status === "active"
                                ? "bg-green-500/10 text-green-500 border-green-500/20"
                                : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                            }
                          >
                            {hunt.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{hunt.company}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                          <span>
                            Participants: {hunt.currentParticipants}/{hunt.maxParticipants || "∞"}
                          </span>
                          <span>Ends: {new Date(hunt.endDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveHunt(hunt.id, hunt.title)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove Hunt
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </FadeIn>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Template Selection */}
          <FadeIn delay={0.1}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-cyber-blue" />
                  Quick Start Templates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {BUG_HUNT_TEMPLATES.map((template) => (
                    <div
                      key={template.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedTemplate === template.id
                          ? "border-cyber-blue bg-cyber-blue/5"
                          : "border-border hover:border-cyber-blue/50"
                      }`}
                      onClick={() => handleTemplateSelect(template.id)}
                    >
                      <h4 className="font-medium mb-2">{template.name}</h4>
                      <p className="text-sm text-muted-foreground mb-3">{template.description}</p>
                      <Badge variant="outline" className="text-xs">
                        {template.difficulty}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </FadeIn>

          {/* Basic Information */}
          <FadeIn delay={0.2}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-cyber-blue" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Hunt Title *</Label>
                    <Input
                      id="title"
                      placeholder="e.g., TechCorp Web Application Security Assessment"
                      value={formData.title}
                      onChange={(e) => handleInputChange("title", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company">Company/Organization *</Label>
                    <Input
                      id="company"
                      placeholder="e.g., TechCorp"
                      value={formData.company}
                      onChange={(e) => handleInputChange("company", e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Detailed description of the bug hunt objectives, scope, and expectations..."
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    rows={4}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="difficulty">Difficulty Level</Label>
                    <Select
                      value={formData.difficulty}
                      onValueChange={(value) => handleInputChange("difficulty", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                        <SelectItem value="expert">Expert</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Initial Status</Label>
                    <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxParticipants">Max Participants</Label>
                    <Input
                      id="maxParticipants"
                      type="number"
                      placeholder="50"
                      value={formData.maxParticipants}
                      onChange={(e) => handleInputChange("maxParticipants", e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </FadeIn>

          {/* Timeline */}
          <FadeIn delay={0.3}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-cyber-blue" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date *</Label>
                    <Input
                      id="startDate"
                      type="datetime-local"
                      value={formData.startDate}
                      onChange={(e) => handleInputChange("startDate", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date *</Label>
                    <Input
                      id="endDate"
                      type="datetime-local"
                      value={formData.endDate}
                      onChange={(e) => handleInputChange("endDate", e.target.value)}
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </FadeIn>

          {/* Scope & Categories */}
          <FadeIn delay={0.4}>
            <Card>
              <CardHeader>
                <CardTitle>Scope & Categories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label>Testing Scope *</Label>
                  {formData.scope.map((item, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder="e.g., *.example.com, app.example.com"
                        value={item}
                        onChange={(e) => handleArrayChange("scope", index, e.target.value)}
                      />
                      {formData.scope.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removeArrayItem("scope", index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addArrayItem("scope")}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Scope Item
                  </Button>
                </div>

                <div className="space-y-3">
                  <Label>Vulnerability Categories</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {availableCategories.map((category) => (
                      <div key={category} className="flex items-center space-x-2">
                        <Checkbox
                          id={category}
                          checked={formData.categories.includes(category)}
                          onCheckedChange={() => handleCategoryToggle(category)}
                        />
                        <Label htmlFor={category} className="text-sm">
                          {category}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </FadeIn>

          {/* Rewards */}
          <FadeIn delay={0.5}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-cyber-blue" />
                  Point Rewards
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="critical">Critical</Label>
                    <Input
                      id="critical"
                      type="number"
                      value={formData.rewards.critical}
                      onChange={(e) =>
                        handleInputChange("rewards", {
                          ...formData.rewards,
                          critical: Number.parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="high">High</Label>
                    <Input
                      id="high"
                      type="number"
                      value={formData.rewards.high}
                      onChange={(e) =>
                        handleInputChange("rewards", {
                          ...formData.rewards,
                          high: Number.parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="medium">Medium</Label>
                    <Input
                      id="medium"
                      type="number"
                      value={formData.rewards.medium}
                      onChange={(e) =>
                        handleInputChange("rewards", {
                          ...formData.rewards,
                          medium: Number.parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="low">Low</Label>
                    <Input
                      id="low"
                      type="number"
                      value={formData.rewards.low}
                      onChange={(e) =>
                        handleInputChange("rewards", {
                          ...formData.rewards,
                          low: Number.parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </FadeIn>

          {/* Rules & Assets */}
          <FadeIn delay={0.6}>
            <Card>
              <CardHeader>
                <CardTitle>Rules & Assets</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label>Hunt Rules *</Label>
                  {formData.rules.map((rule, index) => (
                    <div key={index} className="flex gap-2">
                      <Textarea
                        placeholder="e.g., No automated scanning without permission"
                        value={rule}
                        onChange={(e) => handleArrayChange("rules", index, e.target.value)}
                        rows={2}
                      />
                      {formData.rules.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removeArrayItem("rules", index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addArrayItem("rules")}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Rule
                  </Button>
                </div>

                <div className="space-y-3">
                  <Label>Target Assets</Label>
                  {formData.assets.map((asset, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder="e.g., Main web application, REST API"
                        value={asset}
                        onChange={(e) => handleArrayChange("assets", index, e.target.value)}
                      />
                      {formData.assets.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removeArrayItem("assets", index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addArrayItem("assets")}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Asset
                  </Button>
                </div>
              </CardContent>
            </Card>
          </FadeIn>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? "Creating Hunt..." : "Create Bug Hunt"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
