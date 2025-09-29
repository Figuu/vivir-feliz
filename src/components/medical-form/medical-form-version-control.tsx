'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  GitBranch, 
  History, 
  RotateCcw, 
  GitCompare, 
  Download, 
  Upload,
  CheckCircle,
  AlertTriangle,
  Info,
  Clock,
  User,
  Calendar,
  FileText,
  Eye,
  Edit,
  Trash2,
  Copy,
  Tag,
  GitCommit,
  ArrowLeft,
  ArrowRight,
  Diff,
  Save,
  Plus
} from 'lucide-react'

interface User {
  id: string
  name: string
  email: string
  role: 'THERAPIST' | 'COORDINATOR' | 'ADMIN'
  avatar?: string
}

interface FormVersion {
  id: string
  version: string
  title: string
  description?: string
  formData: any
  changes: FormChange[]
  createdBy: User
  createdAt: string
  isCurrent: boolean
  isDraft: boolean
  tags: string[]
  parentVersionId?: string
  branchName?: string
}

interface FormChange {
  id: string
  type: 'ADD' | 'MODIFY' | 'DELETE' | 'MOVE'
  sectionId: string
  fieldId?: string
  fieldName?: string
  oldValue?: any
  newValue?: any
  description: string
  timestamp: string
}

interface FormBranch {
  id: string
  name: string
  description?: string
  baseVersionId: string
  currentVersionId: string
  createdBy: User
  createdAt: string
  isActive: boolean
  isMerged: boolean
  mergedAt?: string
  mergedBy?: User
}

interface MedicalFormVersionControlProps {
  formId: string
  formTitle: string
  currentVersion: FormVersion
  versions: FormVersion[]
  branches: FormBranch[]
  currentUser: User
  onCreateVersion?: (version: Omit<FormVersion, 'id' | 'createdAt'>) => void
  onRestoreVersion?: (versionId: string) => void
  onCreateBranch?: (branch: Omit<FormBranch, 'id' | 'createdAt'>) => void
  onMergeBranch?: (branchId: string, targetVersionId: string) => void
  onCompareVersions?: (version1Id: string, version2Id: string) => void
  onDeleteVersion?: (versionId: string) => void
  onTagVersion?: (versionId: string, tag: string) => void
}

export function MedicalFormVersionControl({
  formId,
  formTitle,
  currentVersion,
  versions,
  branches,
  currentUser,
  onCreateVersion,
  onRestoreVersion,
  onCreateBranch,
  onMergeBranch,
  onCompareVersions,
  onDeleteVersion,
  onTagVersion
}: MedicalFormVersionControlProps) {
  const [activeTab, setActiveTab] = useState<'history' | 'branches' | 'compare'>('history')
  const [showCreateVersion, setShowCreateVersion] = useState(false)
  const [showCreateBranch, setShowCreateBranch] = useState(false)
  const [showCompare, setShowCompare] = useState(false)
  const [selectedVersions, setSelectedVersions] = useState<{ v1?: string; v2?: string }>({})
  const [compareResult, setCompareResult] = useState<any>(null)
  
  // Create version form state
  const [newVersionTitle, setNewVersionTitle] = useState('')
  const [newVersionDescription, setNewVersionDescription] = useState('')
  const [newVersionTags, setNewVersionTags] = useState('')
  
  // Create branch form state
  const [newBranchName, setNewBranchName] = useState('')
  const [newBranchDescription, setNewBranchDescription] = useState('')
  const [newBranchBaseVersion, setNewBranchBaseVersion] = useState('')

  // Get change type color
  const getChangeTypeColor = (type: string) => {
    switch (type) {
      case 'ADD': return 'bg-green-100 text-green-800'
      case 'MODIFY': return 'bg-blue-100 text-blue-800'
      case 'DELETE': return 'bg-red-100 text-red-800'
      case 'MOVE': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Get change type icon
  const getChangeTypeIcon = (type: string) => {
    switch (type) {
      case 'ADD': return <Plus className="h-4 w-4" />
      case 'MODIFY': return <Edit className="h-4 w-4" />
      case 'DELETE': return <Trash2 className="h-4 w-4" />
      case 'MOVE': return <ArrowRight className="h-4 w-4" />
      default: return <Edit className="h-4 w-4" />
    }
  }

  // Create new version
  const handleCreateVersion = () => {
    if (!newVersionTitle) return

    const newVersion: Omit<FormVersion, 'id' | 'createdAt'> = {
      version: `v${versions.length + 1}.0.0`,
      title: newVersionTitle,
      description: newVersionDescription,
      formData: currentVersion.formData,
      changes: [],
      createdBy: currentUser,
      isCurrent: false,
      isDraft: false,
      tags: newVersionTags.split(',').map(tag => tag.trim()).filter(Boolean),
      parentVersionId: currentVersion.id
    }

    if (onCreateVersion) {
      onCreateVersion(newVersion)
    }

    // Reset form
    setNewVersionTitle('')
    setNewVersionDescription('')
    setNewVersionTags('')
    setShowCreateVersion(false)
  }

  // Create new branch
  const handleCreateBranch = () => {
    if (!newBranchName || !newBranchBaseVersion) return

    const newBranch: Omit<FormBranch, 'id' | 'createdAt'> = {
      name: newBranchName,
      description: newBranchDescription,
      baseVersionId: newBranchBaseVersion,
      currentVersionId: newBranchBaseVersion,
      createdBy: currentUser,
      isActive: true,
      isMerged: false
    }

    if (onCreateBranch) {
      onCreateBranch(newBranch)
    }

    // Reset form
    setNewBranchName('')
    setNewBranchDescription('')
    setNewBranchBaseVersion('')
    setShowCreateBranch(false)
  }

  // Restore version
  const handleRestoreVersion = (versionId: string) => {
    if (onRestoreVersion) {
      onRestoreVersion(versionId)
    }
  }

  // Compare versions
  const handleCompareVersions = () => {
    if (!selectedVersions.v1 || !selectedVersions.v2) return

    if (onCompareVersions) {
      onCompareVersions(selectedVersions.v1, selectedVersions.v2)
    }

    // Mock compare result for demonstration
    setCompareResult({
      added: [
        { field: 'Nuevo campo de alergias', value: 'Ninguna alergia conocida' }
      ],
      modified: [
        { field: 'Fecha de nacimiento', oldValue: '2020-03-15', newValue: '2020-03-16' }
      ],
      deleted: [
        { field: 'Campo obsoleto de medicamentos' }
      ]
    })
  }

  // Delete version
  const handleDeleteVersion = (versionId: string) => {
    if (onDeleteVersion) {
      onDeleteVersion(versionId)
    }
  }

  // Tag version
  const handleTagVersion = (versionId: string, tag: string) => {
    if (onTagVersion) {
      onTagVersion(versionId, tag)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Control de Versiones</h2>
          <p className="text-muted-foreground">{formTitle}</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={() => setShowCreateVersion(true)}>
            <GitCommit className="h-4 w-4 mr-2" />
            Nueva Versión
          </Button>
          <Button onClick={() => setShowCreateBranch(true)} variant="outline">
            <GitBranch className="h-4 w-4 mr-2" />
            Nueva Rama
          </Button>
        </div>
      </div>

      {/* Current Version Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Tag className="h-5 w-5 mr-2" />
            Versión Actual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <h3 className="font-medium">{currentVersion.title}</h3>
                <p className="text-sm text-muted-foreground">
                  Versión {currentVersion.version} • {new Date(currentVersion.createdAt).toLocaleDateString()}
                </p>
                {currentVersion.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {currentVersion.description}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="default">Actual</Badge>
              {currentVersion.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <History className="h-4 w-4 mr-2" />
              Total Versiones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{versions.length}</div>
            <p className="text-xs text-muted-foreground">Versiones creadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <GitBranch className="h-4 w-4 mr-2" />
              Ramas Activas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{branches.filter(b => b.isActive && !b.isMerged).length}</div>
            <p className="text-xs text-muted-foreground">En desarrollo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              Cambios Totales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {versions.reduce((sum, v) => sum + v.changes.length, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Modificaciones</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <CheckCircle className="h-4 w-4 mr-2" />
              Versiones Estables
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {versions.filter(v => v.tags.includes('stable')).length}
            </div>
            <p className="text-xs text-muted-foreground">Etiquetadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="history">Historial</TabsTrigger>
          <TabsTrigger value="branches">Ramas</TabsTrigger>
          <TabsTrigger value="compare">Comparar</TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Versiones</CardTitle>
              <CardDescription>
                Todas las versiones del formulario con sus cambios y metadatos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {versions.map((version) => (
                  <div key={version.id} className={`p-4 border rounded-lg ${version.isCurrent ? 'bg-blue-50 border-blue-200' : ''}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <Avatar>
                          <AvatarImage src={version.createdBy.avatar} />
                          <AvatarFallback>
                            {version.createdBy.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium">{version.title}</h3>
                            {version.isCurrent && (
                              <Badge variant="default">Actual</Badge>
                            )}
                            {version.isDraft && (
                              <Badge variant="secondary">Borrador</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Versión {version.version} • {version.createdBy.name} • {new Date(version.createdAt).toLocaleDateString()}
                          </p>
                          {version.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {version.description}
                            </p>
                          )}
                          
                          {/* Tags */}
                          {version.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {version.tags.map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                          
                          {/* Changes */}
                          {version.changes.length > 0 && (
                            <div className="mt-3">
                              <p className="text-sm font-medium mb-2">Cambios ({version.changes.length})</p>
                              <div className="space-y-1">
                                {version.changes.slice(0, 3).map((change) => (
                                  <div key={change.id} className="flex items-center space-x-2 text-sm">
                                    <Badge className={getChangeTypeColor(change.type)}>
                                      {getChangeTypeIcon(change.type)}
                                      <span className="ml-1">{change.type}</span>
                                    </Badge>
                                    <span>{change.description}</span>
                                  </div>
                                ))}
                                {version.changes.length > 3 && (
                                  <p className="text-xs text-muted-foreground">
                                    +{version.changes.length - 3} cambios más
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedVersions({ v1: version.id, v2: currentVersion.id })}
                        >
                          <GitCompare className="h-4 w-4" />
                        </Button>
                        {!version.isCurrent && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRestoreVersion(version.id)}
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTagVersion(version.id, 'stable')}
                        >
                          <Tag className="h-4 w-4" />
                        </Button>
                        {!version.isCurrent && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteVersion(version.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branches" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ramas de Desarrollo</CardTitle>
              <CardDescription>
                Ramas para desarrollo paralelo y experimentación
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {branches.map((branch) => (
                  <div key={branch.id} className={`p-4 border rounded-lg ${branch.isActive ? 'bg-green-50 border-green-200' : ''}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                          <GitBranch className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium">{branch.name}</h3>
                            {branch.isActive && (
                              <Badge variant="default">Activa</Badge>
                            )}
                            {branch.isMerged && (
                              <Badge variant="secondary">Fusionada</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Creada por {branch.createdBy.name} • {new Date(branch.createdAt).toLocaleDateString()}
                          </p>
                          {branch.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {branch.description}
                            </p>
                          )}
                          {branch.mergedAt && (
                            <p className="text-sm text-muted-foreground">
                              Fusionada el {new Date(branch.mergedAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {branch.isActive && !branch.isMerged && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onMergeBranch?.(branch.id, currentVersion.id)}
                          >
                            <GitBranch className="h-4 w-4 mr-2" />
                            Fusionar
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedVersions({ v1: branch.baseVersionId, v2: branch.currentVersionId })}
                        >
                          <GitCompare className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compare" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Comparar Versiones</CardTitle>
              <CardDescription>
                Compara diferentes versiones para ver los cambios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="version1">Versión 1</Label>
                    <Select value={selectedVersions.v1} onValueChange={(value) => setSelectedVersions(prev => ({ ...prev, v1: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar versión" />
                      </SelectTrigger>
                      <SelectContent>
                        {versions.map((version) => (
                          <SelectItem key={version.id} value={version.id}>
                            {version.title} (v{version.version})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="version2">Versión 2</Label>
                    <Select value={selectedVersions.v2} onValueChange={(value) => setSelectedVersions(prev => ({ ...prev, v2: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar versión" />
                      </SelectTrigger>
                      <SelectContent>
                        {versions.map((version) => (
                          <SelectItem key={version.id} value={version.id}>
                            {version.title} (v{version.version})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Button 
                  onClick={handleCompareVersions} 
                  disabled={!selectedVersions.v1 || !selectedVersions.v2}
                  className="w-full"
                >
                  <GitCompare className="h-4 w-4 mr-2" />
                  Comparar Versiones
                </Button>
                
                {/* Compare Results */}
                {compareResult && (
                  <div className="space-y-4">
                    <h3 className="font-medium">Resultados de la Comparación</h3>
                    
                    {compareResult.added && compareResult.added.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-green-600 mb-2">Agregados</h4>
                        <div className="space-y-1">
                          {compareResult.added.map((item: any, index: number) => (
                            <div key={index} className="p-2 bg-green-50 border border-green-200 rounded text-sm">
                              <span className="font-medium">{item.field}:</span> {item.value}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {compareResult.modified && compareResult.modified.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-blue-600 mb-2">Modificados</h4>
                        <div className="space-y-1">
                          {compareResult.modified.map((item: any, index: number) => (
                            <div key={index} className="p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                              <span className="font-medium">{item.field}:</span> 
                              <span className="text-red-600 line-through ml-2">{item.oldValue}</span>
                              <span className="text-green-600 ml-2">{item.newValue}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {compareResult.deleted && compareResult.deleted.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-red-600 mb-2">Eliminados</h4>
                        <div className="space-y-1">
                          {compareResult.deleted.map((item: any, index: number) => (
                            <div key={index} className="p-2 bg-red-50 border border-red-200 rounded text-sm">
                              <span className="font-medium">{item.field}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Version Dialog */}
      {showCreateVersion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Crear Nueva Versión</CardTitle>
              <CardDescription>
                Crea una nueva versión del formulario con los cambios actuales
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="version-title">Título de la Versión</Label>
                <Input
                  id="version-title"
                  placeholder="Ej: Versión con nuevas validaciones"
                  value={newVersionTitle}
                  onChange={(e) => setNewVersionTitle(e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="version-description">Descripción</Label>
                <Textarea
                  id="version-description"
                  placeholder="Describe los cambios principales..."
                  value={newVersionDescription}
                  onChange={(e) => setNewVersionDescription(e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="version-tags">Etiquetas (separadas por comas)</Label>
                <Input
                  id="version-tags"
                  placeholder="stable, release, v2.0"
                  value={newVersionTags}
                  onChange={(e) => setNewVersionTags(e.target.value)}
                />
              </div>
              
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => setShowCreateVersion(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button onClick={handleCreateVersion} className="flex-1">
                  <GitCommit className="h-4 w-4 mr-2" />
                  Crear Versión
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create Branch Dialog */}
      {showCreateBranch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Crear Nueva Rama</CardTitle>
              <CardDescription>
                Crea una nueva rama para desarrollo paralelo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="branch-name">Nombre de la Rama</Label>
                <Input
                  id="branch-name"
                  placeholder="feature/nueva-funcionalidad"
                  value={newBranchName}
                  onChange={(e) => setNewBranchName(e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="branch-description">Descripción</Label>
                <Textarea
                  id="branch-description"
                  placeholder="Describe el propósito de esta rama..."
                  value={newBranchDescription}
                  onChange={(e) => setNewBranchDescription(e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="branch-base">Versión Base</Label>
                <Select value={newBranchBaseVersion} onValueChange={setNewBranchBaseVersion}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar versión base" />
                  </SelectTrigger>
                  <SelectContent>
                    {versions.map((version) => (
                      <SelectItem key={version.id} value={version.id}>
                        {version.title} (v{version.version})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => setShowCreateBranch(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button onClick={handleCreateBranch} className="flex-1">
                  <GitBranch className="h-4 w-4 mr-2" />
                  Crear Rama
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
