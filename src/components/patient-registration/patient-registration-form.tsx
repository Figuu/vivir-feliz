'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { 
  User,
  Users,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Heart,
  BookOpen,
  FileText,
  CheckCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

interface PatientRegistrationFormProps {
  onRegistrationComplete?: (patient: any) => void
}

export function PatientRegistrationForm({ onRegistrationComplete }: PatientRegistrationFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 5
  
  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'prefer_not_to_say' as 'male' | 'female' | 'other' | 'prefer_not_to_say',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'USA'
    },
    parentGuardian: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      relationship: 'parent' as 'parent' | 'guardian' | 'caregiver' | 'other',
      occupation: '',
      workPhone: ''
    },
    emergencyContact: {
      name: '',
      relationship: '',
      phone: '',
      alternativePhone: ''
    },
    medicalInfo: {
      allergies: [] as string[],
      medications: [] as string[],
      medicalConditions: [] as string[],
      primaryPhysician: '',
      primaryPhysicianPhone: '',
      insuranceProvider: '',
      insurancePolicyNumber: ''
    },
    educationalInfo: {
      schoolName: '',
      gradeLevel: '',
      specialEducationServices: false,
      iepStatus: 'none' as 'none' | 'active' | 'pending' | 'completed'
    },
    consultationReason: '',
    referralSource: '',
    consentToTreatment: false,
    consentToDataSharing: false,
    privacyPolicyAccepted: false,
    preferredLanguage: 'en' as 'en' | 'es' | 'fr' | 'other',
    preferredContactMethod: 'any' as 'email' | 'phone' | 'sms' | 'any',
    notes: '',
    registeredBy: 'admin-1'
  })

  const [newAllergy, setNewAllergy] = useState('')
  const [newMedication, setNewMedication] = useState('')
  const [newCondition, setNewCondition] = useState('')

  const handleSubmit = async () => {
    if (!validateCurrentStep()) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/patient-registration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to register patient')
      }

      toast.success('Patient registered successfully')
      
      if (onRegistrationComplete) {
        onRegistrationComplete(result.data)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to register patient'
      setError(errorMessage)
      toast.error(errorMessage)
      console.error('Error registering patient:', err)
    } finally {
      setLoading(false)
    }
  }

  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 1:
        return !!(formData.firstName && formData.lastName && formData.dateOfBirth && formData.gender)
      case 2:
        return !!(formData.address.street && formData.address.city && formData.address.state && formData.address.zipCode)
      case 3:
        return !!(formData.parentGuardian.firstName && formData.parentGuardian.lastName && 
                 formData.parentGuardian.email && formData.parentGuardian.phone)
      case 4:
        return !!(formData.emergencyContact.name && formData.emergencyContact.relationship && formData.emergencyContact.phone)
      case 5:
        return !!(formData.consultationReason && formData.consentToTreatment && formData.privacyPolicyAccepted)
      default:
        return true
    }
  }

  const nextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps))
    } else {
      toast.error('Please fill in all required fields before continuing')
    }
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const addToArray = (field: 'allergies' | 'medications' | 'medicalConditions', value: string) => {
    if (value.trim()) {
      setFormData(prev => ({
        ...prev,
        medicalInfo: {
          ...prev.medicalInfo,
          [field]: [...prev.medicalInfo[field], value.trim()]
        }
      }))
    }
  }

  const removeFromArray = (field: 'allergies' | 'medications' | 'medicalConditions', index: number) => {
    setFormData(prev => ({
      ...prev,
      medicalInfo: {
        ...prev.medicalInfo,
        [field]: prev.medicalInfo[field].filter((_, i) => i !== index)
      }
    }))
  }

  const getStepTitle = (step: number) => {
    switch (step) {
      case 1: return 'Personal Information'
      case 2: return 'Contact & Address'
      case 3: return 'Parent/Guardian Information'
      case 4: return 'Emergency Contact & Medical'
      case 5: return 'Consultation & Consent'
      default: return 'Registration'
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Step {currentStep} of {totalSteps}</span>
              <span>{Math.round((currentStep / totalSteps) * 100)}% Complete</span>
            </div>
            <Progress value={(currentStep / totalSteps) * 100} />
            <p className="text-sm font-medium text-center">{getStepTitle(currentStep)}</p>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Form Steps */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                {currentStep === 1 && <User className="h-5 w-5 mr-2" />}
                {currentStep === 2 && <MapPin className="h-5 w-5 mr-2" />}
                {currentStep === 3 && <Users className="h-5 w-5 mr-2" />}
                {currentStep === 4 && <Heart className="h-5 w-5 mr-2" />}
                {currentStep === 5 && <FileText className="h-5 w-5 mr-2" />}
                {getStepTitle(currentStep)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Step 1: Personal Information */}
              {currentStep === 1 && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>First Name *</Label>
                      <Input
                        value={formData.firstName}
                        onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                        placeholder="John"
                        maxLength={50}
                      />
                    </div>
                    
                    <div>
                      <Label>Last Name *</Label>
                      <Input
                        value={formData.lastName}
                        onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                        placeholder="Doe"
                        maxLength={50}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Date of Birth *</Label>
                      <Input
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                        max={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    
                    <div>
                      <Label>Gender *</Label>
                      <Select value={formData.gender} onValueChange={(value: any) => setFormData(prev => ({ ...prev, gender: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                          <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Email (Optional)</Label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="patient@example.com"
                      />
                    </div>
                    
                    <div>
                      <Label>Phone (Optional)</Label>
                      <Input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="+1234567890"
                        maxLength={20}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Step 2: Contact & Address */}
              {currentStep === 2 && (
                <>
                  <div>
                    <Label>Street Address *</Label>
                    <Input
                      value={formData.address.street}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        address: { ...prev.address, street: e.target.value }
                      }))}
                      placeholder="123 Main St"
                      maxLength={200}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>City *</Label>
                      <Input
                        value={formData.address.city}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          address: { ...prev.address, city: e.target.value }
                        }))}
                        placeholder="New York"
                        maxLength={100}
                      />
                    </div>
                    
                    <div>
                      <Label>State *</Label>
                      <Input
                        value={formData.address.state}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          address: { ...prev.address, state: e.target.value }
                        }))}
                        placeholder="NY"
                        maxLength={50}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Zip Code *</Label>
                      <Input
                        value={formData.address.zipCode}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          address: { ...prev.address, zipCode: e.target.value }
                        }))}
                        placeholder="10001"
                        maxLength={20}
                      />
                    </div>
                    
                    <div>
                      <Label>Country</Label>
                      <Input
                        value={formData.address.country}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          address: { ...prev.address, country: e.target.value }
                        }))}
                        placeholder="USA"
                        maxLength={50}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Step 3: Parent/Guardian */}
              {currentStep === 3 && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Parent First Name *</Label>
                      <Input
                        value={formData.parentGuardian.firstName}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          parentGuardian: { ...prev.parentGuardian, firstName: e.target.value }
                        }))}
                        placeholder="Jane"
                        maxLength={50}
                      />
                    </div>
                    
                    <div>
                      <Label>Parent Last Name *</Label>
                      <Input
                        value={formData.parentGuardian.lastName}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          parentGuardian: { ...prev.parentGuardian, lastName: e.target.value }
                        }))}
                        placeholder="Doe"
                        maxLength={50}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Parent Email *</Label>
                      <Input
                        type="email"
                        value={formData.parentGuardian.email}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          parentGuardian: { ...prev.parentGuardian, email: e.target.value }
                        }))}
                        placeholder="parent@example.com"
                      />
                    </div>
                    
                    <div>
                      <Label>Parent Phone *</Label>
                      <Input
                        type="tel"
                        value={formData.parentGuardian.phone}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          parentGuardian: { ...prev.parentGuardian, phone: e.target.value }
                        }))}
                        placeholder="+1234567890"
                        maxLength={20}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Relationship *</Label>
                      <Select 
                        value={formData.parentGuardian.relationship} 
                        onValueChange={(value: any) => setFormData(prev => ({
                          ...prev,
                          parentGuardian: { ...prev.parentGuardian, relationship: value }
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="parent">Parent</SelectItem>
                          <SelectItem value="guardian">Guardian</SelectItem>
                          <SelectItem value="caregiver">Caregiver</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>Occupation</Label>
                      <Input
                        value={formData.parentGuardian.occupation}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          parentGuardian: { ...prev.parentGuardian, occupation: e.target.value }
                        }))}
                        placeholder="Software Engineer"
                        maxLength={100}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Step 4: Emergency Contact & Medical (simplified for space) */}
              {currentStep === 4 && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Emergency Contact Name *</Label>
                      <Input
                        value={formData.emergencyContact.name}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          emergencyContact: { ...prev.emergencyContact, name: e.target.value }
                        }))}
                        placeholder="Emergency Contact Name"
                        maxLength={100}
                      />
                    </div>
                    
                    <div>
                      <Label>Relationship *</Label>
                      <Input
                        value={formData.emergencyContact.relationship}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          emergencyContact: { ...prev.emergencyContact, relationship: e.target.value }
                        }))}
                        placeholder="Grandmother"
                        maxLength={50}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Emergency Phone *</Label>
                      <Input
                        type="tel"
                        value={formData.emergencyContact.phone}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          emergencyContact: { ...prev.emergencyContact, phone: e.target.value }
                        }))}
                        placeholder="+1234567890"
                        maxLength={20}
                      />
                    </div>
                    
                    <div>
                      <Label>Alternative Phone</Label>
                      <Input
                        type="tel"
                        value={formData.emergencyContact.alternativePhone}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          emergencyContact: { ...prev.emergencyContact, alternativePhone: e.target.value }
                        }))}
                        placeholder="+1234567890"
                        maxLength={20}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Step 5: Consultation & Consent */}
              {currentStep === 5 && (
                <>
                  <div>
                    <Label>Reason for Consultation *</Label>
                    <Textarea
                      value={formData.consultationReason}
                      onChange={(e) => setFormData(prev => ({ ...prev, consultationReason: e.target.value }))}
                      placeholder="Describe the reason for seeking therapy services"
                      rows={4}
                      maxLength={1000}
                    />
                  </div>
                  
                  <div>
                    <Label>Referral Source</Label>
                    <Input
                      value={formData.referralSource}
                      onChange={(e) => setFormData(prev => ({ ...prev, referralSource: e.target.value }))}
                      placeholder="How did you hear about us?"
                      maxLength={100}
                    />
                  </div>
                  
                  <div className="space-y-3 border-t pt-4">
                    <div className="flex items-start space-x-2">
                      <Checkbox
                        id="consentToTreatment"
                        checked={formData.consentToTreatment}
                        onCheckedChange={(checked: boolean) => setFormData(prev => ({ ...prev, consentToTreatment: checked }))}
                      />
                      <div className="flex-1">
                        <Label htmlFor="consentToTreatment" className="font-semibold">Consent to Treatment *</Label>
                        <p className="text-sm text-muted-foreground">
                          I consent to therapy services and understand the treatment process
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-2">
                      <Checkbox
                        id="privacyPolicyAccepted"
                        checked={formData.privacyPolicyAccepted}
                        onCheckedChange={(checked: boolean) => setFormData(prev => ({ ...prev, privacyPolicyAccepted: checked }))}
                      />
                      <div className="flex-1">
                        <Label htmlFor="privacyPolicyAccepted" className="font-semibold">Privacy Policy *</Label>
                        <p className="text-sm text-muted-foreground">
                          I have read and accept the privacy policy and terms of service
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-2">
                      <Checkbox
                        id="consentToDataSharing"
                        checked={formData.consentToDataSharing}
                        onCheckedChange={(checked: boolean) => setFormData(prev => ({ ...prev, consentToDataSharing: checked }))}
                      />
                      <div className="flex-1">
                        <Label htmlFor="consentToDataSharing">Consent to Data Sharing</Label>
                        <p className="text-sm text-muted-foreground">
                          I consent to sharing necessary information with healthcare providers
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
                
                {currentStep < totalSteps ? (
                  <Button onClick={nextStep}>
                    Next
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button onClick={handleSubmit} disabled={loading}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {loading ? 'Registering...' : 'Complete Registration'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
