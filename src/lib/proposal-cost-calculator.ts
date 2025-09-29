import { Decimal } from 'decimal.js'

// Configure Decimal.js for precise calculations
Decimal.set({
  precision: 10,
  rounding: Decimal.ROUND_HALF_UP,
  toExpNeg: -9e15,
  toExpPos: 9e15,
  maxE: 9e15,
  minE: -9e15,
  modulo: Decimal.ROUND_FLOOR,
  crypto: false
})

export interface Service {
  id: string
  code: string
  name: string
  description: string
  categoryId: string
  category: {
    id: string
    name: string
    color: string
    icon: string
  }
  type: 'EVALUATION' | 'TREATMENT' | 'CONSULTATION' | 'FOLLOW_UP' | 'ASSESSMENT'
  duration: number
  price: number
  currency: string
  isActive: boolean
  requiresApproval: boolean
  maxSessions?: number
  minSessions?: number
  ageRange?: {
    min: number
    max: number
  }
  prerequisites?: string[]
  outcomes?: string[]
  tags: string[]
}

export interface SelectedService {
  service: Service
  sessionCount: number
  notes: string
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
}

export interface CostCalculationOptions {
  includeTaxes?: boolean
  taxRate?: number
  includeDiscounts?: boolean
  discountPercentage?: number
  includeInsurance?: boolean
  insuranceCoverage?: number
  includePaymentFees?: boolean
  paymentFeeRate?: number
  currency?: string
  precision?: number
}

export interface CostBreakdown {
  baseCost: Decimal
  serviceCosts: {
    serviceId: string
    serviceName: string
    sessionCount: number
    unitPrice: Decimal
    subtotal: Decimal
    percentage: Decimal
  }[]
  subtotal: Decimal
  discounts: {
    amount: Decimal
    percentage: Decimal
    reason?: string
  }
  taxes: {
    amount: Decimal
    rate: Decimal
  }
  insurance: {
    coveredAmount: Decimal
    coveragePercentage: Decimal
    patientResponsibility: Decimal
  }
  paymentFees: {
    amount: Decimal
    rate: Decimal
  }
  total: Decimal
  currency: string
  calculatedAt: string
  options: CostCalculationOptions
}

export interface CostSummary {
  totalSessions: number
  totalDuration: number
  totalCost: Decimal
  costPerSession: Decimal
  costPerHour: Decimal
  averageServiceCost: Decimal
  mostExpensiveService: {
    serviceId: string
    serviceName: string
    cost: Decimal
  }
  leastExpensiveService: {
    serviceId: string
    serviceName: string
    cost: Decimal
  }
  costDistribution: {
    evaluation: Decimal
    treatment: Decimal
    consultation: Decimal
    followUp: Decimal
    assessment: Decimal
  }
}

export interface RoleBasedCostVisibility {
  therapist: {
    canViewPricing: false
    canViewCosts: false
    canViewBreakdown: false
    visibleFields: ['sessionCount', 'duration', 'serviceType']
  }
  coordinator: {
    canViewPricing: true
    canViewCosts: true
    canViewBreakdown: true
    visibleFields: ['sessionCount', 'duration', 'serviceType', 'pricing', 'costs', 'breakdown']
  }
  admin: {
    canViewPricing: true
    canViewCosts: true
    canViewBreakdown: true
    canViewAllDetails: true
    visibleFields: ['sessionCount', 'duration', 'serviceType', 'pricing', 'costs', 'breakdown', 'taxes', 'discounts', 'insurance', 'paymentFees']
  }
}

export class ProposalCostCalculator {
  private options: CostCalculationOptions
  private roleBasedVisibility: RoleBasedCostVisibility

  constructor(options: CostCalculationOptions = {}) {
    this.options = {
      includeTaxes: false,
      taxRate: 0,
      includeDiscounts: false,
      discountPercentage: 0,
      includeInsurance: false,
      insuranceCoverage: 0,
      includePaymentFees: false,
      paymentFeeRate: 0,
      currency: 'USD',
      precision: 2,
      ...options
    }
    
    this.roleBasedVisibility = {
      therapist: {
        canViewPricing: false,
        canViewCosts: false,
        canViewBreakdown: false,
        visibleFields: ['sessionCount', 'duration', 'serviceType']
      },
      coordinator: {
        canViewPricing: true,
        canViewCosts: true,
        canViewBreakdown: true,
        visibleFields: ['sessionCount', 'duration', 'serviceType', 'pricing', 'costs', 'breakdown']
      },
      admin: {
        canViewPricing: true,
        canViewCosts: true,
        canViewBreakdown: true,
        canViewAllDetails: true,
        visibleFields: ['sessionCount', 'duration', 'serviceType', 'pricing', 'costs', 'breakdown', 'taxes', 'discounts', 'insurance', 'paymentFees']
      }
    }
  }

  /**
   * Calculate the complete cost breakdown for a proposal
   */
  calculateCostBreakdown(selectedServices: SelectedService[]): CostBreakdown {
    if (!selectedServices || selectedServices.length === 0) {
      return this.createEmptyCostBreakdown()
    }

    // Calculate base costs for each service
    const serviceCosts = selectedServices.map(service => {
      const unitPrice = new Decimal(service.service.price)
      const sessionCount = new Decimal(service.sessionCount)
      const subtotal = unitPrice.mul(sessionCount)
      
      return {
        serviceId: service.service.id,
        serviceName: service.service.name,
        sessionCount: service.sessionCount,
        unitPrice,
        subtotal,
        percentage: new Decimal(0) // Will be calculated after total
      }
    })

    // Calculate subtotal
    const subtotal = serviceCosts.reduce((sum, service) => sum.add(service.subtotal), new Decimal(0))

    // Calculate percentages
    serviceCosts.forEach(service => {
      if (subtotal.greaterThan(0)) {
        service.percentage = service.subtotal.div(subtotal).mul(100)
      }
    })

    // Calculate discounts
    const discountAmount = this.calculateDiscounts(subtotal)
    const discountPercentage = this.options.discountPercentage || 0

    // Calculate taxes
    const taxableAmount = subtotal.sub(discountAmount)
    const taxAmount = this.calculateTaxes(taxableAmount)
    const taxRate = this.options.taxRate || 0

    // Calculate insurance coverage
    const insuranceCoverage = this.calculateInsuranceCoverage(subtotal.sub(discountAmount))
    const insuranceCoveragePercentage = this.options.insuranceCoverage || 0
    const patientResponsibility = subtotal.sub(discountAmount).sub(insuranceCoverage.coveredAmount)

    // Calculate payment fees
    const paymentFeeAmount = this.calculatePaymentFees(patientResponsibility)
    const paymentFeeRate = this.options.paymentFeeRate || 0

    // Calculate total
    const total = subtotal
      .sub(discountAmount)
      .add(taxAmount)
      .sub(insuranceCoverage.coveredAmount)
      .add(paymentFeeAmount)

    return {
      baseCost: subtotal,
      serviceCosts,
      subtotal,
      discounts: {
        amount: discountAmount,
        percentage: new Decimal(discountPercentage),
        reason: this.options.includeDiscounts ? 'Applied discount' : undefined
      },
      taxes: {
        amount: taxAmount,
        rate: new Decimal(taxRate)
      },
      insurance: {
        coveredAmount: insuranceCoverage.coveredAmount,
        coveragePercentage: new Decimal(insuranceCoveragePercentage),
        patientResponsibility
      },
      paymentFees: {
        amount: paymentFeeAmount,
        rate: new Decimal(paymentFeeRate)
      },
      total,
      currency: this.options.currency || 'USD',
      calculatedAt: new Date().toISOString(),
      options: { ...this.options }
    }
  }

  /**
   * Calculate cost summary for a proposal
   */
  calculateCostSummary(selectedServices: SelectedService[]): CostSummary {
    if (!selectedServices || selectedServices.length === 0) {
      return this.createEmptyCostSummary()
    }

    const totalSessions = selectedServices.reduce((sum, service) => sum + service.sessionCount, 0)
    const totalDuration = selectedServices.reduce((sum, service) => 
      sum + (service.service.duration * service.sessionCount), 0
    )

    const costBreakdown = this.calculateCostBreakdown(selectedServices)
    const totalCost = costBreakdown.total

    const costPerSession = totalSessions > 0 ? totalCost.div(totalSessions) : new Decimal(0)
    const costPerHour = totalDuration > 0 ? totalCost.div(totalDuration / 60) : new Decimal(0)

    // Calculate average service cost
    const averageServiceCost = selectedServices.length > 0 
      ? totalCost.div(selectedServices.length) 
      : new Decimal(0)

    // Find most and least expensive services
    const serviceCosts = selectedServices.map(service => ({
      serviceId: service.service.id,
      serviceName: service.service.name,
      cost: new Decimal(service.service.price).mul(service.sessionCount)
    }))

    const mostExpensiveService = serviceCosts.reduce((max, current) => 
      current.cost.greaterThan(max.cost) ? current : max
    )

    const leastExpensiveService = serviceCosts.reduce((min, current) => 
      current.cost.lessThan(min.cost) ? current : min
    )

    // Calculate cost distribution by service type
    const costDistribution = selectedServices.reduce((dist, service) => {
      const cost = new Decimal(service.service.price).mul(service.sessionCount)
      dist[service.service.type.toLowerCase() as keyof typeof dist] = 
        dist[service.service.type.toLowerCase() as keyof typeof dist].add(cost)
      return dist
    }, {
      evaluation: new Decimal(0),
      treatment: new Decimal(0),
      consultation: new Decimal(0),
      followUp: new Decimal(0),
      assessment: new Decimal(0)
    })

    return {
      totalSessions,
      totalDuration,
      totalCost,
      costPerSession,
      costPerHour,
      averageServiceCost,
      mostExpensiveService,
      leastExpensiveService,
      costDistribution
    }
  }

  /**
   * Get cost information based on user role
   */
  getRoleBasedCostInfo(selectedServices: SelectedService[], userRole: 'therapist' | 'coordinator' | 'admin') {
    const visibility = this.roleBasedVisibility[userRole]
    const costBreakdown = this.calculateCostBreakdown(selectedServices)
    const costSummary = this.calculateCostSummary(selectedServices)

    const baseInfo = {
      totalSessions: costSummary.totalSessions,
      totalDuration: costSummary.totalDuration,
      serviceCount: selectedServices.length,
      calculatedAt: costBreakdown.calculatedAt
    }

    switch (userRole) {
      case 'therapist':
        return {
          ...baseInfo,
          visibleFields: visibility.visibleFields,
          services: selectedServices.map(service => ({
            serviceId: service.service.id,
            serviceName: service.service.name,
            serviceType: service.service.type,
            sessionCount: service.sessionCount,
            duration: service.service.duration,
            notes: service.notes,
            priority: service.priority
          }))
        }

      case 'coordinator':
        return {
          ...baseInfo,
          visibleFields: visibility.visibleFields,
          services: selectedServices.map(service => ({
            serviceId: service.service.id,
            serviceName: service.service.name,
            serviceType: service.service.type,
            sessionCount: service.sessionCount,
            duration: service.service.duration,
            unitPrice: service.service.price,
            subtotal: costBreakdown.serviceCosts.find(s => s.serviceId === service.service.id)?.subtotal.toNumber() || 0,
            notes: service.notes,
            priority: service.priority
          })),
          costSummary: {
            subtotal: costBreakdown.subtotal.toNumber(),
            total: costBreakdown.total.toNumber(),
            currency: costBreakdown.currency
          }
        }

      case 'admin':
        return {
          ...baseInfo,
          visibleFields: visibility.visibleFields,
          services: selectedServices.map(service => ({
            serviceId: service.service.id,
            serviceName: service.service.name,
            serviceType: service.service.type,
            sessionCount: service.sessionCount,
            duration: service.service.duration,
            unitPrice: service.service.price,
            subtotal: costBreakdown.serviceCosts.find(s => s.serviceId === service.service.id)?.subtotal.toNumber() || 0,
            notes: service.notes,
            priority: service.priority
          })),
          costBreakdown: {
            baseCost: costBreakdown.baseCost.toNumber(),
            subtotal: costBreakdown.subtotal.toNumber(),
            discounts: {
              amount: costBreakdown.discounts.amount.toNumber(),
              percentage: costBreakdown.discounts.percentage.toNumber()
            },
            taxes: {
              amount: costBreakdown.taxes.amount.toNumber(),
              rate: costBreakdown.taxes.rate.toNumber()
            },
            insurance: {
              coveredAmount: costBreakdown.insurance.coveredAmount.toNumber(),
              coveragePercentage: costBreakdown.insurance.coveragePercentage.toNumber(),
              patientResponsibility: costBreakdown.insurance.patientResponsibility.toNumber()
            },
            paymentFees: {
              amount: costBreakdown.paymentFees.amount.toNumber(),
              rate: costBreakdown.paymentFees.rate.toNumber()
            },
            total: costBreakdown.total.toNumber(),
            currency: costBreakdown.currency
          },
          costSummary: {
            totalSessions: costSummary.totalSessions,
            totalDuration: costSummary.totalDuration,
            totalCost: costSummary.totalCost.toNumber(),
            costPerSession: costSummary.costPerSession.toNumber(),
            costPerHour: costSummary.costPerHour.toNumber(),
            averageServiceCost: costSummary.averageServiceCost.toNumber(),
            mostExpensiveService: {
              ...costSummary.mostExpensiveService,
              cost: costSummary.mostExpensiveService.cost.toNumber()
            },
            leastExpensiveService: {
              ...costSummary.leastExpensiveService,
              cost: costSummary.leastExpensiveService.cost.toNumber()
            },
            costDistribution: {
              evaluation: costSummary.costDistribution.evaluation.toNumber(),
              treatment: costSummary.costDistribution.treatment.toNumber(),
              consultation: costSummary.costDistribution.consultation.toNumber(),
              followUp: costSummary.costDistribution.followUp.toNumber(),
              assessment: costSummary.costDistribution.assessment.toNumber()
            }
          }
        }

      default:
        return baseInfo
    }
  }

  /**
   * Validate cost calculation options
   */
  validateOptions(options: CostCalculationOptions): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (options.taxRate !== undefined && (options.taxRate < 0 || options.taxRate > 100)) {
      errors.push('Tax rate must be between 0 and 100')
    }

    if (options.discountPercentage !== undefined && (options.discountPercentage < 0 || options.discountPercentage > 100)) {
      errors.push('Discount percentage must be between 0 and 100')
    }

    if (options.insuranceCoverage !== undefined && (options.insuranceCoverage < 0 || options.insuranceCoverage > 100)) {
      errors.push('Insurance coverage must be between 0 and 100')
    }

    if (options.paymentFeeRate !== undefined && (options.paymentFeeRate < 0 || options.paymentFeeRate > 100)) {
      errors.push('Payment fee rate must be between 0 and 100')
    }

    if (options.precision !== undefined && (options.precision < 0 || options.precision > 10)) {
      errors.push('Precision must be between 0 and 10')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Update calculation options
   */
  updateOptions(newOptions: Partial<CostCalculationOptions>): void {
    const validation = this.validateOptions({ ...this.options, ...newOptions })
    
    if (!validation.isValid) {
      throw new Error(`Invalid options: ${validation.errors.join(', ')}`)
    }

    this.options = { ...this.options, ...newOptions }
  }

  /**
   * Get current options
   */
  getOptions(): CostCalculationOptions {
    return { ...this.options }
  }

  /**
   * Calculate discounts
   */
  private calculateDiscounts(subtotal: Decimal): Decimal {
    if (!this.options.includeDiscounts || !this.options.discountPercentage) {
      return new Decimal(0)
    }

    return subtotal.mul(this.options.discountPercentage / 100)
  }

  /**
   * Calculate taxes
   */
  private calculateTaxes(taxableAmount: Decimal): Decimal {
    if (!this.options.includeTaxes || !this.options.taxRate) {
      return new Decimal(0)
    }

    return taxableAmount.mul(this.options.taxRate / 100)
  }

  /**
   * Calculate insurance coverage
   */
  private calculateInsuranceCoverage(coveredAmount: Decimal): { coveredAmount: Decimal } {
    if (!this.options.includeInsurance || !this.options.insuranceCoverage) {
      return { coveredAmount: new Decimal(0) }
    }

    return {
      coveredAmount: coveredAmount.mul(this.options.insuranceCoverage / 100)
    }
  }

  /**
   * Calculate payment fees
   */
  private calculatePaymentFees(amount: Decimal): Decimal {
    if (!this.options.includePaymentFees || !this.options.paymentFeeRate) {
      return new Decimal(0)
    }

    return amount.mul(this.options.paymentFeeRate / 100)
  }

  /**
   * Create empty cost breakdown
   */
  private createEmptyCostBreakdown(): CostBreakdown {
    return {
      baseCost: new Decimal(0),
      serviceCosts: [],
      subtotal: new Decimal(0),
      discounts: {
        amount: new Decimal(0),
        percentage: new Decimal(0)
      },
      taxes: {
        amount: new Decimal(0),
        rate: new Decimal(0)
      },
      insurance: {
        coveredAmount: new Decimal(0),
        coveragePercentage: new Decimal(0),
        patientResponsibility: new Decimal(0)
      },
      paymentFees: {
        amount: new Decimal(0),
        rate: new Decimal(0)
      },
      total: new Decimal(0),
      currency: this.options.currency || 'USD',
      calculatedAt: new Date().toISOString(),
      options: { ...this.options }
    }
  }

  /**
   * Create empty cost summary
   */
  private createEmptyCostSummary(): CostSummary {
    return {
      totalSessions: 0,
      totalDuration: 0,
      totalCost: new Decimal(0),
      costPerSession: new Decimal(0),
      costPerHour: new Decimal(0),
      averageServiceCost: new Decimal(0),
      mostExpensiveService: {
        serviceId: '',
        serviceName: '',
        cost: new Decimal(0)
      },
      leastExpensiveService: {
        serviceId: '',
        serviceName: '',
        cost: new Decimal(0)
      },
      costDistribution: {
        evaluation: new Decimal(0),
        treatment: new Decimal(0),
        consultation: new Decimal(0),
        followUp: new Decimal(0),
        assessment: new Decimal(0)
      }
    }
  }
}

// Utility functions for common calculations
export const CostCalculationUtils = {
  /**
   * Format currency with proper precision
   */
  formatCurrency(amount: Decimal, currency: string = 'USD', precision: number = 2): string {
    const formattedAmount = amount.toFixed(precision)
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: precision,
      maximumFractionDigits: precision
    }).format(parseFloat(formattedAmount))
  },

  /**
   * Convert string to Decimal with validation
   */
  parseDecimal(value: string | number): Decimal {
    try {
      return new Decimal(value)
    } catch (error) {
      throw new Error(`Invalid decimal value: ${value}`)
    }
  },

  /**
   * Validate decimal precision
   */
  validatePrecision(value: Decimal, maxPrecision: number = 2): boolean {
    const decimalPlaces = value.decimalPlaces()
    return decimalPlaces <= maxPrecision
  },

  /**
   * Round to specified precision
   */
  roundToPrecision(value: Decimal, precision: number): Decimal {
    return value.toDecimalPlaces(precision, Decimal.ROUND_HALF_UP)
  },

  /**
   * Calculate percentage
   */
  calculatePercentage(part: Decimal, total: Decimal): Decimal {
    if (total.equals(0)) {
      return new Decimal(0)
    }
    return part.div(total).mul(100)
  },

  /**
   * Calculate percentage of total
   */
  calculatePercentageOf(percentage: Decimal, total: Decimal): Decimal {
    return total.mul(percentage.div(100))
  }
}

// Export default instance
export const defaultCostCalculator = new ProposalCostCalculator()
