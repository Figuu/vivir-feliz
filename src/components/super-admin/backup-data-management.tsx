'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Database, 
  Download,
  Upload,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  HardDrive,
  RefreshCw,
  Calendar
} from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from '@/hooks/use-toast'

interface Backup {
  id: string
  backupType: string
  description: string | null
  status: string
  fileSize: number | null
  filePath: string | null
  triggeredBy: string
  createdAt: string
  completedAt: string | null
}

interface Statistics {
  totalCount: number
  totalSize: number
  successfulBackups: number
  failedBackups: number
  lastBackup: {
    id: string
    type: string
    status: string
    createdAt: string
  } | null
}

export function BackupDataManagement() {
  const [loading, setLoading] = useState(false)
  const [backups, setBackups] = useState<Backup[]>([])
  const [statistics, setStatistics] = useState<Statistics | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false)
  const [selectedBackup, setSelectedBackup] = useState<Backup | null>(null)
  const [activeTab, setActiveTab] = useState('backups')
  
  const [backupForm, setBackupForm] = useState({
    backupType: 'full',
    description: ''
  })

  const [restoreForm, setRestoreForm] = useState({
    restoreType: 'full',
    createBackupBeforeRestore: true
  })

  useEffect(() => {
    loadBackups()
  }, [])

  const loadBackups = async () => {
    try {
      setLoading(true)
      
      const response = await fetch('/api/super-admin/backup-management?limit=50')
      
      if (!response.ok) {
        throw new Error('Failed to load backups')
      }

      const result = await response.json()
      setBackups(result.data.backups)
      setStatistics(result.data.statistics)
    } catch (err) {
      console.error('Error loading backups:', err)
      toast({
        variant: "destructive",
        title: "Error",
        description: 'Failed to load backups'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateBackup = async () => {
    try {
      setLoading(true)

      const response = await fetch('/api/super-admin/backup-management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...backupForm,
          triggeredBy: 'super-admin-1' // Should come from auth context
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create backup')
      }

      toast({
        title: "Success",
        description: 'Backup process initiated'
      })
      setCreateDialogOpen(false)
      setBackupForm({
        backupType: 'full',
        description: ''
      })
      
      // Reload backups after a short delay to see the new backup
      setTimeout(() => loadBackups(), 2000)
    } catch (err: any) {
      console.error('Error creating backup:', err)
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || 'Failed to create backup'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRestoreBackup = async () => {
    if (!selectedBackup) return

    try {
      setLoading(true)

      const response = await fetch('/api/super-admin/backup-management', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          backupId: selectedBackup.id,
          ...restoreForm,
          restoredBy: 'super-admin-1'
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to restore backup')
      }

      toast({
        title: "Success",
        description: 'Restore process initiated'
      })
      setRestoreDialogOpen(false)
      setRestoreForm({
        restoreType: 'full',
        createBackupBeforeRestore: true
      })
      
      setTimeout(() => loadBackups(), 2000)
    } catch (err: any) {
      console.error('Error restoring backup:', err)
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || 'Failed to restore backup'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteBackup = async (backupId: string) => {
    if (!confirm('Are you sure you want to delete this backup? This action cannot be undone.')) {
      return
    }

    try {
      setLoading(true)

      const response = await fetch(
        `/api/super-admin/backup-management?backupId=${backupId}&deletedBy=super-admin-1`,
        { method: 'DELETE' }
      )

      if (!response.ok) {
        throw new Error('Failed to delete backup')
      }

      toast({
        title: "Success",
        description: 'Backup deleted successfully'
      })
      loadBackups()
    } catch (err) {
      console.error('Error deleting backup:', err)
      toast({
        variant: "destructive",
        title: "Error",
        description: 'Failed to delete backup'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadBackup = (backup: Backup) => {
    if (!backup.filePath) {
      toast({
        variant: "destructive",
        title: "Error",
        description: 'Backup file not available'
      })
      return
    }

    toast({
        title: "Info",
        description: 'Backup download would be implemented here'
      })
    // In real app, this would download the actual backup file
  }

  const openRestoreDialog = (backup: Backup) => {
    setSelectedBackup(backup)
    setRestoreDialogOpen(true)
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'failed': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return <CheckCircle className="h-4 w-4" />
      case 'in_progress': return <Clock className="h-4 w-4" />
      case 'failed': return <XCircle className="h-4 w-4" />
      default: return <AlertCircle className="h-4 w-4" />
    }
  }

  const formatBytes = (bytes: number | null) => {
    if (!bytes) return 'N/A'
    const gb = bytes / (1024 * 1024 * 1024)
    const mb = bytes / (1024 * 1024)
    
    if (gb >= 1) return `${gb.toFixed(2)} GB`
    return `${mb.toFixed(2)} MB`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Database className="h-5 w-5 mr-2" />
              Backup & Data Management
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={loadBackups}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
                <Download className="h-4 w-4 mr-2" />
                Create Backup
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Statistics */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Backups</p>
                  <p className="text-3xl font-bold">{statistics.totalCount}</p>
                </div>
                <Database className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Successful</p>
                  <p className="text-3xl font-bold text-green-600">{statistics.successfulBackups}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Failed</p>
                  <p className="text-3xl font-bold text-red-600">{statistics.failedBackups}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Size</p>
                  <p className="text-3xl font-bold">{formatBytes(statistics.totalSize)}</p>
                </div>
                <HardDrive className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Last Backup Info */}
      {statistics?.lastBackup && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <p>
              <strong>Last Backup:</strong> {statistics.lastBackup.type} backup on{' '}
              {new Date(statistics.lastBackup.createdAt).toLocaleString()} - Status: {statistics.lastBackup.status}
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* Backups List */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-1">
          <TabsTrigger value="backups">Backups ({backups.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="backups" className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-2">Loading backups...</p>
              </CardContent>
            </Card>
          ) : backups.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Database className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Backups</h3>
                <p className="text-muted-foreground mb-4">No backups have been created yet</p>
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Download className="h-4 w-4 mr-2" />
                  Create First Backup
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {backups.map((backup, index) => (
                <motion.div
                  key={backup.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="capitalize">
                              {backup.backupType}
                            </Badge>
                            <Badge className={getStatusColor(backup.status)}>
                              {getStatusIcon(backup.status)}
                              <span className="ml-1">{backup.status}</span>
                            </Badge>
                          </div>

                          {backup.description && (
                            <p className="text-sm text-muted-foreground">{backup.description}</p>
                          )}

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground mb-1">Created</p>
                              <p className="font-medium">{new Date(backup.createdAt).toLocaleDateString()}</p>
                              <p className="text-xs text-muted-foreground">{new Date(backup.createdAt).toLocaleTimeString()}</p>
                            </div>
                            {backup.completedAt && (
                              <div>
                                <p className="text-muted-foreground mb-1">Completed</p>
                                <p className="font-medium">{new Date(backup.completedAt).toLocaleDateString()}</p>
                                <p className="text-xs text-muted-foreground">{new Date(backup.completedAt).toLocaleTimeString()}</p>
                              </div>
                            )}
                            <div>
                              <p className="text-muted-foreground mb-1">Size</p>
                              <p className="font-medium">{formatBytes(backup.fileSize)}</p>
                            </div>
                            {backup.filePath && (
                              <div>
                                <p className="text-muted-foreground mb-1">File Path</p>
                                <p className="font-mono text-xs truncate">{backup.filePath}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 ml-4">
                          {backup.status === 'completed' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDownloadBackup(backup)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openRestoreDialog(backup)}
                              >
                                <Upload className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteBackup(backup.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Backup Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create System Backup</DialogTitle>
            <DialogDescription>
              Create a backup of system data
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="backupType">Backup Type</Label>
              <select
                id="backupType"
                value={backupForm.backupType}
                onChange={(e) => setBackupForm({ ...backupForm, backupType: e.target.value })}
                className="w-full border rounded-md px-3 py-2"
              >
                <option value="full">Full Backup (All Data)</option>
                <option value="incremental">Incremental (Changes Only)</option>
                <option value="database">Database Only</option>
                <option value="files">Files Only</option>
                <option value="custom">Custom Selection</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={backupForm.description}
                onChange={(e) => setBackupForm({ ...backupForm, description: e.target.value })}
                placeholder="Add notes about this backup..."
                rows={3}
                maxLength={500}
              />
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                The backup process will run in the background. You'll be notified when it completes.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateBackup} disabled={loading}>
              Create Backup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restore Backup Dialog */}
      <Dialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restore from Backup</DialogTitle>
            <DialogDescription>
              Restore system data from backup
            </DialogDescription>
          </DialogHeader>
          
          {selectedBackup && (
            <div className="space-y-4 py-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-semibold mb-2">Warning: This will restore data from backup</p>
                  <p className="text-sm">
                    Backup: {selectedBackup.backupType} - {new Date(selectedBackup.createdAt).toLocaleString()}
                  </p>
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="restoreType">Restore Type</Label>
                <select
                  id="restoreType"
                  value={restoreForm.restoreType}
                  onChange={(e) => setRestoreForm({ ...restoreForm, restoreType: e.target.value as any })}
                  className="w-full border rounded-md px-3 py-2"
                >
                  <option value="full">Full Restore (All Data)</option>
                  <option value="selective">Selective Restore</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="createBackupBeforeRestore"
                  checked={restoreForm.createBackupBeforeRestore}
                  onChange={(e) => setRestoreForm({ ...restoreForm, createBackupBeforeRestore: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="createBackupBeforeRestore" className="cursor-pointer">
                  Create backup before restore (recommended)
                </Label>
              </div>

              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  {restoreForm.createBackupBeforeRestore 
                    ? 'A backup of current data will be created before restoring.'
                    : 'Current data will not be backed up before restore.'}
                </AlertDescription>
              </Alert>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setRestoreDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRestoreBackup} disabled={loading} variant="destructive">
              Restore Backup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
