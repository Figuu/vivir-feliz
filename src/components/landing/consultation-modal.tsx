'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Clock, DollarSign, Users, Calendar, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { therapyConfig } from '@/lib/config'
import { ConsultationForm } from '@/components/consultation/consultation-form'
import { InterviewForm } from '@/components/interview/interview-form'

interface ConsultationModalProps {
  children: React.ReactNode
}

export function ConsultationModal({ children }: ConsultationModalProps) {
  const [open, setOpen] = useState(false)
  const [selectedType, setSelectedType] = useState<'consultation' | 'interview' | null>(null)
  const [showForm, setShowForm] = useState(false)

  const consultationFeatures = [
    'Professional assessment by licensed therapist',
    'Comprehensive evaluation of needs',
    'Personalized treatment recommendations',
    'Detailed report with next steps',
    'Direct access to therapy services'
  ]

  const interviewFeatures = [
    'Free initial consultation',
    'Basic needs assessment',
    'General guidance and information',
    'Service recommendations',
    'No commitment required'
  ]

  const handleSelection = (type: 'consultation' | 'interview') => {
    setSelectedType(type)
    setShowForm(true)
  }

  const handleFormComplete = (data: any) => {
    if (selectedType === 'consultation') {
      console.log('Consultation form completed:', data)
    } else {
      console.log('Interview form completed:', data)
    }
    // Here you would submit the data to your API
    setOpen(false)
    setShowForm(false)
    setSelectedType(null)
  }

  const handleFormCancel = () => {
    setShowForm(false)
    setSelectedType(null)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        {showForm ? (
          selectedType === 'consultation' ? (
            <ConsultationForm
              onComplete={handleFormComplete}
              onCancel={handleFormCancel}
            />
          ) : (
            <InterviewForm
              onComplete={handleFormComplete}
              onCancel={handleFormCancel}
            />
          )
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-center">
                Choose Your Consultation Type
              </DialogTitle>
              <DialogDescription className="text-center text-lg">
                Select the type of consultation that best fits your needs
              </DialogDescription>
            </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6 mt-6">
          {/* Consultation Option */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="relative border-2 hover:border-primary/50 transition-all duration-300 cursor-pointer group">
              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <CardTitle className="text-xl">Professional Consultation</CardTitle>
                <CardDescription className="text-base">
                  Comprehensive assessment with a licensed therapist
                </CardDescription>
                <div className="flex items-center justify-center gap-4 mt-4">
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    ${therapyConfig.defaultConsultationPrice}
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {therapyConfig.defaultConsultationDuration} min
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="space-y-3 mb-6">
                  {consultationFeatures.map((feature, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + index * 0.1 }}
                      className="flex items-start gap-3"
                    >
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </motion.li>
                  ))}
                </ul>
                <Button 
                  onClick={() => handleSelection('consultation')}
                  className="w-full group-hover:bg-primary/90 transition-colors"
                  size="lg"
                >
                  Book Consultation
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Interview Option */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="relative border-2 hover:border-primary/50 transition-all duration-300 cursor-pointer group">
              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                    <Calendar className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <CardTitle className="text-xl">Free Interview</CardTitle>
                <CardDescription className="text-base">
                  Initial conversation to understand your needs
                </CardDescription>
                <div className="flex items-center justify-center gap-4 mt-4">
                  <Badge variant="secondary" className="flex items-center gap-1 bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                    <DollarSign className="h-3 w-3" />
                    Free
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {therapyConfig.defaultInterviewDuration} min
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="space-y-3 mb-6">
                  {interviewFeatures.map((feature, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      className="flex items-start gap-3"
                    >
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </motion.li>
                  ))}
                </ul>
                <Button 
                  onClick={() => handleSelection('interview')}
                  variant="outline"
                  className="w-full group-hover:bg-primary/10 transition-colors"
                  size="lg"
                >
                  Schedule Interview
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Additional Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 p-4 bg-muted/50 rounded-lg"
        >
          <h3 className="font-semibold mb-2">What happens next?</h3>
          <p className="text-sm text-muted-foreground">
            After selecting your consultation type, you'll be guided through a simple form to provide 
            basic information and schedule your appointment. Our team will contact you to confirm 
            the details and answer any questions you may have.
          </p>
        </motion.div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
