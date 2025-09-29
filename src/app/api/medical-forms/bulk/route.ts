import { NextRequest, NextResponse } from 'next/server'
import { MedicalFormManager } from '@/lib/medical-form-manager-fixed'
import { z } from 'zod'

const bulkOperationSchema = z.object({
  operation: z.enum(['DELETE', 'APPROVE', 'SUBMIT']),
  formIds: z.array(z.string().uuid('Invalid form ID format')).min(1, 'At least one form ID is required'),
  userId: z.string().uuid('Invalid user ID format'),
  notes: z.string().max(1000, 'Notes cannot exceed 1000 characters').optional()
})

// POST - Bulk operations on medical forms
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validationResult = bulkOperationSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation failed',
          details: validationResult.error.flatten().fieldErrors
        },
        { status: 400 }
      )
    }
    
    const { operation, formIds, userId, notes } = validationResult.data
    
    const results = []
    const errors = []
    
    // Process each form
    for (const formId of formIds) {
      try {
        let result
        
        switch (operation) {
          case 'DELETE':
            result = await MedicalFormManager.deleteMedicalForm(formId)
            results.push({ formId, success: true, operation: 'DELETE' })
            break
            
          case 'APPROVE':
            result = await MedicalFormManager.approveForm(formId, userId, notes)
            results.push({ formId, success: true, operation: 'APPROVE', data: result })
            break
            
          case 'SUBMIT':
            result = await MedicalFormManager.submitFormForReview(formId, userId)
            results.push({ formId, success: true, operation: 'SUBMIT', data: result })
            break
            
          default:
            throw new Error(`Unsupported operation: ${operation}`)
        }
      } catch (error) {
        errors.push({
          formId,
          error: error instanceof Error ? error.message : 'Unknown error',
          operation
        })
      }
    }
    
    return NextResponse.json({
      success: true,
      data: {
        results,
        errors,
        summary: {
          total: formIds.length,
          successful: results.length,
          failed: errors.length
        }
      },
      message: `Bulk ${operation.toLowerCase()} operation completed`
    })
    
  } catch (error) {
    console.error('Error performing bulk operation:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to perform bulk operation' 
      },
      { status: 500 }
    )
  }
}
