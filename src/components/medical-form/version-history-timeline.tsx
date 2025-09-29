'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  GitCommit, 
  GitBranch, 
  RotateCcw, 
  Eye, 
  Download, 
  Tag,
  CheckCircle,
  AlertTriangle,
  Clock,
  User,
  Calendar,
  ArrowRight,
  Plus,
  Edit,
  Trash2,
  Move
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

interface VersionHistoryTimelineProps {
  versions: FormVersion[]
  onVersionSelect?: (version: FormVersion) => void
  onVersionRestore?: (versionId: string) => void
  onVersionCompare?: (version1Id: string, version2Id: string) => void
  onVersionDownload?: (versionId: string) => void
  onVersionTag?: (versionId: string, tag: string) => void
  selectedVersionId?: string
  showChanges?: boolean
  maxChanges?: number
}

export function VersionHistoryTimeline({
  versions,
  onVersionSelect,
  onVersionRestore,
  onVersionCompare,
  onVersionDownload,
  onVersionTag,
  selectedVersionId,
  showChanges = true,
  maxChanges = 5
}: VersionHistoryTimelineProps) {
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(new Set())

  // Sort versions by creation date (newest first)
  const sortedVersions = [...versions].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  // Toggle version expansion
  const toggleVersionExpansion = (versionId: string) => {
    const newExpanded = new Set(expandedVersions)
    if (newExpanded.has(versionId)) {
      newExpanded.delete(versionId)
    } else {
      newExpanded.add(versionId)
    }
    setExpandedVersions(newExpanded)
  }

  // Get change type color
  const getChangeTypeColor = (type: string) => {
    switch (type) {
      case 'ADD': return 'bg-green-100 text-green-800 border-green-200'
      case 'MODIFY': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'DELETE': return 'bg-red-100 text-red-800 border-red-200'
      case 'MOVE': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  // Get change type icon
  const getChangeTypeIcon = (type: string) => {
    switch (type) {
      case 'ADD': return <Plus className="h-3 w-3" />
      case 'MODIFY': return <Edit className="h-3 w-3" />
      case 'DELETE': return <Trash2 className="h-3 w-3" />
      case 'MOVE': return <Move className="h-3 w-3" />
      default: return <Edit className="h-3 w-3" />
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  }

  // Get version status
  const getVersionStatus = (version: FormVersion) => {
    if (version.isCurrent) return { label: 'Actual', color: 'bg-blue-100 text-blue-800' }
    if (version.isDraft) return { label: 'Borrador', color: 'bg-yellow-100 text-yellow-800' }
    if (version.tags.includes('stable')) return { label: 'Estable', color: 'bg-green-100 text-green-800' }
    return { label: 'Histórica', color: 'bg-gray-100 text-gray-800' }
  }

  return (
    <div className="space-y-4">
      {sortedVersions.map((version, index) => {
        const isExpanded = expandedVersions.has(version.id)
        const isSelected = selectedVersionId === version.id
        const status = getVersionStatus(version)
        const { date, time } = formatDate(version.createdAt)
        const isLast = index === sortedVersions.length - 1

        return (
          <div key={version.id} className="relative">
            {/* Timeline Line */}
            {!isLast && (
              <div className="absolute left-6 top-12 w-0.5 h-full bg-gray-200"></div>
            )}

            {/* Version Card */}
            <Card className={`transition-all hover:shadow-md ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-start space-x-4">
                  {/* Timeline Icon */}
                  <div className="relative">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      version.isCurrent ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {version.branchName ? (
                        <GitBranch className="h-6 w-6" />
                      ) : (
                        <GitCommit className="h-6 w-6" />
                      )}
                    </div>
                    {version.isCurrent && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Version Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-medium text-lg">{version.title}</h3>
                          <Badge className={status.color}>
                            {status.label}
                          </Badge>
                          {version.branchName && (
                            <Badge variant="outline">
                              <GitBranch className="h-3 w-3 mr-1" />
                              {version.branchName}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-2">
                          <span className="flex items-center">
                            <Tag className="h-4 w-4 mr-1" />
                            v{version.version}
                          </span>
                          <span className="flex items-center">
                            <User className="h-4 w-4 mr-1" />
                            {version.createdBy.name}
                          </span>
                          <span className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {date}
                          </span>
                          <span className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {time}
                          </span>
                        </div>

                        {version.description && (
                          <p className="text-sm text-muted-foreground mb-3">
                            {version.description}
                          </p>
                        )}

                        {/* Tags */}
                        {version.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {version.tags.map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {/* Changes Summary */}
                        {version.changes.length > 0 && (
                          <div className="mb-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleVersionExpansion(version.id)}
                              className="h-auto p-0 text-sm"
                            >
                              {isExpanded ? 'Ocultar' : 'Mostrar'} {version.changes.length} cambios
                              <ArrowRight className={`h-4 w-4 ml-1 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                            </Button>
                          </div>
                        )}

                        {/* Expanded Changes */}
                        {isExpanded && version.changes.length > 0 && (
                          <div className="space-y-2 mt-3 p-3 bg-gray-50 rounded-lg">
                            <h4 className="text-sm font-medium">Cambios Detallados</h4>
                            <div className="space-y-2">
                              {version.changes.slice(0, maxChanges).map((change) => (
                                <div key={change.id} className="flex items-center space-x-2 text-sm">
                                  <Badge className={getChangeTypeColor(change.type)}>
                                    {getChangeTypeIcon(change.type)}
                                    <span className="ml-1">{change.type}</span>
                                  </Badge>
                                  <span className="text-muted-foreground">{change.description}</span>
                                </div>
                              ))}
                              {version.changes.length > maxChanges && (
                                <p className="text-xs text-muted-foreground">
                                  +{version.changes.length - maxChanges} cambios más
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-1 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onVersionSelect?.(version)}
                          title="Ver versión"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        {onVersionCompare && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onVersionCompare(version.id, sortedVersions[0].id)}
                            title="Comparar con actual"
                          >
                            <GitCommit className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {onVersionDownload && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onVersionDownload(version.id)}
                            title="Descargar versión"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {!version.isCurrent && onVersionRestore && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onVersionRestore(version.id)}
                            title="Restaurar versión"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {onVersionTag && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onVersionTag(version.id, 'stable')}
                            title="Etiquetar como estable"
                          >
                            <Tag className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )
      })}

      {/* Empty State */}
      {versions.length === 0 && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <GitCommit className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No hay versiones</h3>
              <p className="text-muted-foreground">
                Crea la primera versión del formulario para comenzar el historial
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
