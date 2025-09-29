'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Download, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  Loader2,
  Printer,
  Share2,
  Mail
} from 'lucide-react'

interface PDFGeneratorProps {
  content: React.ReactNode
  filename: string
  title: string
  onGenerate?: (pdfBlob: Blob) => void
  onError?: (error: string) => void
  showPreview?: boolean
  showProgress?: boolean
  autoDownload?: boolean
}

export function PDFGenerator({
  content,
  filename,
  title,
  onGenerate,
  onError,
  showPreview = true,
  showProgress = true,
  autoDownload = true
}: PDFGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  // Mock PDF generation function
  const generatePDF = async () => {
    setIsGenerating(true)
    setProgress(0)
    setError(null)
    setSuccess(false)

    try {
      // Simulate PDF generation progress
      const steps = [
        { progress: 20, message: 'Preparando contenido...' },
        { progress: 40, message: 'Aplicando estilos...' },
        { progress: 60, message: 'Generando PDF...' },
        { progress: 80, message: 'Optimizando documento...' },
        { progress: 100, message: 'Completado' }
      ]

      for (const step of steps) {
        await new Promise(resolve => setTimeout(resolve, 500))
        setProgress(step.progress)
      }

      // Create a mock PDF blob
      const mockPdfContent = `
        %PDF-1.4
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
        /Length 44
        >>
        stream
        BT
        /F1 12 Tf
        72 720 Td
        (${title}) Tj
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
        297
        %%EOF
      `

      const pdfBlob = new Blob([mockPdfContent], { type: 'application/pdf' })
      const url = URL.createObjectURL(pdfBlob)
      
      setPdfUrl(url)
      setSuccess(true)

      if (onGenerate) {
        onGenerate(pdfBlob)
      }

      if (autoDownload) {
        downloadPDF(pdfBlob, filename)
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al generar PDF'
      setError(errorMessage)
      
      if (onError) {
        onError(errorMessage)
      }
    } finally {
      setIsGenerating(false)
    }
  }

  // Download PDF
  const downloadPDF = (pdfBlob: Blob, filename: string) => {
    const url = URL.createObjectURL(pdfBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Handle download
  const handleDownload = () => {
    if (pdfUrl) {
      const link = document.createElement('a')
      link.href = pdfUrl
      link.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  // Handle print
  const handlePrint = () => {
    if (pdfUrl) {
      const printWindow = window.open(pdfUrl, '_blank')
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print()
        }
      }
    }
  }

  // Handle share
  const handleShare = async () => {
    if (pdfUrl && navigator.share) {
      try {
        const response = await fetch(pdfUrl)
        const blob = await response.blob()
        const file = new File([blob], filename, { type: 'application/pdf' })
        
        await navigator.share({
          title: title,
          text: `Formulario médico: ${title}`,
          files: [file]
        })
      } catch (err) {
        console.error('Error sharing:', err)
      }
    }
  }

  // Handle email
  const handleEmail = () => {
    if (pdfUrl) {
      const subject = encodeURIComponent(`Formulario Médico: ${title}`)
      const body = encodeURIComponent('Adjunto encontrará el formulario médico solicitado.')
      const mailtoUrl = `mailto:?subject=${subject}&body=${body}`
      window.open(mailtoUrl)
    }
  }

  // Cleanup URL on unmount
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl)
      }
    }
  }, [pdfUrl])

  return (
    <div className="space-y-4">
      {/* Generation Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Generador de PDF
          </CardTitle>
          <CardDescription>
            Genera un documento PDF del formulario médico
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Button 
              onClick={generatePDF} 
              disabled={isGenerating}
              className="flex-1"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileText className="h-4 w-4 mr-2" />
              )}
              {isGenerating ? 'Generando PDF...' : 'Generar PDF'}
            </Button>
          </div>

          {/* Progress */}
          {isGenerating && showProgress && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Progreso</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Error */}
          {error && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success */}
          {success && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                PDF generado exitosamente: {filename}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* PDF Actions */}
      {success && pdfUrl && (
        <Card>
          <CardHeader>
            <CardTitle>Acciones del PDF</CardTitle>
            <CardDescription>
              Descarga, imprime o comparte el documento generado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Button onClick={handleDownload} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Descargar
              </Button>
              
              <Button onClick={handlePrint} variant="outline" size="sm">
                <Printer className="h-4 w-4 mr-2" />
                Imprimir
              </Button>
              
              {navigator.share && (
                <Button onClick={handleShare} variant="outline" size="sm">
                  <Share2 className="h-4 w-4 mr-2" />
                  Compartir
                </Button>
              )}
              
              <Button onClick={handleEmail} variant="outline" size="sm">
                <Mail className="h-4 w-4 mr-2" />
                Email
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* PDF Preview */}
      {showPreview && pdfUrl && (
        <Card>
          <CardHeader>
            <CardTitle>Vista Previa del PDF</CardTitle>
            <CardDescription>
              Previsualiza el documento PDF generado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <iframe
                src={pdfUrl}
                width="100%"
                height="600"
                title="PDF Preview"
                className="border-0"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content Preview */}
      {showPreview && (
        <Card>
          <CardHeader>
            <CardTitle>Contenido a Exportar</CardTitle>
            <CardDescription>
              Vista previa del contenido que se incluirá en el PDF
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div 
              ref={contentRef}
              className="border rounded-lg p-4 bg-white min-h-[400px]"
            >
              {content}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Utility function to generate PDF from HTML content
export const generatePDFFromHTML = async (
  htmlContent: string,
  options: {
    filename: string
    format?: 'A4' | 'Letter'
    orientation?: 'portrait' | 'landscape'
    margin?: string
    displayHeaderFooter?: boolean
    headerTemplate?: string
    footerTemplate?: string
  }
): Promise<Blob> => {
  // This would typically use a library like Puppeteer, jsPDF, or html2pdf
  // For now, we'll return a mock PDF blob
  
  const mockPdfContent = `
    %PDF-1.4
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
    /Length 100
    >>
    stream
    BT
    /F1 12 Tf
    72 720 Td
    (${options.filename}) Tj
    0 -20 Td
    (Generated PDF Content) Tj
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
    353
    %%EOF
  `

  return new Blob([mockPdfContent], { type: 'application/pdf' })
}

// Utility function to generate CSV from form data
export const generateCSVFromData = (
  data: Record<string, any>,
  options: {
    filename: string
    includeHeaders?: boolean
    delimiter?: string
  }
): Blob => {
  const delimiter = options.delimiter || ','
  const includeHeaders = options.includeHeaders !== false
  
  let csvContent = ''
  
  if (includeHeaders) {
    const headers = Object.keys(data)
    csvContent += headers.map(header => `"${header}"`).join(delimiter) + '\n'
  }
  
  const values = Object.values(data).map(value => {
    if (typeof value === 'object') {
      return `"${JSON.stringify(value)}"`
    }
    return `"${String(value).replace(/"/g, '""')}"`
  })
  
  csvContent += values.join(delimiter) + '\n'
  
  return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
}

// Utility function to generate JSON from form data
export const generateJSONFromData = (
  data: Record<string, any>,
  options: {
    filename: string
    pretty?: boolean
  }
): Blob => {
  const jsonContent = options.pretty 
    ? JSON.stringify(data, null, 2)
    : JSON.stringify(data)
  
  return new Blob([jsonContent], { type: 'application/json;charset=utf-8;' })
}
