export interface PDFOptions {
  title?: string
  subtitle?: string
  author?: string
  orientation?: 'portrait' | 'landscape'
  includeHeader?: boolean
  includeFooter?: boolean
  includePageNumbers?: boolean
}

export class PDFGenerator {
  private options: PDFOptions
  private content: string[] = []

  constructor(options: PDFOptions = {}) {
    this.options = {
      orientation: 'portrait',
      includeHeader: true,
      includeFooter: true,
      includePageNumbers: true,
      ...options
    }
  }

  addSection(title: string): void {
    this.content.push(`# ${title}`)
  }

  addText(text: string): void {
    this.content.push(text)
  }

  addTable(table: any): void {
    this.content.push(JSON.stringify(table))
  }

  addFooter(footer: string): void {
    this.content.push(`---\n${footer}`)
  }

  getBuffer(): string {
    return this.content.join('\n\n')
  }
}

export class TherapeuticPlanPDF extends PDFGenerator {
  constructor(data: any) {
    super({
      title: 'Plan Terapéutico',
      subtitle: `${data.patient?.profile?.firstName} ${data.patient?.profile?.lastName}`,
      author: `${data.therapist?.profile?.firstName} ${data.therapist?.profile?.lastName}`
    })
  }
}

export class ProgressReportPDF extends PDFGenerator {
  constructor(data: any) {
    super({
      title: 'Reporte de Progreso',
      subtitle: `${data.patient?.profile?.firstName} ${data.patient?.profile?.lastName}`,
      author: `${data.therapist?.profile?.firstName} ${data.therapist?.profile?.lastName}`
    })
  }
}

export class FinalReportPDF extends PDFGenerator {
  constructor(data: any) {
    super({
      title: 'Reporte Final',
      subtitle: `${data.patient?.profile?.firstName} ${data.patient?.profile?.lastName}`,
      author: `${data.therapist?.profile?.firstName} ${data.therapist?.profile?.lastName}`
    })
  }
}