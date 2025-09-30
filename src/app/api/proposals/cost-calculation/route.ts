import { NextRequest, NextResponse } from 'next/server'
import { validateProposalCostCalculation } from '@/lib/proposal-validation'
import { ProposalCostCalculator } from '@/lib/proposal-cost-calculator'

// Helper function to get user role from request headers
function getUserRole(request: NextRequest): string {
  return request.headers.get('x-user-role') || 'THERAPIST'
}

// POST /api/proposals/cost-calculation - Calculate proposal costs
export async function POST(request: NextRequest) {
  try {
    const userRole = getUserRole(request)
    const body = await request.json()
    
    // Validate cost calculation data
    const validation = validateProposalCostCalculation(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid cost calculation data', details: validation.error.issues },
        { status: 400 }
      )
    }
    
    const { 
      selectedServices, 
      includeTaxes, 
      taxRate, 
      includeDiscounts, 
      discountPercentage, 
      includeInsurance, 
      insuranceCoverage, 
      includePaymentFees, 
      paymentFeeRate, 
      currency, 
      precision 
    } = validation.data
    
    // Create cost calculator instance
    const calculator = new ProposalCostCalculator({
      includeTaxes,
      taxRate,
      includeDiscounts,
      discountPercentage,
      includeInsurance,
      insuranceCoverage,
      includePaymentFees,
      paymentFeeRate,
      currency,
      precision
    })
    
    // Calculate cost breakdown
    const costBreakdown = calculator.calculateCostBreakdown(selectedServices)
    const costSummary = calculator.calculateCostSummary(selectedServices)
    
    // Get role-based cost information
    const roleBasedInfo = calculator.getRoleBasedCostInfo(selectedServices, userRole as any)
    
    return NextResponse.json({
      costBreakdown: roleBasedInfo.costBreakdown || null,
      costSummary: roleBasedInfo.costSummary || null,
      roleBasedInfo,
      userRole,
      calculationOptions: {
        includeTaxes,
        taxRate,
        includeDiscounts,
        discountPercentage,
        includeInsurance,
        insuranceCoverage,
        includePaymentFees,
        paymentFeeRate,
        currency,
        precision
      },
      calculatedAt: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Error calculating proposal costs:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
