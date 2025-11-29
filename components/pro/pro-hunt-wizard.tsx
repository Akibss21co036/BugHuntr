"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Shield, FileText, Users, DollarSign, Target, Calendar } from 'lucide-react'
import { useProHunts } from '@/hooks/use-pro-hunts'
import { NDA_TEMPLATES } from '@/types/pro'
import { toast } from 'sonner'

interface ProHuntWizardProps {
  companyId: string
  companyName: string
  onComplete?: () => void
}

export function ProHuntWizard({ companyId, companyName, onComplete }: ProHuntWizardProps) {
  const router = useRouter()
  const { createProHunt } = useProHunts()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    allowedTargetSegments: [''],
    ndaTemplateId: 'standard',
    requireKYC: false,
    requireCerts: true,
    allowBids: false,
    inviteOnly: true,
    minRank: 'B' as 'C' | 'B' | 'A' | 'S',
    minHuntsParticipated: 25,
    requiredCertifications: [] as string[],
    rewards: {
      critical: 5000,
      high: 2500,
      medium: 1000,
      low: 500
    },
    maxHunters: 10,
    startsAt: '',
    endsAt: ''
  })

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const selectedNDA = NDA_TEMPLATES.find(t => t.id === formData.ndaTemplateId)
      await createProHunt({
        companyId,
        companyName,
        ...formData,
        ndaTemplateText: selectedNDA?.text || '',
        allowedTargetSegments: formData.allowedTargetSegments.filter(s => s.trim()),
        status: 'draft'
      })
      toast.success('Pro Hunt created successfully!')
      onComplete?.()
      router.push('/pro/hunts')
    } catch (error) {
      toast.error('Failed to create Pro Hunt')
    } finally {
      setLoading(false)
    }
  }

  const addSegment = () => {
    setFormData(prev => ({
      ...prev,
      allowedTargetSegments: [...prev.allowedTargetSegments, '']
    }))
  }

  const updateSegment = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      allowedTargetSegments: prev.allowedTargetSegments.map((s, i) => i === index ? value : s)
    }))
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        {[1, 2, 3, 4].map(s => (
          <div key={s} className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
              s === step ? 'bg-blue-600 text-white' : 
              s < step ? 'bg-green-600 text-white' : 
              'bg-gray-700 text-gray-400'
            }`}>
              {s}
            </div>
            {s < 4 && <div className={`w-20 h-1 ${
              s < step ? 'bg-green-600' : 'bg-gray-700'
            }`} />}
          </div>
        ))}
      </div>

      {/* Step 1: Basic Info */}
      {step === 1 && (
        <Card className="bg-[#181e26] border-[#23272f]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-400" />
              Basic Information
            </CardTitle>
            <CardDescription>Define the core details of your Pro Hunt</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Hunt Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Payment Gateway Security Assessment"
                className="bg-[#10151c] border-[#23272f]"
              />
            </div>
            <div>
              <Label>Description *</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what hunters will be testing and any special requirements..."
                rows={5}
                className="bg-[#10151c] border-[#23272f]"
              />
            </div>
            <div>
              <Label>Allowed Target Segments *</Label>
              <p className="text-sm text-gray-400 mb-2">Specify the exact URLs, APIs, or modules hunters can test</p>
              {formData.allowedTargetSegments.map((segment, index) => (
                <Input
                  key={index}
                  value={segment}
                  onChange={(e) => updateSegment(index, e.target.value)}
                  placeholder="e.g., api.payment.yourcompany.com"
                  className="bg-[#10151c] border-[#23272f] mb-2"
                />
              ))}
              <Button onClick={addSegment} variant="outline" size="sm">
                + Add Segment
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Requirements */}
      {step === 2 && (
        <Card className="bg-[#181e26] border-[#23272f]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" />
              Hunter Requirements
            </CardTitle>
            <CardDescription>Set eligibility criteria for participants</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Minimum Rank *</Label>
                <Select value={formData.minRank} onValueChange={(value: any) => setFormData(prev => ({ ...prev, minRank: value }))}>
                  <SelectTrigger className="bg-[#10151c] border-[#23272f]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="C">C-Rank (Beginner)</SelectItem>
                    <SelectItem value="B">B-Rank (Intermediate)</SelectItem>
                    <SelectItem value="A">A-Rank (Advanced)</SelectItem>
                    <SelectItem value="S">S-Rank (Elite)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Min Hunts Participated *</Label>
                <Input
                  type="number"
                  value={formData.minHuntsParticipated}
                  onChange={(e) => setFormData(prev => ({ ...prev, minHuntsParticipated: parseInt(e.target.value) }))}
                  className="bg-[#10151c] border-[#23272f]"
                />
              </div>
            </div>
            <div>
              <Label>Required Certifications (optional)</Label>
              <div className="space-y-2 mt-2">
                {['OSCP', 'CEH', 'GWAPT', 'OSWE', 'OSCE'].map(cert => (
                  <div key={cert} className="flex items-center space-x-2">
                    <Checkbox
                      id={cert}
                      checked={formData.requiredCertifications.includes(cert)}
                      onCheckedChange={(checked) => {
                        setFormData(prev => ({
                          ...prev,
                          requiredCertifications: checked
                            ? [...prev.requiredCertifications, cert]
                            : prev.requiredCertifications.filter(c => c !== cert)
                        }))
                      }}
                    />
                    <label htmlFor={cert} className="text-sm">{cert}</label>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="requireKYC"
                  checked={formData.requireKYC}
                  onCheckedChange={(checked: boolean) => setFormData(prev => ({ ...prev, requireKYC: checked }))}
                />
                <label htmlFor="requireKYC" className="text-sm">Require KYC verification</label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="allowBids"
                  checked={formData.allowBids}
                  onCheckedChange={(checked: boolean) => setFormData(prev => ({ ...prev, allowBids: checked }))}
                />
                <label htmlFor="allowBids" className="text-sm">Allow hunters to submit bids</label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="inviteOnly"
                  checked={formData.inviteOnly}
                  onCheckedChange={(checked: boolean) => setFormData(prev => ({ ...prev, inviteOnly: checked }))}
                />
                <label htmlFor="inviteOnly" className="text-sm">Invite-only (no public applications)</label>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: NDA & Security */}
      {step === 3 && (
        <Card className="bg-[#181e26] border-[#23272f]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-400" />
              NDA & Security
            </CardTitle>
            <CardDescription>Configure confidentiality and security settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>NDA Template *</Label>
              <Select value={formData.ndaTemplateId} onValueChange={(value) => setFormData(prev => ({ ...prev, ndaTemplateId: value }))}>
                <SelectTrigger className="bg-[#10151c] border-[#23272f]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NDA_TEMPLATES.map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-400 mt-2">
                {NDA_TEMPLATES.find(t => t.id === formData.ndaTemplateId)?.description}
              </p>
            </div>
            <div className="bg-[#10151c] border border-[#23272f] rounded p-4 max-h-64 overflow-y-auto">
              <pre className="text-xs text-gray-300 whitespace-pre-wrap">
                {NDA_TEMPLATES.find(t => t.id === formData.ndaTemplateId)?.text}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Rewards & Timeline */}
      {step === 4 && (
        <Card className="bg-[#181e26] border-[#23272f]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-blue-400" />
              Rewards & Timeline
            </CardTitle>
            <CardDescription>Set bounty amounts and hunt duration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Critical Severity</Label>
                <Input
                  type="number"
                  value={formData.rewards.critical}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    rewards: { ...prev.rewards, critical: parseInt(e.target.value) }
                  }))}
                  className="bg-[#10151c] border-[#23272f]"
                />
              </div>
              <div>
                <Label>High Severity</Label>
                <Input
                  type="number"
                  value={formData.rewards.high}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    rewards: { ...prev.rewards, high: parseInt(e.target.value) }
                  }))}
                  className="bg-[#10151c] border-[#23272f]"
                />
              </div>
              <div>
                <Label>Medium Severity</Label>
                <Input
                  type="number"
                  value={formData.rewards.medium}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    rewards: { ...prev.rewards, medium: parseInt(e.target.value) }
                  }))}
                  className="bg-[#10151c] border-[#23272f]"
                />
              </div>
              <div>
                <Label>Low Severity</Label>
                <Input
                  type="number"
                  value={formData.rewards.low}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    rewards: { ...prev.rewards, low: parseInt(e.target.value) }
                  }))}
                  className="bg-[#10151c] border-[#23272f]"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date *</Label>
                <Input
                  type="date"
                  value={formData.startsAt.split('T')[0]}
                  onChange={(e) => setFormData(prev => ({ ...prev, startsAt: `${e.target.value}T00:00:00Z` }))}
                  className="bg-[#10151c] border-[#23272f]"
                />
              </div>
              <div>
                <Label>End Date *</Label>
                <Input
                  type="date"
                  value={formData.endsAt.split('T')[0]}
                  onChange={(e) => setFormData(prev => ({ ...prev, endsAt: `${e.target.value}T23:59:59Z` }))}
                  className="bg-[#10151c] border-[#23272f]"
                />
              </div>
            </div>
            <div>
              <Label>Maximum Hunters</Label>
              <Input
                type="number"
                value={formData.maxHunters}
                onChange={(e) => setFormData(prev => ({ ...prev, maxHunters: parseInt(e.target.value) }))}
                className="bg-[#10151c] border-[#23272f]"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          onClick={() => setStep(prev => Math.max(1, prev - 1))}
          disabled={step === 1}
          variant="outline"
        >
          Previous
        </Button>
        {step < 4 ? (
          <Button onClick={() => setStep(prev => Math.min(4, prev + 1))}>
            Next
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Creating...' : 'Create Pro Hunt'}
          </Button>
        )}
      </div>
    </div>
  )
}
