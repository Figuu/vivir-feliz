/**
 * Unified PDF Generation Library
 * Provides consistent PDF generation for all report types
 */

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

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
  private doc: jsPDF
  private currentY: number
  private pageWidth: number
  private pageHeight: number
  private margin: number

  constructor(options: PDFOptions) {
    this.doc = new jsPDF({
      orientation: options.orientation || 'portrait',
      unit: 'mm',
      format: options.format || 'a4'
    })

    this.margin = 15
    this.currentY = this.margin
    this.pageWidth = this.doc.internal.pageSize.getWidth()
    this.pageHeight = this.doc.internal.pageSize.getHeight()

    // Set document properties
    this.doc.setProperties({
      title: options.title,
      author: options.author || 'Vivir Feliz Therapy Center',
      subject: options.subtitle,
      creator: 'Vivir Feliz System'
    })

    // Add header if enabled
    if (options.includeHeader !== false) {
      this.addHeader(options.title, options.subtitle)
    }
  }

  private addHeader(title: string, subtitle?: string) {
    // Title
    this.doc.setFontSize(20)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text(title, this.pageWidth / 2, this.currentY, { align: 'center' })
    this.currentY += 10

    // Subtitle
    if (subtitle) {
      this.doc.setFontSize(12)
      this.doc.setFont('helvetica', 'normal')
      this.doc.text(subtitle, this.pageWidth / 2, this.currentY, { align: 'center' })
      this.currentY += 8
    }

    // Date
    this.doc.setFontSize(10)
    this.doc.setTextColor(128, 128, 128)
    this.doc.text(
      `Generated: ${new Date().toLocaleString()}`,
      this.pageWidth / 2,
      this.currentY,
      { align: 'center' }
    )
    this.currentY += 12
    this.doc.setTextColor(0, 0, 0)
  }

  addSection(title: string) {
    this.checkPageBreak(15)
    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text(title, this.margin, this.currentY)
    this.currentY += 8
    this.doc.setFont('helvetica', 'normal')
  }

  addText(text: string, fontSize: number = 11) {
    this.checkPageBreak(10)
    this.doc.setFontSize(fontSize)
    
    // Handle multi-line text
    const lines = this.doc.splitTextToSize(text, this.pageWidth - (2 * this.margin))
    this.doc.text(lines, this.margin, this.currentY)
    this.currentY += (lines.length * 5) + 3
  }

  addKeyValue(key: string, value: string | number) {
    this.checkPageBreak(8)
    this.doc.setFontSize(11)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text(`${key}:`, this.margin, this.currentY)
    this.doc.setFont('helvetica', 'normal')
    this.doc.text(String(value), this.margin + 50, this.currentY)
    this.currentY += 6
  }

  addTable(data: TableData) {
    this.checkPageBreak(20)

    autoTable(this.doc, {
      head: [data.headers],
      body: data.rows,
      startY: this.currentY,
      margin: { left: this.margin, right: this.margin },
      styles: {
        fontSize: 9,
        cellPadding: 3
      },
      headStyles: {
        fillColor: [59, 130, 246], // Blue
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      }
    })

    this.currentY = (this.doc as any).lastAutoTable.finalY + 10
  }

  addSpacer(height: number = 5) {
    this.currentY += height
  }

  addLine() {
    this.checkPageBreak(5)
    this.doc.setDrawColor(200, 200, 200)
    this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY)
    this.currentY += 5
  }

  private checkPageBreak(requiredSpace: number) {
    if (this.currentY + requiredSpace > this.pageHeight - this.margin) {
      this.doc.addPage()
      this.currentY = this.margin
    }
  }

  addFooter(customText?: string) {
    const pageCount = this.doc.getNumberOfPages()
    
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i)
      this.doc.setFontSize(9)
      this.doc.setTextColor(128, 128, 128)
      
      // Footer text
      if (customText) {
        this.doc.text(
          customText,
          this.margin,
          this.pageHeight - 10
        )
      }
      
      // Page numbers
      this.doc.text(
        `Page ${i} of ${pageCount}`,
        this.pageWidth - this.margin,
        this.pageHeight - 10,
        { align: 'right' }
      )
    }
    
    this.doc.setTextColor(0, 0, 0)
  }

  getBlob(): Blob {
    return this.doc.output('blob')
  }

  getDataUrl(): string {
    return this.doc.output('dataurlstring')
  }

  download(filename: string) {
    this.doc.save(filename)
  }

  getBuffer(): ArrayBuffer {
    return this.doc.output('arraybuffer')
  }
}

// Specialized PDF generators for different report types
export class TherapeuticPlanPDF extends PDFGenerator {
  constructor(planData: any) {
    super({
      title: 'Therapeutic Plan',
      subtitle: `Patient: ${planData.patient?.firstName} ${planData.patient?.lastName}`,
      author: `${planData.therapist?.firstName} ${planData.therapist?.lastName}`
    })

    this.generateContent(planData)
    this.addFooter('Vivir Feliz Therapy Center - Confidential')
  }

  private generateContent(data: any) {
    // Treatment approach
    if (data.treatmentApproach) {
      this.addSection('Treatment Approach')
      this.addText(data.treatmentApproach.approach)
      this.addSpacer(5)
    }

    // Objectives
    if (data.objectives && data.objectives.length > 0) {
      this.addSection('Treatment Objectives')
      data.objectives.forEach((obj: any, index: number) => {
        this.addText(`${index + 1}. ${obj.objective}`)
        this.addKeyValue('Category', obj.category)
        this.addKeyValue('Priority', obj.priority)
        if (obj.targetDate) {
          this.addKeyValue('Target Date', new Date(obj.targetDate).toLocaleDateString())
        }
        this.addSpacer(3)
      })
    }

    // Metrics
    if (data.metrics && data.metrics.length > 0) {
      this.addSection('Progress Metrics')
      const tableData: TableData = {
        headers: ['Metric', 'Type', 'Target', 'Frequency'],
        rows: data.metrics.map((m: any) => [
          m.metricName,
          m.metricType,
          m.targetValue || 'N/A',
          m.measurementFrequency
        ])
      }
      this.addTable(tableData)
    }
  }
}

export class ProgressReportPDF extends PDFGenerator {
  constructor(reportData: any) {
    super({
      title: 'Progress Report',
      subtitle: `Patient: ${reportData.patient?.firstName} ${reportData.patient?.lastName}`,
      author: `${reportData.therapist?.firstName} ${reportData.therapist?.lastName}`
    })

    this.generateContent(reportData)
    this.addFooter('Vivir Feliz Therapy Center - Confidential')
  }

  private generateContent(data: any) {
    // Report info
    this.addKeyValue('Report Period', `${new Date(data.reportPeriodStart).toLocaleDateString()} - ${new Date(data.reportPeriodEnd).toLocaleDateString()}`)
    this.addKeyValue('Report Number', data.reportNumber || 'N/A')
    this.addSpacer(5)

    // Achievements
    if (data.achievements && data.achievements.length > 0) {
      this.addSection('Achievements')
      const tableData: TableData = {
        headers: ['Objective', 'Progress', 'Level'],
        rows: data.achievements.map((a: any) => [
          a.objectiveTitle,
          `${a.progressPercentage}%`,
          a.achievementLevel
        ])
      }
      this.addTable(tableData)
    }

    // Clinical assessment
    if (data.clinicalAssessment) {
      this.addSection('Clinical Assessment')
      this.addText(data.clinicalAssessment.overallAssessment)
    }
  }
}

export class FinalReportPDF extends PDFGenerator {
  constructor(reportData: any) {
    super({
      title: 'Final Treatment Report',
      subtitle: `Patient: ${reportData.patient?.firstName} ${reportData.patient?.lastName}`,
      author: `${reportData.therapist?.firstName} ${reportData.therapist?.lastName}`
    })

    this.generateContent(reportData)
    this.addFooter('Vivir Feliz Therapy Center - Confidential')
  }

  private generateContent(data: any) {
    // Treatment summary
    this.addKeyValue('Treatment Duration', `${new Date(data.treatmentStartDate).toLocaleDateString()} - ${new Date(data.treatmentEndDate).toLocaleDateString()}`)
    this.addKeyValue('Total Sessions', data.totalSessions || 'N/A')
    this.addSpacer(5)

    // Outcomes
    if (data.outcomesMeasurements && data.outcomesMeasurements.length > 0) {
      this.addSection('Treatment Outcomes')
      const tableData: TableData = {
        headers: ['Metric', 'Initial', 'Final', 'Improvement'],
        rows: data.outcomesMeasurements.map((o: any) => [
          o.metricName,
          o.initialValue,
          o.finalValue,
          o.improvementPercentage ? `${o.improvementPercentage}%` : 'N/A'
        ])
      }
      this.addTable(tableData)
    }

    // Discharge planning
    if (data.dischargePlanning) {
      this.addSection('Discharge Planning')
      this.addText(data.dischargePlanning.dischargeSummary)
    }
  }
}
