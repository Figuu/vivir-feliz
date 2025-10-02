export interface CostCalculationOptions {
  includeTaxes: boolean
  taxRate: number
  includeDiscounts: boolean
  discountPercentage: number
  includeInsurance: boolean
  insuranceCoverage: number
  includePaymentFees: boolean
  paymentFeeRate: number
  currency: string
  precision: number
}

export interface Service {
  id: string
  name: string
  cost: number
  sessions: number
}

export interface CostBreakdown {
  baseCost: number
  taxes: number
  discounts: number
  insuranceCoverage: number
  paymentFees: number
  totalCost: number
}

export interface CostSummary {
  totalSessions: number
  totalDuration: number
  serviceCount: number
  calculatedAt: string
}

export class ProposalCostCalculator {
  private options: CostCalculationOptions

  constructor(options: CostCalculationOptions) {
    this.options = options
  }

  calculateCostBreakdown(selectedServices: Service[]): CostBreakdown {
    const baseCost = selectedServices.reduce((sum, service) => sum + (service.cost * service.sessions), 0)
    const taxes = this.options.includeTaxes ? baseCost * this.options.taxRate : 0
    const discounts = this.options.includeDiscounts ? baseCost * this.options.discountPercentage : 0
    const insuranceCoverage = this.options.includeInsurance ? baseCost * this.options.insuranceCoverage : 0
    const paymentFees = this.options.includePaymentFees ? baseCost * this.options.paymentFeeRate : 0
    const totalCost = baseCost + taxes - discounts - insuranceCoverage + paymentFees

    return {
      baseCost: this.roundToPrecision(baseCost),
      taxes: this.roundToPrecision(taxes),
      discounts: this.roundToPrecision(discounts),
      insuranceCoverage: this.roundToPrecision(insuranceCoverage),
      paymentFees: this.roundToPrecision(paymentFees),
      totalCost: this.roundToPrecision(totalCost)
    }
  }

  calculateCostSummary(selectedServices: Service[]): CostSummary {
    const totalSessions = selectedServices.reduce((sum, service) => sum + service.sessions, 0)
    const totalDuration = totalSessions * 60 // Assuming 60 minutes per session
    const serviceCount = selectedServices.length

    return {
      totalSessions,
      totalDuration,
      serviceCount,
      calculatedAt: new Date().toISOString()
    }
  }

  getRoleBasedCostInfo(selectedServices: Service[], userRole: 'therapist' | 'admin' | 'coordinator') {
    const costBreakdown = this.calculateCostBreakdown(selectedServices)
    const costSummary = this.calculateCostSummary(selectedServices)

    // Return different information based on user role
    switch (userRole) {
      case 'therapist':
        return {
          visibleFields: ['sessionCount', 'duration', 'serviceType'],
          costBreakdown: null,
          costSummary: null
        }
      case 'admin':
        return {
          visibleFields: ['sessionCount', 'duration', 'serviceType', 'breakdown', 'summary'],
          costBreakdown,
          costSummary
        }
      case 'coordinator':
        return {
          visibleFields: ['sessionCount', 'duration', 'serviceType', 'breakdown'],
          costBreakdown,
          costSummary: null
        }
      default:
        return {
          visibleFields: ['sessionCount', 'duration', 'serviceType'],
          costBreakdown: null,
          costSummary: null
        }
    }
  }

  private roundToPrecision(value: number): number {
    return Math.round(value * Math.pow(10, this.options.precision)) / Math.pow(10, this.options.precision)
  }
}