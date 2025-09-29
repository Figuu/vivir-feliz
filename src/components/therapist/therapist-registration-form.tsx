'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  User,
  Mail,
  Phone,
  FileText,
  Calendar,
  GraduationCap,
  Globe,
  Languages,
  Award,
  Star,
  CheckCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  Plus,
  X,
  Save,
  RefreshCw,
  Upload,
  Download,
  Edit,
  Trash2,
  Shield,
  Clock,
  MapPin
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

// Validation schema
const therapistRegistrationSchema = z.object({
  firstName: z.string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must be less than 50 characters')
    .regex(/^[a-zA-Z\s]+$/, 'First name can only contain letters and spaces'),
  lastName: z.string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must be less than 50 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Last name can only contain letters and spaces'),
  email: z.string()
    .email('Invalid email format')
    .max(100, 'Email must be less than 100 characters'),
  phone: z.string()
    .regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number format')
    .min(10, 'Phone number must be at least 10 digits')
    .max(20, 'Phone number must be less than 20 characters'),
  licenseNumber: z.string()
    .min(5, 'License number must be at least 5 characters')
    .max(50, 'License number must be less than 50 characters')
    .regex(/^[A-Z0-9\-]+$/, 'License number can only contain uppercase letters, numbers, and hyphens'),
  licenseExpiry: z.string()
    .min(1, 'License expiry date is required'),
  specialties: z.array(z.string()).min(1, 'At least one specialty is required'),
  certifications: z.array(z.string()).optional(),
  bio: z.string()
    .max(1000, 'Bio must be less than 1000 characters')
    .optional(),
  experience: z.number()
    .min(0, 'Experience cannot be negative')
    .max(50, 'Experience cannot exceed 50 years')
    .optional(),
  education: z.string()
    .max(500, 'Education must be less than 500 characters')
    .optional(),
  languages: z.array(z.string()).optional(),
  timezone: z.string().default('UTC')
})

type TherapistRegistrationFormData = z.infer<typeof therapistRegistrationSchema>

interface Specialty {
  id: string
  name: string
  description: string
}

interface Certification {
  id: string
  name: string
  description: string
  expiryRequired: boolean
}

interface TherapistRegistrationFormProps {
  onSuccess?: (therapist: any) => void
  onCancel?: () => void
  editMode?: boolean
  therapistId?: string
  initialData?: Partial<TherapistRegistrationFormData>
}

export function TherapistRegistrationForm({
  onSuccess,
  onCancel,
  editMode = false,
  therapistId,
  initialData
}: TherapistRegistrationFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [specialties, setSpecialties] = useState<Specialty[]>([])
  const [certifications, setCertifications] = useState<Certification[]>([])
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([])
  const [selectedCertifications, setSelectedCertifications] = useState<string[]>([])
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([])
  const [showPassword, setShowPassword] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<Partial<TherapistRegistrationFormData>>({})

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<TherapistRegistrationFormData>({
    resolver: zodResolver(therapistRegistrationSchema),
    defaultValues: initialData || {
      timezone: 'UTC',
      specialties: [],
      certifications: [],
      languages: []
    }
  })

  // Load specialties and certifications
  useEffect(() => {
    loadSpecialtiesAndCertifications()
  }, [])

  // Set initial data if in edit mode
  useEffect(() => {
    if (editMode && initialData) {
      reset(initialData)
      setSelectedSpecialties(initialData.specialties || [])
      setSelectedCertifications(initialData.certifications || [])
      setSelectedLanguages(initialData.languages || [])
    }
  }, [editMode, initialData, reset])

  const loadSpecialtiesAndCertifications = async () => {
    try {
      const [specialtiesResponse, certificationsResponse] = await Promise.all([
        fetch('/api/specialties'),
        fetch('/api/certifications')
      ])

      if (specialtiesResponse.ok) {
        const specialtiesData = await specialtiesResponse.json()
        setSpecialties(specialtiesData.data.specialties || [])
      }

      if (certificationsResponse.ok) {
        const certificationsData = await certificationsResponse.json()
        setCertifications(certificationsData.data.certifications || [])
      }
    } catch (err) {
      console.error('Error loading specialties and certifications:', err)
    }
  }

  const onSubmit = async (data: TherapistRegistrationFormData) => {
    try {
      setLoading(true)
      setError(null)

      const submitData = {
        ...data,
        specialties: selectedSpecialties,
        certifications: selectedCertifications,
        languages: selectedLanguages
      }

      const url = editMode 
        ? `/api/therapist/profile?id=${therapistId}`
        : '/api/therapist/profile'
      
      const method = editMode ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save therapist')
      }

      toast.success(editMode ? 'Therapist updated successfully' : 'Therapist registered successfully')
      
      if (onSuccess) {
        onSuccess(result.data.therapist)
      }

      if (!editMode) {
        reset()
        setSelectedSpecialties([])
        setSelectedCertifications([])
        setSelectedLanguages([])
        setCurrentStep(1)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save therapist'
      setError(errorMessage)
      toast.error(errorMessage)
      console.error('Error saving therapist:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSpecialtyToggle = (specialtyId: string) => {
    setSelectedSpecialties(prev => 
      prev.includes(specialtyId)
        ? prev.filter(id => id !== specialtyId)
        : [...prev, specialtyId]
    )
  }

  const handleCertificationToggle = (certificationId: string) => {
    setSelectedCertifications(prev => 
      prev.includes(certificationId)
        ? prev.filter(id => id !== certificationId)
        : [...prev, certificationId]
    )
  }

  const handleLanguageToggle = (language: string) => {
    setSelectedLanguages(prev => 
      prev.includes(language)
        ? prev.filter(lang => lang !== language)
        : [...prev, language]
    )
  }

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '')
    
    // Format as (XXX) XXX-XXXX for US numbers
    if (digits.length >= 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`
    }
    
    return value
  }

  const formatLicenseNumber = (value: string) => {
    // Convert to uppercase and remove invalid characters
    return value.toUpperCase().replace(/[^A-Z0-9\-]/g, '')
  }

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const commonLanguages = [
    'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 
    'Russian', 'Chinese', 'Japanese', 'Korean', 'Arabic', 'Hindi'
  ]

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center">
          <User className="h-5 w-5 mr-2" />
          {editMode ? 'Edit Therapist Profile' : 'Therapist Registration'}
        </CardTitle>
        <CardDescription>
          {editMode 
            ? 'Update therapist information and credentials'
            : 'Register a new therapist with complete profile information'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step <= currentStep 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {step}
                </div>
                {step < 3 && (
                  <div className={`w-16 h-1 mx-2 ${
                    step < currentStep ? 'bg-primary' : 'bg-muted'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    {...register('firstName')}
                    placeholder="Enter first name"
                    className="mt-1"
                  />
                  {errors.firstName && (
                    <p className="text-sm text-red-600 mt-1">{errors.firstName.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    {...register('lastName')}
                    placeholder="Enter last name"
                    className="mt-1"
                  />
                  {errors.lastName && (
                    <p className="text-sm text-red-600 mt-1">{errors.lastName.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register('email')}
                    placeholder="Enter email address"
                    className="mt-1"
                  />
                  {errors.email && (
                    <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    {...register('phone')}
                    placeholder="(555) 123-4567"
                    className="mt-1"
                    onChange={(e) => {
                      const formatted = formatPhoneNumber(e.target.value)
                      setValue('phone', formatted)
                    }}
                  />
                  {errors.phone && (
                    <p className="text-sm text-red-600 mt-1">{errors.phone.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="licenseNumber">License Number *</Label>
                  <Input
                    id="licenseNumber"
                    {...register('licenseNumber')}
                    placeholder="ABC123456"
                    className="mt-1"
                    onChange={(e) => {
                      const formatted = formatLicenseNumber(e.target.value)
                      setValue('licenseNumber', formatted)
                    }}
                  />
                  {errors.licenseNumber && (
                    <p className="text-sm text-red-600 mt-1">{errors.licenseNumber.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="licenseExpiry">License Expiry Date *</Label>
                  <Input
                    id="licenseExpiry"
                    type="date"
                    {...register('licenseExpiry')}
                    className="mt-1"
                  />
                  {errors.licenseExpiry && (
                    <p className="text-sm text-red-600 mt-1">{errors.licenseExpiry.message}</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Professional Information */}
          {currentStep === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <Label>Specialties *</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                  {specialties.map((specialty) => (
                    <div
                      key={specialty.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedSpecialties.includes(specialty.id)
                          ? 'border-primary bg-primary/5'
                          : 'border-muted hover:border-primary/50'
                      }`}
                      onClick={() => handleSpecialtyToggle(specialty.id)}
                    >
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={selectedSpecialties.includes(specialty.id)}
                          onChange={() => handleSpecialtyToggle(specialty.id)}
                        />
                        <div>
                          <div className="font-medium">{specialty.name}</div>
                          <div className="text-sm text-muted-foreground">{specialty.description}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {errors.specialties && (
                  <p className="text-sm text-red-600 mt-1">{errors.specialties.message}</p>
                )}
              </div>

              <div>
                <Label>Certifications</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                  {certifications.map((certification) => (
                    <div
                      key={certification.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedCertifications.includes(certification.id)
                          ? 'border-primary bg-primary/5'
                          : 'border-muted hover:border-primary/50'
                      }`}
                      onClick={() => handleCertificationToggle(certification.id)}
                    >
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={selectedCertifications.includes(certification.id)}
                          onChange={() => handleCertificationToggle(certification.id)}
                        />
                        <div>
                          <div className="font-medium">{certification.name}</div>
                          <div className="text-sm text-muted-foreground">{certification.description}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="experience">Years of Experience</Label>
                  <Input
                    id="experience"
                    type="number"
                    min="0"
                    max="50"
                    {...register('experience', { valueAsNumber: true })}
                    placeholder="0"
                    className="mt-1"
                  />
                  {errors.experience && (
                    <p className="text-sm text-red-600 mt-1">{errors.experience.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select {...register('timezone')}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">Eastern Time</SelectItem>
                      <SelectItem value="America/Chicago">Central Time</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="education">Education</Label>
                <Textarea
                  id="education"
                  {...register('education')}
                  placeholder="Enter education background"
                  className="mt-1"
                  rows={3}
                />
                {errors.education && (
                  <p className="text-sm text-red-600 mt-1">{errors.education.message}</p>
                )}
              </div>
            </motion.div>
          )}

          {/* Step 3: Additional Information */}
          {currentStep === 3 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <Label>Languages</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {commonLanguages.map((language) => (
                    <Badge
                      key={language}
                      variant={selectedLanguages.includes(language) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => handleLanguageToggle(language)}
                    >
                      {language}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  {...register('bio')}
                  placeholder="Enter a brief bio about the therapist"
                  className="mt-1"
                  rows={4}
                />
                {errors.bio && (
                  <p className="text-sm text-red-600 mt-1">{errors.bio.message}</p>
                )}
              </div>
            </motion.div>
          )}

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-6">
            <div>
              {currentStep > 1 && (
                <Button type="button" variant="outline" onClick={prevStep}>
                  Previous
                </Button>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              )}
              
              {currentStep < 3 ? (
                <Button type="button" onClick={nextStep}>
                  Next
                </Button>
              ) : (
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {editMode ? 'Update Therapist' : 'Register Therapist'}
                </Button>
              )}
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
