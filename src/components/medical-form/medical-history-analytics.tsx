'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Users, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  Activity,
  Heart,
  Brain,
  FileText,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react'

interface MedicalHistoryAnalyticsProps {
  data: Array<{
    id: string
    patientInfo: {
      firstName: string
      lastName: string
      dateOfBirth: string
      gender: string
    }
    medicalHistory: {
      birthHistory: any
      developmentalMilestones: any
      medicalConditions: any
      familyHistory: any
    }
    createdAt: string
    completedAt?: string
  }>
  dateRange?: {
    start: Date
    end: Date
  }
  onExport?: () => void
  onRefresh?: () => void
}

export function MedicalHistoryAnalytics({ 
  data, 
  dateRange, 
  onExport, 
  onRefresh 
}: MedicalHistoryAnalyticsProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [filterGender, setFilterGender] = useState<string>('all')
  const [filterAgeGroup, setFilterAgeGroup] = useState<string>('all')

  // Filter data based on selected filters
  const filteredData = useMemo(() => {
    return data.filter(item => {
      // Gender filter
      if (filterGender !== 'all' && item.patientInfo.gender !== filterGender) {
        return false
      }

      // Age group filter
      if (filterAgeGroup !== 'all') {
        const ageInMonths = calculateAgeInMonths(item.patientInfo.dateOfBirth)
        const ageGroup = getAgeGroup(ageInMonths)
        if (ageGroup !== filterAgeGroup) {
          return false
        }
      }

      return true
    })
  }, [data, filterGender, filterAgeGroup])

  // Calculate age in months
  const calculateAgeInMonths = (dateOfBirth: string) => {
    const birthDate = new Date(dateOfBirth)
    const now = new Date()
    return (now.getFullYear() - birthDate.getFullYear()) * 12 + 
           (now.getMonth() - birthDate.getMonth())
  }

  // Get age group
  const getAgeGroup = (ageInMonths: number) => {
    if (ageInMonths < 12) return 'infant'
    if (ageInMonths < 24) return 'toddler'
    if (ageInMonths < 60) return 'preschool'
    if (ageInMonths < 120) return 'school'
    return 'adolescent'
  }

  // Calculate analytics
  const analytics = useMemo(() => {
    const total = filteredData.length
    if (total === 0) return null

    // Gender distribution
    const genderDistribution = filteredData.reduce((acc, item) => {
      acc[item.patientInfo.gender] = (acc[item.patientInfo.gender] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Age group distribution
    const ageGroupDistribution = filteredData.reduce((acc, item) => {
      const ageInMonths = calculateAgeInMonths(item.patientInfo.dateOfBirth)
      const ageGroup = getAgeGroup(ageInMonths)
      acc[ageGroup] = (acc[ageGroup] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Common conditions
    const conditionCounts: Record<string, number> = {}
    const familyHistoryCounts: Record<string, number> = {}
    const birthComplicationCount = filteredData.filter(item => 
      item.medicalHistory.birthHistory?.complications
    ).length

    filteredData.forEach(item => {
      // Current conditions
      item.medicalHistory.medicalConditions?.currentConditions?.forEach((condition: string) => {
        conditionCounts[condition] = (conditionCounts[condition] || 0) + 1
      })

      // Family history
      item.medicalHistory.familyHistory?.mentalHealthConditions?.forEach((condition: string) => {
        familyHistoryCounts[`Mental: ${condition}`] = (familyHistoryCounts[`Mental: ${condition}`] || 0) + 1
      })
      item.medicalHistory.familyHistory?.physicalConditions?.forEach((condition: string) => {
        familyHistoryCounts[`Physical: ${condition}`] = (familyHistoryCounts[`Physical: ${condition}`] || 0) + 1
      })
    })

    // Top conditions
    const topConditions = Object.entries(conditionCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)

    // Top family history
    const topFamilyHistory = Object.entries(familyHistoryCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)

    // Risk assessment
    const highRiskCount = filteredData.filter(item => {
      const hasComplications = item.medicalHistory.birthHistory?.complications
      const hasCurrentConditions = item.medicalHistory.medicalConditions?.currentConditions?.length > 0
      const hasFamilyMentalHealth = item.medicalHistory.familyHistory?.mentalHealthConditions?.length > 0
      const hasHospitalizations = item.medicalHistory.medicalConditions?.hospitalizations?.length > 0
      
      return hasComplications || hasCurrentConditions || hasFamilyMentalHealth || hasHospitalizations
    }).length

    // Completion rate
    const completedCount = filteredData.filter(item => item.completedAt).length
    const completionRate = (completedCount / total) * 100

    return {
      total,
      genderDistribution,
      ageGroupDistribution,
      topConditions,
      topFamilyHistory,
      birthComplicationCount,
      highRiskCount,
      completionRate,
      averageAge: filteredData.reduce((sum, item) => 
        sum + calculateAgeInMonths(item.patientInfo.dateOfBirth), 0
      ) / total
    }
  }, [filteredData])

  const ageGroupLabels: Record<string, string> = {
    infant: '0-12 meses',
    toddler: '1-2 años',
    preschool: '2-5 años',
    school: '5-10 años',
    adolescent: '10+ años'
  }

  const genderLabels: Record<string, string> = {
    MALE: 'Masculino',
    FEMALE: 'Femenino',
    OTHER: 'Otro',
    PREFER_NOT_TO_SAY: 'Prefiere no decir'
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">No hay datos disponibles para mostrar</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Análisis del Historial Médico</h2>
          <p className="text-muted-foreground">
            {analytics.total} formularios médicos analizados
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {onRefresh && (
            <Button onClick={onRefresh} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
          )}
          {onExport && (
            <Button onClick={onExport} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Género</label>
              <Select value={filterGender} onValueChange={setFilterGender}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="MALE">Masculino</SelectItem>
                  <SelectItem value="FEMALE">Femenino</SelectItem>
                  <SelectItem value="OTHER">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Grupo de Edad</label>
              <Select value={filterAgeGroup} onValueChange={setFilterAgeGroup}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="infant">0-12 meses</SelectItem>
                  <SelectItem value="toddler">1-2 años</SelectItem>
                  <SelectItem value="preschool">2-5 años</SelectItem>
                  <SelectItem value="school">5-10 años</SelectItem>
                  <SelectItem value="adolescent">10+ años</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Rango de Fechas</label>
              <div className="text-sm text-muted-foreground">
                {dateRange ? (
                  `${dateRange.start.toLocaleDateString()} - ${dateRange.end.toLocaleDateString()}`
                ) : (
                  'Todos los períodos'
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Total Pacientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.total}</div>
            <p className="text-xs text-muted-foreground">
              Edad promedio: {analytics.averageAge.toFixed(1)} meses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <CheckCircle className="h-4 w-4 mr-2" />
              Tasa de Completitud
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.completionRate.toFixed(1)}%</div>
            <Progress value={analytics.completionRate} className="h-2 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Alto Riesgo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.highRiskCount}</div>
            <p className="text-xs text-muted-foreground">
              {((analytics.highRiskCount / analytics.total) * 100).toFixed(1)}% del total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Heart className="h-4 w-4 mr-2" />
              Complicaciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.birthComplicationCount}</div>
            <p className="text-xs text-muted-foreground">
              Al nacer
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="demographics">Demografía</TabsTrigger>
          <TabsTrigger value="conditions">Condiciones</TabsTrigger>
          <TabsTrigger value="family">Historial Familiar</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gender Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChart className="h-5 w-5 mr-2" />
                  Distribución por Género
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(analytics.genderDistribution).map(([gender, count]) => (
                    <div key={gender} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="text-sm">{genderLabels[gender] || gender}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">{count}</span>
                        <Badge variant="secondary">
                          {((count / analytics.total) * 100).toFixed(1)}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Age Group Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Distribución por Edad
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(analytics.ageGroupDistribution).map(([ageGroup, count]) => (
                    <div key={ageGroup} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">{ageGroupLabels[ageGroup]}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">{count}</span>
                          <Badge variant="outline">
                            {((count / analytics.total) * 100).toFixed(1)}%
                          </Badge>
                        </div>
                      </div>
                      <Progress value={(count / analytics.total) * 100} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="demographics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Risk Assessment */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  Evaluación de Riesgo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Pacientes de Alto Riesgo</span>
                    <Badge variant="destructive">
                      {analytics.highRiskCount}
                    </Badge>
                  </div>
                  <Progress 
                    value={(analytics.highRiskCount / analytics.total) * 100} 
                    className="h-2" 
                  />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Con Complicaciones al Nacer</span>
                    <Badge variant="secondary">
                      {analytics.birthComplicationCount}
                    </Badge>
                  </div>
                  <Progress 
                    value={(analytics.birthComplicationCount / analytics.total) * 100} 
                    className="h-2" 
                  />
                </div>
              </CardContent>
            </Card>

            {/* Completion Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Estado de Completitud
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Formularios Completados</span>
                    <Badge variant="default">
                      {Math.round((analytics.completionRate / 100) * analytics.total)}
                    </Badge>
                  </div>
                  <Progress value={analytics.completionRate} className="h-2" />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Formularios Pendientes</span>
                    <Badge variant="outline">
                      {analytics.total - Math.round((analytics.completionRate / 100) * analytics.total)}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="conditions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Heart className="h-5 w-5 mr-2" />
                Condiciones Médicas Más Comunes
              </CardTitle>
              <CardDescription>
                Top 10 condiciones médicas actuales reportadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.topConditions.length > 0 ? (
                <div className="space-y-3">
                  {analytics.topConditions.map(([condition, count], index) => (
                    <div key={condition} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline">{index + 1}</Badge>
                        <span className="font-medium">{condition}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">{count}</span>
                        <Badge variant="secondary">
                          {((count / analytics.total) * 100).toFixed(1)}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No hay condiciones médicas registradas
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="family" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Brain className="h-5 w-5 mr-2" />
                Historial Familiar Más Común
              </CardTitle>
              <CardDescription>
                Top 10 condiciones en el historial familiar
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.topFamilyHistory.length > 0 ? (
                <div className="space-y-3">
                  {analytics.topFamilyHistory.map(([condition, count], index) => (
                    <div key={condition} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline">{index + 1}</Badge>
                        <span className="font-medium">{condition}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">{count}</span>
                        <Badge variant="secondary">
                          {((count / analytics.total) * 100).toFixed(1)}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No hay historial familiar registrado
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
