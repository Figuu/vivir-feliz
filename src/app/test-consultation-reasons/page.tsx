'use client'

import { useState } from 'react'
import { ConsultationReasonSelector } from '@/components/consultation/consultation-reason-selector'

interface ConsultationReason {
  id: string
  name: string
  description?: string
  specialty: {
    id: string
    name: string
    description?: string
  }
}

interface Specialty {
  id: string
  name: string
  description?: string
}

export default function TestConsultationReasonsPage() {
  const [selectedReason, setSelectedReason] = useState<ConsultationReason | undefined>()
  const [selectedSpecialty, setSelectedSpecialty] = useState<Specialty | undefined>()

  const handleReasonSelect = (reason: ConsultationReason) => {
    setSelectedReason(reason)
    console.log('Selected reason:', reason)
  }

  const handleSpecialtySelect = (specialty: Specialty) => {
    setSelectedSpecialty(specialty)
    console.log('Selected specialty:', specialty)
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Consultation Reason Selector Test</h1>
          <p className="text-muted-foreground">
            Test the consultation reason selection with specialty mapping functionality
          </p>
        </div>

        <ConsultationReasonSelector
          onReasonSelect={handleReasonSelect}
          onSpecialtySelect={handleSpecialtySelect}
          selectedReason={selectedReason}
          selectedSpecialty={selectedSpecialty}
        />

        {/* Debug Information */}
        {(selectedReason || selectedSpecialty) && (
          <div className="mt-8 p-6 bg-muted rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Debug Information</h2>
            
            {selectedSpecialty && (
              <div className="mb-4">
                <h3 className="font-semibold">Selected Specialty:</h3>
                <pre className="text-sm bg-background p-2 rounded mt-1">
                  {JSON.stringify(selectedSpecialty, null, 2)}
                </pre>
              </div>
            )}

            {selectedReason && (
              <div>
                <h3 className="font-semibold">Selected Reason:</h3>
                <pre className="text-sm bg-background p-2 rounded mt-1">
                  {JSON.stringify(selectedReason, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}


