/**
 * Unified PDF Generation Library
 * Provides consistent PDF generation for all report types
 * Using @react-pdf/renderer for server-side PDF generation
 * TODO: Implement with @react-pdf/renderer
 */

export interface PDFOptions {
  title: string
  subtitle?: string
  author?: string
  orientation?: 'portrait' | 'landscape'
  format?: 'a4' | 'letter'
  includeHeader?: boolean
  includeFooter?: boolean
  includePageNumbers?: boolean
  headerText?: string
  footerText?: string
}

export interface TableData {
  headers: string[]
  rows: (string | number)[][]
}

export class PDFGenerator {
  private options: PDFOptions
  private content: string[] = []

  constructor(options: PDFOptions) {
    this.options = options
    this.addTitle(options.title, options.subtitle)
  }

  addTitle(title: string, subtitle?: string): void {
    this.content.push(`<h1>${title}</h1>`)
    if (subtitle) {
      this.content.push(`<h2>${subtitle}</h2>`)
    }
  }

  addSection(title: string): void {
    this.content.push(`<h3>${title}</h3>`)
  }

  addParagraph(text: string): void {
    this.content.push(`<p>${text}</p>`)
  }

  addText(text: string): void {
    this.content.push(text)
  }

  addTable(data: TableData): void {
    let tableHtml = '<table border="1">'
    tableHtml += '<thead><tr>'
    data.headers.forEach(header => {
      tableHtml += `<th>${header}</th>`
    })
    tableHtml += '</tr></thead><tbody>'
    data.rows.forEach(row => {
      tableHtml += '<tr>'
      row.forEach(cell => {
        tableHtml += `<td>${cell}</td>`
      })
      tableHtml += '</tr>'
    })
    tableHtml += '</tbody></table>'
    this.content.push(tableHtml)
  }

  addPageBreak(): void {
    this.content.push('<div style="page-break-before: always;"></div>')
  }

  addFooter(text: string): void {
    this.content.push(`<footer>${text}</footer>`)
  }

  getBuffer(): string {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${this.options.title}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          h1 { color: #333; }
          h2 { color: #666; }
          h3 { color: #888; margin-top: 30px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          footer { margin-top: 50px; text-align: center; color: #666; }
        </style>
      </head>
      <body>
        ${this.content.join('\n')}
      </body>
      </html>
    `
    return html
  }

  async save(filename: string): Promise<Blob> {
    return this.getBlob()
  }

  async getBlob(): Promise<Blob> {
    return new Blob([this.getBuffer()], { type: 'text/html' })
  }

  async getBase64(): Promise<string> {
    return Buffer.from(this.getBuffer()).toString('base64')
  }
}

// Specialized PDF classes
export class TherapeuticPlanPDF extends PDFGenerator {
  constructor(planData: any) {
    super({
      title: 'Therapeutic Plan',
      subtitle: `Patient: ${planData.patient?.firstName} ${planData.patient?.lastName}`,
      author: `Therapist: ${planData.therapist?.firstName} ${planData.therapist?.lastName}`
    })
    
    this.addSection('Plan Overview')
    this.addParagraph(planData.description || 'No description provided')
    
    if (planData.objectives && planData.objectives.length > 0) {
      this.addSection('Objectives')
      planData.objectives.forEach((obj: any, index: number) => {
        this.addParagraph(`${index + 1}. ${obj.description}`)
      })
    }
    
    if (planData.treatmentApproach) {
      this.addSection('Treatment Approach')
      this.addParagraph(planData.treatmentApproach)
    }
  }
}

export class ProgressReportPDF extends PDFGenerator {
  constructor(reportData: any) {
    super({
      title: 'Progress Report',
      subtitle: `Patient: ${reportData.patient?.firstName} ${reportData.patient?.lastName}`,
      author: `Therapist: ${reportData.therapist?.firstName} ${reportData.therapist?.lastName}`
    })
    
    this.addSection('Report Summary')
    this.addParagraph(reportData.summary || 'No summary provided')
    
    if (reportData.achievements && reportData.achievements.length > 0) {
      this.addSection('Achievements')
      reportData.achievements.forEach((achievement: any, index: number) => {
        this.addParagraph(`${index + 1}. ${achievement.description}`)
      })
    }
    
    if (reportData.clinicalAssessment) {
      this.addSection('Clinical Assessment')
      this.addParagraph(reportData.clinicalAssessment)
    }
  }
}

export class FinalReportPDF extends PDFGenerator {
  constructor(reportData: any) {
    super({
      title: 'Final Report',
      subtitle: `Patient: ${reportData.patient?.firstName} ${reportData.patient?.lastName}`,
      author: `Therapist: ${reportData.therapist?.firstName} ${reportData.therapist?.lastName}`
    })
    
    this.addSection('Final Assessment')
    this.addParagraph(reportData.finalAssessment || 'No final assessment provided')
    
    if (reportData.outcomesMeasurements && reportData.outcomesMeasurements.length > 0) {
      this.addSection('Outcome Measurements')
      reportData.outcomesMeasurements.forEach((outcome: any, index: number) => {
        this.addParagraph(`${index + 1}. ${outcome.description}: ${outcome.value}`)
      })
    }
    
    if (reportData.recommendations) {
      this.addSection('Recommendations')
      this.addParagraph(reportData.recommendations)
    }
    
    if (reportData.dischargePlanning) {
      this.addSection('Discharge Planning')
      this.addParagraph(reportData.dischargePlanning)
    }
  }
}

// Helper function for quick PDF generation
export async function generatePDF(
  options: PDFOptions,
  content: (generator: PDFGenerator) => void
): Promise<Blob> {
  const generator = new PDFGenerator(options)
  content(generator)
  return generator.getBlob()
}
