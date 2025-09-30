import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const generatePdfSchema = z.object({
  formId: z.string().uuid(),
  formData: z.record(z.any()).optional(),
  options: z.object({
    format: z.enum(['A4', 'LETTER', 'LEGAL']).optional(),
    orientation: z.enum(['portrait', 'landscape']).optional(),
    includeMetadata: z.boolean().optional(),
    watermark: z.string().optional()
  }).optional()
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    const validation = generatePdfSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { formId, formData, options } = validation.data

    // Fetch medical form from database
    const medicalForm = await db.medicalForm.findUnique({
      where: { id: formId },
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true,
            dateOfBirth: true,
            gender: true
          }
        },
        consultationRequest: {
          select: {
            therapist: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    })

    if (!medicalForm) {
      return NextResponse.json({ error: 'Medical form not found' }, { status: 404 })
    }

    // Generate PDF content using a proper PDF library
    // For now, we'll create a structured text-based PDF
    // In production, you would use @react-pdf/renderer or puppeteer
    
    const pdfContent = generateMedicalFormPdf(medicalForm, options)
    
    // Return PDF as blob
    return new NextResponse(pdfContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="medical-form-${formId}.pdf"`
      }
    })
  } catch (error) {
    console.error('Error generating PDF:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to generate PDF content
function generateMedicalFormPdf(medicalForm: any, options: any): Buffer {
  // Basic PDF structure with actual form data
  const patientName = `${medicalForm.patient.firstName} ${medicalForm.patient.lastName}`
  const therapistName = medicalForm.consultationRequest?.therapist 
    ? `${medicalForm.consultationRequest.therapist.firstName} ${medicalForm.consultationRequest.therapist.lastName}`
    : 'N/A'
  
  const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 300
>>
stream
BT
/F1 16 Tf
72 720 Td
(Medical Form - ${patientName}) Tj
0 -30 Td
/F1 12 Tf
(Therapist: ${therapistName}) Tj
0 -20 Td
(Date: ${new Date().toLocaleDateString()}) Tj
0 -40 Td
(Birth Complications: ${medicalForm.birthComplications || 'None reported'}) Tj
0 -20 Td
(Medical Conditions: ${medicalForm.medicalConditions || 'None reported'}) Tj
0 -20 Td
(Allergies: ${medicalForm.allergies || 'None reported'}) Tj
0 -20 Td
(Current Medications: ${medicalForm.currentMedications || 'None'}) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000204 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
550
%%EOF
`

  return Buffer.from(pdfContent, 'utf-8')
}
