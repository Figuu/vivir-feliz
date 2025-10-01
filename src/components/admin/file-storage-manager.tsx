'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  HardDrive, 
  Upload,
  Download,
  Trash2,
  FileText,
  Image,
  File,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Search
} from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from '@/hooks/use-toast'
import { STORAGE_CONFIG, formatFileSize } from '@/lib/file-storage'

interface StorageFile {
  name: string
  id: string
  updated_at: string
  created_at: string
  last_accessed_at: string
  metadata: {
    size: number
    mimetype: string
  }
}

export function FileStorageManager() {
  const [loading, setLoading] = useState(false)
  const [files, setFiles] = useState<StorageFile[]>([])
  const [selectedBucket, setSelectedBucket] = useState('files')
  const [statistics, setStatistics] = useState({
    totalFiles: 0,
    totalSize: 0,
    byType: {} as Record<string, number>
  })

  useEffect(() => {
    loadFiles()
  }, [selectedBucket])

  const loadFiles = async () => {
    try {
      setLoading(true)
      
      const response = await fetch(`/api/admin/files?bucket=${selectedBucket}`)
      
      if (!response.ok) {
        throw new Error('Failed to load files')
      }

      const result = await response.json()
      const filesData = result.files || []
      
      setFiles(filesData)
      
      // Calculate statistics
      const totalSize = filesData.reduce((sum: number, f: StorageFile) => sum + (f.metadata?.size || 0), 0)
      const byType: Record<string, number> = {}
      
      filesData.forEach((f: StorageFile) => {
        const type = f.metadata?.mimetype || 'unknown'
        byType[type] = (byType[type] || 0) + 1
      })
      
      setStatistics({
        totalFiles: filesData.length,
        totalSize,
        byType
      })
    } catch (err) {
      console.error('Error loading files:', err)
      toast.error('Failed to load files')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteFile = async (filePath: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return

    try {
      setLoading(true)

      const response = await fetch(`/api/admin/files?bucket=${selectedBucket}&path=${encodeURIComponent(filePath)}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete file')
      }

      toast.success('File deleted successfully')
      loadFiles()
    } catch (err) {
      console.error('Error deleting file:', err)
      toast.error('Failed to delete file')
    } finally {
      setLoading(false)
    }
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="h-5 w-5 text-blue-500" />
    if (mimeType === 'application/pdf') return <FileText className="h-5 w-5 text-red-500" />
    return <File className="h-5 w-5 text-gray-500" />
  }

  const getFileTypeColor = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return 'bg-blue-100 text-blue-800'
    if (mimeType === 'application/pdf') return 'bg-red-100 text-red-800'
    if (mimeType.includes('word')) return 'bg-blue-100 text-blue-800'
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'bg-green-100 text-green-800'
    return 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <HardDrive className="h-5 w-5 mr-2" />
              File Storage & Document Management
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadFiles}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Storage Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Files</p>
                <p className="text-3xl font-bold">{statistics.totalFiles}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Size</p>
                <p className="text-3xl font-bold">{formatFileSize(statistics.totalSize)}</p>
              </div>
              <HardDrive className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-muted-foreground mb-2">File Types</p>
              <div className="space-y-1">
                {Object.entries(statistics.byType).slice(0, 3).map(([type, count]) => (
                  <div key={type} className="flex justify-between text-sm">
                    <span className="truncate">{type.split('/').pop()}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configuration Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Storage Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">Document Limits</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Max Size</span>
                  <span className="font-medium">{formatFileSize(STORAGE_CONFIG.limits.document.maxSize)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Allowed Types</span>
                  <span className="font-medium">{STORAGE_CONFIG.limits.document.allowedTypes.length} types</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Available Buckets</h4>
              <div className="space-y-2">
                {Object.entries(STORAGE_CONFIG.buckets).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground capitalize">{key}</span>
                    <Badge variant="outline">{value}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bucket Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium">Select Bucket:</label>
            <select
              value={selectedBucket}
              onChange={(e) => setSelectedBucket(e.target.value)}
              className="border rounded-md px-3 py-2"
            >
              {Object.entries(STORAGE_CONFIG.buckets).map(([key, value]) => (
                <option key={value} value={value}>{key} ({value})</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Files List */}
      {loading ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading files...</p>
          </CardContent>
        </Card>
      ) : files.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <HardDrive className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Files</h3>
            <p className="text-muted-foreground">No files found in this bucket</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Files in {selectedBucket} bucket</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {files.map((file, index) => (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className="flex items-center justify-between p-3 border rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    {getFileIcon(file.metadata?.mimetype || 'unknown')}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{file.name}</p>
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        <Badge className={getFileTypeColor(file.metadata?.mimetype || '')} variant="outline">
                          {file.metadata?.mimetype?.split('/').pop() || 'unknown'}
                        </Badge>
                        <span>{formatFileSize(file.metadata?.size || 0)}</span>
                        <span>{new Date(file.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteFile(file.name)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Storage Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Storage Guidelines</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Files are stored in private buckets with Row Level Security (RLS) enabled</span>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Access is controlled through signed URLs with configurable expiry times</span>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Files are organized by user ID for better access control</span>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Super admins can access all files across all buckets</span>
            </div>
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
              <span>Regular users can only access their own files</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
