import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { PDFGenerator, TherapeuticPlanPDF, ProgressReportPDF, FinalReportPDF } from '@/lib/pdf-generator'

const pdfRequestSchema = z.object({
  reportType: z.enum(['therapeutic_plan', 'progress_report', 'final_report', 'custom']),
  reportId: z.string().uuid('Invalid report ID').optional(),
  customData: z.record(z.string(), z.any()).optional(),
  options: z.object({
    title: z.string().optional(),
    subtitle: z.string().optional(),
    author: z.string().optional(),
    orientation: z.enum(['portrait', 'landscape']).optional(),
    includeHeader: z.boolean().optional(),
    includeFooter: z.boolean().optional(),
    includePageNumbers: z.boolean().optional()
  }).optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const validation = pdfRequestSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { reportType, reportId, customData, options } = validation.data

    let pdf: PDFGenerator | null = null
    let filename = 'report.pdf'

    // Generate PDF based on report type
    switch (reportType) {
      case 'therapeutic_plan':
        if (!reportId) {
          return NextResponse.json(
            { error: 'Report ID required for therapeutic plan' },
            { status: 400 }
          )
        }

        const planData = await db.therapeuticPlan.findUnique({
          where: { id: reportId },
          include: {
            patient: { 
              select: { 
                profile: {
                  select: {
                    firstName: true, 
                    lastName: true 
                  }
                }
              } 
            },
            therapist: { 
              select: { 
                profile: {
                  select: {
                    firstName: true, 
                    lastName: true 
                  }
                }
              } 
            },
            objectives: true,
            metrics: true,
            treatmentApproach: true
          }
        })

        if (!planData) {
          return NextResponse.json(
            { error: 'Therapeutic plan not found' },
            { status: 404 }
          )
        }

        pdf = new TherapeuticPlanPDF(planData)
        filename = `therapeutic-plan-${reportId}.pdf`
        break

      case 'progress_report':
        if (!reportId) {
          return NextResponse.json(
            { error: 'Report ID required for progress report' },
            { status: 400 }
          )
        }

        const progressData = await db.progressReport.findUnique({
          where: { id: reportId },
          include: {
            patient: { 
              select: { 
                profile: {
                  select: {
                    firstName: true, 
                    lastName: true 
                  }
                }
              } 
            },
            therapist: { 
              select: { 
                profile: {
                  select: {
                    firstName: true, 
                    lastName: true 
                  }
                }
              } 
            },
            achievements: true,
            metrics: true,
            clinicalAssessment: true
          }
        })

        if (!progressData) {
          return NextResponse.json(
            { error: 'Progress report not found' },
            { status: 404 }
          )
        }

        pdf = new ProgressReportPDF(progressData)
        filename = `progress-report-${reportId}.pdf`
        break

      case 'final_report':
        if (!reportId) {
          return NextResponse.json(
            { error: 'Report ID required for final report' },
            { status: 400 }
          )
        }

        const finalData = await db.finalReport.findUnique({
          where: { id: reportId },
          include: {
            patient: { 
              select: { 
                profile: {
                  select: {
                    firstName: true, 
                    lastName: true 
                  }
                }
              } 
            },
            therapist: { 
              select: { 
                profile: {
                  select: {
                    firstName: true, 
                    lastName: true 
                  }
                }
              } 
            },
            outcomesMeasurements: true,
            objectiveOutcomes: true,
            recommendations: true,
            dischargePlanning: true
          }
        })

        if (!finalData) {
          return NextResponse.json(
            { error: 'Final report not found' },
            { status: 404 }
          )
        }

        pdf = new FinalReportPDF(finalData)
        filename = `final-report-${reportId}.pdf`
        break

      case 'custom':
        if (!customData || !options?.title) {
          return NextResponse.json(
            { error: 'Custom data and title required for custom report' },
            { status: 400 }
          )
        }

        pdf = new PDFGenerator({
          title: options.title,
          subtitle: options.subtitle,
          author: options.author,
          orientation: options.orientation,
          includeHeader: options.includeHeader,
          includeFooter: options.includeFooter,
          includePageNumbers: options.includePageNumbers
        })

        // Add custom content
        if (customData.sections) {
          customData.sections.forEach((section: any) => {
            pdf!.addSection(section.title)
            if (section.content) {
              pdf!.addText(section.content)
            }
            if (section.table) {
              pdf!.addTable(section.table)
            }
          })
        }

        if (options.includeFooter !== false) {
          pdf.addFooter('Vivir Feliz Therapy Center')
        }

        filename = `custom-report-${Date.now()}.pdf`
        break

      default:
        return NextResponse.json(
          { error: 'Unsupported report type' },
          { status: 400 }
        )
    }

    if (!pdf) {
      return NextResponse.json(
        { error: 'Failed to generate PDF' },
        { status: 500 }
      )
    }

    // Get PDF as buffer
    const pdfBuffer = Buffer.from(pdf.getBuffer())

    // Return PDF file
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString()
      }
    })

  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
