import jsPDF from 'jspdf'
import 'jspdf-autotable'

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}

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

export interface Therapist {
  id: string
  name: string
  email: string
  phone?: string
  role: 'THERAPIST' | 'COORDINATOR' | 'ADMIN'
  specialties: string[]
  certifications: string[]
  experience: number
  education: string[]
  languages: string[]
  availability: {
    days: string[]
    hours: {
      start: string
      end: string
    }
    timezone: string
  }
  location: {
    address?: string
    city?: string
    state?: string
    zipCode?: string
    country?: string
  }
  preferences: {
    maxPatientsPerDay: number
    preferredAgeGroups: string[]
    preferredServiceTypes: string[]
    workingHours: {
      start: string
      end: string
    }
  }
  performance: {
    averageRating: number
    totalPatients: number
    completionRate: number
    patientSatisfaction: number
  }
  isActive: boolean
  isAvailable: boolean
  currentWorkload: number
  maxWorkload: number
  createdAt: string
  updatedAt: string
}

export interface Proposal {
  id: string
  patientId: string
  therapistId?: string
  therapist?: Therapist
  selectedServices: SelectedService[]
  totalSessions: number
  estimatedDuration: number
  estimatedCost: number
  currency: string
  status: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED'
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  notes: string
  goals: string[]
  expectedOutcomes: string[]
  followUpRequired: boolean
  followUpNotes?: string
  createdAt: string
  updatedAt: string
  submittedAt?: string
  reviewedAt?: string
  reviewedBy?: string
  coordinatorNotes?: string
  pricingNotes?: string
  approvalNotes?: string
  adminNotes?: string
  finalApprovalNotes?: string
  budgetApproval?: boolean
  insuranceCoverage?: {
    covered: boolean
    percentage: number
    notes: string
  }
  paymentTerms?: {
    method: 'INSURANCE' | 'SELF_PAY' | 'MIXED'
    installments: number
    notes: string
  }
}

export interface CostBreakdown {
  baseCost: number
  serviceCosts: {
    serviceId: string
    serviceName: string
    sessionCount: number
    unitPrice: number
    subtotal: number
    percentage: number
  }[]
  subtotal: number
  discounts: {
    amount: number
    percentage: number
    reason?: string
  }
  taxes: {
    amount: number
    rate: number
  }
  insurance: {
    coveredAmount: number
    coveragePercentage: number
    patientResponsibility: number
  }
  paymentFees: {
    amount: number
    rate: number
  }
  total: number
  currency: string
  calculatedAt: string
}

export interface PDFGenerationOptions {
  includePricing: boolean
  includeCostBreakdown: boolean
  includeTherapistInfo: boolean
  includeNotes: boolean
  includeApprovalInfo: boolean
  includeInsuranceInfo: boolean
  includePaymentTerms: boolean
  logo?: string
  headerColor?: string
  footerText?: string
  pageSize?: 'A4' | 'LETTER'
  orientation?: 'portrait' | 'landscape'
  margins?: {
    top: number
    right: number
    bottom: number
    left: number
  }
}

export interface PDFGenerationResult {
  success: boolean
  pdf?: jsPDF
  blob?: Blob
  url?: string
  error?: string
  fileName: string
  fileSize: number
}

export class ProposalPDFGenerator {
  private defaultOptions: PDFGenerationOptions

  constructor() {
    this.defaultOptions = {
      includePricing: true,
      includeCostBreakdown: true,
      includeTherapistInfo: true,
      includeNotes: true,
      includeApprovalInfo: true,
      includeInsuranceInfo: true,
      includePaymentTerms: true,
      headerColor: '#3b82f6',
      footerText: 'Centro de Terapia Especializada - Propuesta Terapéutica',
      pageSize: 'A4',
      orientation: 'portrait',
      margins: {
        top: 20,
        right: 20,
        bottom: 20,
        left: 20
      }
    }
  }

  /**
   * Generate PDF for a therapeutic proposal
   */
  async generateProposalPDF(
    proposal: Proposal,
    costBreakdown: CostBreakdown,
    userRole: 'therapist' | 'coordinator' | 'admin',
    options: Partial<PDFGenerationOptions> = {}
  ): Promise<PDFGenerationResult> {
    try {
      const finalOptions = { ...this.defaultOptions, ...options }
      
      // Adjust options based on user role
      if (userRole === 'therapist') {
        finalOptions.includePricing = false
        finalOptions.includeCostBreakdown = false
        finalOptions.includeApprovalInfo = false
        finalOptions.includeInsuranceInfo = false
        finalOptions.includePaymentTerms = false
      }

      const pdf = new jsPDF({
        orientation: finalOptions.orientation,
        unit: 'mm',
        format: finalOptions.pageSize
      })

      // Set up page dimensions
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = finalOptions.margins!

      let currentY = margin.top

      // Generate header
      currentY = this.generateHeader(pdf, proposal, finalOptions, pageWidth, currentY)

      // Generate proposal information
      currentY = this.generateProposalInfo(pdf, proposal, finalOptions, pageWidth, currentY, margin.left)

      // Generate services table
      currentY = this.generateServicesTable(pdf, proposal, costBreakdown, finalOptions, pageWidth, currentY, margin.left)

      // Generate cost breakdown (if applicable)
      if (finalOptions.includePricing && finalOptions.includeCostBreakdown) {
        currentY = this.generateCostBreakdown(pdf, costBreakdown, finalOptions, pageWidth, currentY, margin.left)
      }

      // Generate therapist information (if applicable)
      if (finalOptions.includeTherapistInfo && proposal.therapist) {
        currentY = this.generateTherapistInfo(pdf, proposal.therapist, finalOptions, pageWidth, currentY, margin.left)
      }

      // Generate goals and outcomes
      currentY = this.generateGoalsAndOutcomes(pdf, proposal, finalOptions, pageWidth, currentY, margin.left)

      // Generate notes (if applicable)
      if (finalOptions.includeNotes) {
        currentY = this.generateNotes(pdf, proposal, finalOptions, pageWidth, currentY, margin.left)
      }

      // Generate approval information (if applicable)
      if (finalOptions.includeApprovalInfo) {
        currentY = this.generateApprovalInfo(pdf, proposal, finalOptions, pageWidth, currentY, margin.left)
      }

      // Generate insurance information (if applicable)
      if (finalOptions.includeInsuranceInfo && proposal.insuranceCoverage) {
        currentY = this.generateInsuranceInfo(pdf, proposal, finalOptions, pageWidth, currentY, margin.left)
      }

      // Generate payment terms (if applicable)
      if (finalOptions.includePaymentTerms && proposal.paymentTerms) {
        currentY = this.generatePaymentTerms(pdf, proposal, finalOptions, pageWidth, currentY, margin.left)
      }

      // Generate footer
      this.generateFooter(pdf, finalOptions, pageWidth, pageHeight, margin.bottom)

      // Generate blob and URL
      const blob = pdf.output('blob')
      const url = URL.createObjectURL(blob)
      const fileName = `propuesta-${proposal.id}-${new Date().toISOString().split('T')[0]}.pdf`

      return {
        success: true,
        pdf,
        blob,
        url,
        fileName,
        fileSize: blob.size
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        fileName: `propuesta-${proposal.id}-error.pdf`,
        fileSize: 0
      }
    }
  }

  /**
   * Generate header section
   */
  private generateHeader(
    pdf: jsPDF,
    proposal: Proposal,
    options: PDFGenerationOptions,
    pageWidth: number,
    y: number
  ): number {
    // Header background
    pdf.setFillColor(options.headerColor!)
    pdf.rect(0, 0, pageWidth, 30, 'F')

    // Title
    pdf.setTextColor(255, 255, 255)
    pdf.setFontSize(20)
    pdf.setFont('helvetica', 'bold')
    pdf.text('PROPUESTA TERAPÉUTICA', pageWidth / 2, 15, { align: 'center' })

    // Subtitle
    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'normal')
    pdf.text(`ID: ${proposal.id}`, pageWidth / 2, 22, { align: 'center' })

    // Status badge
    const statusColor = this.getStatusColor(proposal.status)
    pdf.setFillColor(statusColor.r, statusColor.g, statusColor.b)
    pdf.roundedRect(pageWidth - 50, 5, 45, 8, 2, 2, 'F')
    pdf.setTextColor(255, 255, 255)
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'bold')
    pdf.text(proposal.status.toUpperCase(), pageWidth - 27.5, 10, { align: 'center' })

    return y + 35
  }

  /**
   * Generate proposal information section
   */
  private generateProposalInfo(
    pdf: jsPDF,
    proposal: Proposal,
    options: PDFGenerationOptions,
    pageWidth: number,
    y: number,
    x: number
  ): number {
    pdf.setTextColor(0, 0, 0)
    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'bold')
    pdf.text('INFORMACIÓN DE LA PROPUESTA', x, y)

    y += 10

    const infoData = [
      ['ID de Propuesta:', proposal.id],
      ['Paciente ID:', proposal.patientId],
      ['Estado:', proposal.status],
      ['Prioridad:', proposal.priority],
      ['Fecha de Creación:', new Date(proposal.createdAt).toLocaleDateString()],
      ['Última Actualización:', new Date(proposal.updatedAt).toLocaleDateString()]
    ]

    if (proposal.submittedAt) {
      infoData.push(['Fecha de Envío:', new Date(proposal.submittedAt).toLocaleDateString()])
    }

    if (proposal.reviewedAt) {
      infoData.push(['Fecha de Revisión:', new Date(proposal.reviewedAt).toLocaleDateString()])
    }

    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'normal')

    infoData.forEach(([label, value]) => {
      pdf.setFont('helvetica', 'bold')
      pdf.text(label, x, y)
      pdf.setFont('helvetica', 'normal')
      pdf.text(value, x + 60, y)
      y += 6
    })

    return y + 10
  }

  /**
   * Generate services table
   */
  private generateServicesTable(
    pdf: jsPDF,
    proposal: Proposal,
    costBreakdown: CostBreakdown,
    options: PDFGenerationOptions,
    pageWidth: number,
    y: number,
    x: number
  ): number {
    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'bold')
    pdf.text('SERVICIOS SELECCIONADOS', x, y)

    y += 10

    // Prepare table data
    const tableData = proposal.selectedServices.map((service, index) => {
      const costInfo = costBreakdown.serviceCosts.find(c => c.serviceId === service.service.id)
      
      const row = [
        service.service.name,
        service.service.type,
        service.sessionCount.toString(),
        `${service.service.duration} min`,
        service.priority
      ]

      if (options.includePricing) {
        row.push(`$${service.service.price.toFixed(2)}`)
        row.push(`$${costInfo?.subtotal.toFixed(2) || '0.00'}`)
      }

      return row
    })

    const headers = [
      'Servicio',
      'Tipo',
      'Sesiones',
      'Duración',
      'Prioridad'
    ]

    if (options.includePricing) {
      headers.push('Precio Unit.', 'Subtotal')
    }

    // Generate table
    pdf.autoTable({
      startY: y,
      head: [headers],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 9
      },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 25 },
        2: { cellWidth: 20 },
        3: { cellWidth: 25 },
        4: { cellWidth: 25 }
      },
      margin: { left: x, right: 20 }
    })

    return (pdf as any).lastAutoTable.finalY + 10
  }

  /**
   * Generate cost breakdown section
   */
  private generateCostBreakdown(
    pdf: jsPDF,
    costBreakdown: CostBreakdown,
    options: PDFGenerationOptions,
    pageWidth: number,
    y: number,
    x: number
  ): number {
    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'bold')
    pdf.text('DESGLOSE DE COSTOS', x, y)

    y += 10

    const costData = [
      ['Subtotal:', `$${costBreakdown.subtotal.toFixed(2)}`],
      ['Descuentos:', `$${costBreakdown.discounts.amount.toFixed(2)} (${costBreakdown.discounts.percentage.toFixed(1)}%)`],
      ['Impuestos:', `$${costBreakdown.taxes.amount.toFixed(2)} (${costBreakdown.taxes.rate.toFixed(1)}%)`],
      ['Cobertura de Seguro:', `$${costBreakdown.insurance.coveredAmount.toFixed(2)} (${costBreakdown.insurance.coveragePercentage.toFixed(1)}%)`],
      ['Responsabilidad del Paciente:', `$${costBreakdown.insurance.patientResponsibility.toFixed(2)}`],
      ['Tarifas de Pago:', `$${costBreakdown.paymentFees.amount.toFixed(2)} (${costBreakdown.paymentFees.rate.toFixed(1)}%)`],
      ['TOTAL:', `$${costBreakdown.total.toFixed(2)}`]
    ]

    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'normal')

    costData.forEach(([label, value]) => {
      pdf.setFont('helvetica', 'bold')
      pdf.text(label, x, y)
      pdf.setFont('helvetica', 'normal')
      pdf.text(value, x + 80, y)
      y += 6
    })

    return y + 10
  }

  /**
   * Generate therapist information section
   */
  private generateTherapistInfo(
    pdf: jsPDF,
    therapist: Therapist,
    options: PDFGenerationOptions,
    pageWidth: number,
    y: number,
    x: number
  ): number {
    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'bold')
    pdf.text('INFORMACIÓN DEL TERAPEUTA', x, y)

    y += 10

    const therapistData = [
      ['Nombre:', therapist.name],
      ['Email:', therapist.email],
      ['Teléfono:', therapist.phone || 'No proporcionado'],
      ['Especialidades:', therapist.specialties.join(', ')],
      ['Experiencia:', `${therapist.experience} años`],
      ['Certificaciones:', therapist.certifications.join(', ')],
      ['Idiomas:', therapist.languages.join(', ')],
      ['Calificación Promedio:', therapist.performance.averageRating.toFixed(1)],
      ['Pacientes Atendidos:', therapist.performance.totalPatients.toString()],
      ['Tasa de Finalización:', `${therapist.performance.completionRate}%`]
    ]

    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'normal')

    therapistData.forEach(([label, value]) => {
      pdf.setFont('helvetica', 'bold')
      pdf.text(label, x, y)
      pdf.setFont('helvetica', 'normal')
      pdf.text(value, x + 60, y)
      y += 6
    })

    return y + 10
  }

  /**
   * Generate goals and outcomes section
   */
  private generateGoalsAndOutcomes(
    pdf: jsPDF,
    proposal: Proposal,
    options: PDFGenerationOptions,
    pageWidth: number,
    y: number,
    x: number
  ): number {
    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'bold')
    pdf.text('OBJETIVOS Y RESULTADOS ESPERADOS', x, y)

    y += 10

    // Goals
    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Objetivos:', x, y)
    y += 8

    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'normal')
    proposal.goals.forEach((goal, index) => {
      pdf.text(`${index + 1}. ${goal}`, x + 5, y)
      y += 6
    })

    y += 5

    // Expected Outcomes
    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Resultados Esperados:', x, y)
    y += 8

    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'normal')
    proposal.expectedOutcomes.forEach((outcome, index) => {
      pdf.text(`${index + 1}. ${outcome}`, x + 5, y)
      y += 6
    })

    return y + 10
  }

  /**
   * Generate notes section
   */
  private generateNotes(
    pdf: jsPDF,
    proposal: Proposal,
    options: PDFGenerationOptions,
    pageWidth: number,
    y: number,
    x: number
  ): number {
    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'bold')
    pdf.text('NOTAS Y COMENTARIOS', x, y)

    y += 10

    const notesData = [
      ['Notas de la Propuesta:', proposal.notes],
      ['Notas de Seguimiento:', proposal.followUpNotes || 'No especificado']
    ]

    if (proposal.coordinatorNotes) {
      notesData.push(['Notas del Coordinador:', proposal.coordinatorNotes])
    }

    if (proposal.pricingNotes) {
      notesData.push(['Notas de Precios:', proposal.pricingNotes])
    }

    if (proposal.approvalNotes) {
      notesData.push(['Notas de Aprobación:', proposal.approvalNotes])
    }

    if (proposal.adminNotes) {
      notesData.push(['Notas Administrativas:', proposal.adminNotes])
    }

    if (proposal.finalApprovalNotes) {
      notesData.push(['Notas de Aprobación Final:', proposal.finalApprovalNotes])
    }

    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'normal')

    notesData.forEach(([label, value]) => {
      pdf.setFont('helvetica', 'bold')
      pdf.text(label, x, y)
      y += 6
      
      pdf.setFont('helvetica', 'normal')
      const lines = pdf.splitTextToSize(value, pageWidth - x - 20)
      lines.forEach((line: string) => {
        pdf.text(line, x + 5, y)
        y += 5
      })
      y += 5
    })

    return y + 10
  }

  /**
   * Generate approval information section
   */
  private generateApprovalInfo(
    pdf: jsPDF,
    proposal: Proposal,
    options: PDFGenerationOptions,
    pageWidth: number,
    y: number,
    x: number
  ): number {
    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'bold')
    pdf.text('INFORMACIÓN DE APROBACIÓN', x, y)

    y += 10

    const approvalData = [
      ['Aprobación Presupuestaria:', proposal.budgetApproval ? 'Aprobado' : 'Pendiente'],
      ['Revisado por:', proposal.reviewedBy || 'No especificado'],
      ['Fecha de Revisión:', proposal.reviewedAt ? new Date(proposal.reviewedAt).toLocaleDateString() : 'No especificada']
    ]

    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'normal')

    approvalData.forEach(([label, value]) => {
      pdf.setFont('helvetica', 'bold')
      pdf.text(label, x, y)
      pdf.setFont('helvetica', 'normal')
      pdf.text(value, x + 80, y)
      y += 6
    })

    return y + 10
  }

  /**
   * Generate insurance information section
   */
  private generateInsuranceInfo(
    pdf: jsPDF,
    proposal: Proposal,
    options: PDFGenerationOptions,
    pageWidth: number,
    y: number,
    x: number
  ): number {
    if (!proposal.insuranceCoverage) return y

    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'bold')
    pdf.text('INFORMACIÓN DE SEGURO', x, y)

    y += 10

    const insuranceData = [
      ['Cobertura de Seguro:', proposal.insuranceCoverage.covered ? 'Sí' : 'No'],
      ['Porcentaje de Cobertura:', `${proposal.insuranceCoverage.percentage}%`],
      ['Notas de Seguro:', proposal.insuranceCoverage.notes || 'No especificado']
    ]

    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'normal')

    insuranceData.forEach(([label, value]) => {
      pdf.setFont('helvetica', 'bold')
      pdf.text(label, x, y)
      pdf.setFont('helvetica', 'normal')
      pdf.text(value, x + 80, y)
      y += 6
    })

    return y + 10
  }

  /**
   * Generate payment terms section
   */
  private generatePaymentTerms(
    pdf: jsPDF,
    proposal: Proposal,
    options: PDFGenerationOptions,
    pageWidth: number,
    y: number,
    x: number
  ): number {
    if (!proposal.paymentTerms) return y

    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'bold')
    pdf.text('TÉRMINOS DE PAGO', x, y)

    y += 10

    const paymentData = [
      ['Método de Pago:', proposal.paymentTerms.method],
      ['Número de Cuotas:', proposal.paymentTerms.installments.toString()],
      ['Notas de Pago:', proposal.paymentTerms.notes || 'No especificado']
    ]

    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'normal')

    paymentData.forEach(([label, value]) => {
      pdf.setFont('helvetica', 'bold')
      pdf.text(label, x, y)
      pdf.setFont('helvetica', 'normal')
      pdf.text(value, x + 80, y)
      y += 6
    })

    return y + 10
  }

  /**
   * Generate footer section
   */
  private generateFooter(
    pdf: jsPDF,
    options: PDFGenerationOptions,
    pageWidth: number,
    pageHeight: number,
    marginBottom: number
  ): void {
    const footerY = pageHeight - marginBottom

    // Footer line
    pdf.setDrawColor(200, 200, 200)
    pdf.line(20, footerY - 10, pageWidth - 20, footerY - 10)

    // Footer text
    pdf.setFontSize(8)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(100, 100, 100)
    pdf.text(options.footerText || 'Centro de Terapia Especializada', pageWidth / 2, footerY - 5, { align: 'center' })

    // Page number
    const pageCount = pdf.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i)
      pdf.text(`Página ${i} de ${pageCount}`, pageWidth - 20, footerY - 5, { align: 'right' })
    }
  }

  /**
   * Get status color
   */
  private getStatusColor(status: string): { r: number; g: number; b: number } {
    switch (status) {
      case 'DRAFT': return { r: 107, g: 114, b: 128 }
      case 'SUBMITTED': return { r: 59, g: 130, b: 246 }
      case 'UNDER_REVIEW': return { r: 245, g: 158, b: 11 }
      case 'APPROVED': return { r: 34, g: 197, b: 94 }
      case 'REJECTED': return { r: 239, g: 68, b: 68 }
      default: return { r: 107, g: 114, b: 128 }
    }
  }

  /**
   * Download PDF
   */
  async downloadPDF(result: PDFGenerationResult): Promise<void> {
    if (!result.success || !result.blob) {
      throw new Error(result.error || 'PDF generation failed')
    }

    const link = document.createElement('a')
    link.href = result.url!
    link.download = result.fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // Clean up URL
    URL.revokeObjectURL(result.url!)
  }

  /**
   * Get PDF as base64 string
   */
  getPDFAsBase64(result: PDFGenerationResult): string | null {
    if (!result.success || !result.pdf) {
      return null
    }

    return result.pdf.output('datauristring')
  }

  /**
   * Get PDF as blob URL
   */
  getPDFAsBlobURL(result: PDFGenerationResult): string | null {
    if (!result.success || !result.url) {
      return null
    }

    return result.url
  }
}

// Export default instance
export const defaultPDFGenerator = new ProposalPDFGenerator()
