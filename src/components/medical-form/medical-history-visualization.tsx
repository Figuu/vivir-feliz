'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Calendar, 
  Clock, 
  Heart, 
  Brain, 
  Activity, 
  Users, 
  FileText, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Info,
  Eye,
  Download,
  BarChart3,
  PieChart,
  LineChart
} from 'lucide-react'

interface MedicalHistoryData {
  birthHistory: {
    gestationalAge?: number
    birthWeight?: number
    birthLength?: number
    deliveryMethod?: string
    complications?: string
    apgarScore?: {
      oneMinute?: number
      fiveMinute?: number
    }
  }
  developmentalMilestones: {
    firstSmile?: string
    firstSit?: string
    firstCrawl?: string
    firstWalk?: string
    firstWords?: string
    toiletTraining?: string
    concerns?: string
  }
  medicalConditions: {
    currentConditions?: string[]
    pastConditions?: string[]
    hospitalizations?: Array<{
      date: string
      reason: string
      duration?: string
      hospital?: string
    }>
    surgeries?: Array<{
      date: string
      procedure: string
      surgeon?: string
      hospital?: string
    }>
  }
  familyHistory: {
    mentalHealthConditions?: string[]
    physicalConditions?: string[]
    geneticConditions?: string[]
    substanceAbuse?: string[]
    other?: string
  }
}

interface MedicalHistoryVisualizationProps {
  data: MedicalHistoryData
  patientInfo?: {
    firstName: string
    lastName: string
    dateOfBirth: string
    gender: string
  }
  showExport?: boolean
  onExport?: () => void
}

export function MedicalHistoryVisualization({ 
  data, 
  patientInfo, 
  showExport = true, 
  onExport 
}: MedicalHistoryVisualizationProps) {
  const [activeTab, setActiveTab] = useState('overview')

  // Calculate age in months
  const ageInMonths = useMemo(() => {
    if (!patientInfo?.dateOfBirth) return 0
    const birthDate = new Date(patientInfo.dateOfBirth)
    const now = new Date()
    const diffInMonths = (now.getFullYear() - birthDate.getFullYear()) * 12 + 
                        (now.getMonth() - birthDate.getMonth())
    return Math.max(0, diffInMonths)
  }, [patientInfo?.dateOfBirth])

  // Calculate developmental progress
  const developmentalProgress = useMemo(() => {
    const milestones = data.developmentalMilestones
    const completedMilestones = [
      milestones.firstSmile,
      milestones.firstSit,
      milestones.firstCrawl,
      milestones.firstWalk,
      milestones.firstWords,
      milestones.toiletTraining
    ].filter(Boolean).length

    return {
      completed: completedMilestones,
      total: 6,
      percentage: (completedMilestones / 6) * 100
    }
  }, [data.developmentalMilestones])

  // Calculate health risk score
  const healthRiskScore = useMemo(() => {
    let score = 0
    let factors = 0

    // Birth complications
    if (data.birthHistory.complications) {
      score += 2
      factors++
    }

    // Current conditions
    if (data.medicalConditions.currentConditions?.length) {
      score += data.medicalConditions.currentConditions.length
      factors++
    }

    // Hospitalizations
    if (data.medicalConditions.hospitalizations?.length) {
      score += data.medicalConditions.hospitalizations.length
      factors++
    }

    // Surgeries
    if (data.medicalConditions.surgeries?.length) {
      score += data.medicalConditions.surgeries.length * 2
      factors++
    }

    // Family history
    const familyRiskFactors = [
      ...(data.familyHistory.mentalHealthConditions || []),
      ...(data.familyHistory.physicalConditions || []),
      ...(data.familyHistory.geneticConditions || [])
    ].length

    if (familyRiskFactors > 0) {
      score += Math.min(familyRiskFactors, 3)
      factors++
    }

    return {
      score: Math.min(score, 10),
      factors,
      level: score <= 2 ? 'low' : score <= 5 ? 'moderate' : 'high'
    }
  }, [data])

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-100'
      case 'moderate': return 'text-yellow-600 bg-yellow-100'
      case 'high': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getRiskLevelIcon = (level: string) => {
    switch (level) {
      case 'low': return <CheckCircle className="h-4 w-4" />
      case 'moderate': return <AlertTriangle className="h-4 w-4" />
      case 'high': return <AlertTriangle className="h-4 w-4" />
      default: return <Info className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Historial Médico</h2>
          {patientInfo && (
            <p className="text-muted-foreground">
              {patientInfo.firstName} {patientInfo.lastName} • {ageInMonths} meses
            </p>
          )}
        </div>
        {showExport && onExport && (
          <Button onClick={onExport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        )}
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Activity className="h-4 w-4 mr-2" />
              Progreso del Desarrollo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">
                  {developmentalProgress.completed}/{developmentalProgress.total}
                </span>
                <Badge variant="secondary">
                  {developmentalProgress.percentage.toFixed(0)}%
                </Badge>
              </div>
              <Progress value={developmentalProgress.percentage} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Heart className="h-4 w-4 mr-2" />
              Riesgo de Salud
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{healthRiskScore.score}/10</span>
                <Badge className={getRiskLevelColor(healthRiskScore.level)}>
                  {getRiskLevelIcon(healthRiskScore.level)}
                  <span className="ml-1 capitalize">{healthRiskScore.level}</span>
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {healthRiskScore.factors} factores de riesgo identificados
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              Historial Completo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">
                  {data.medicalConditions.hospitalizations?.length || 0}
                </span>
                <span className="text-sm text-muted-foreground">Hospitalizaciones</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">
                  {data.medicalConditions.surgeries?.length || 0}
                </span>
                <span className="text-sm text-muted-foreground">Cirugías</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="birth">Nacimiento</TabsTrigger>
          <TabsTrigger value="development">Desarrollo</TabsTrigger>
          <TabsTrigger value="medical">Médico</TabsTrigger>
          <TabsTrigger value="family">Familiar</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Cronología Médica
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Birth */}
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium">Nacimiento</p>
                      <p className="text-sm text-muted-foreground">
                        {data.birthHistory.deliveryMethod && 
                          `Parto ${data.birthHistory.deliveryMethod.toLowerCase()}`
                        }
                        {data.birthHistory.birthWeight && 
                          ` • ${data.birthHistory.birthWeight}kg`
                        }
                      </p>
                    </div>
                  </div>

                  {/* Hospitalizations */}
                  {data.medicalConditions.hospitalizations?.map((hosp, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                      <div>
                        <p className="font-medium">Hospitalización</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(hosp.date).toLocaleDateString()} • {hosp.reason}
                        </p>
                      </div>
                    </div>
                  ))}

                  {/* Surgeries */}
                  {data.medicalConditions.surgeries?.map((surgery, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                      <div>
                        <p className="font-medium">Cirugía</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(surgery.date).toLocaleDateString()} • {surgery.procedure}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Risk Factors */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Factores de Riesgo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.birthHistory.complications && (
                    <div className="flex items-center space-x-2">
                      <Badge variant="destructive" className="text-xs">Alto</Badge>
                      <span className="text-sm">Complicaciones al nacer</span>
                    </div>
                  )}
                  
                  {data.medicalConditions.currentConditions?.map((condition, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Badge variant="secondary" className="text-xs">Moderado</Badge>
                      <span className="text-sm">{condition}</span>
                    </div>
                  ))}

                  {data.familyHistory.geneticConditions?.map((condition, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs">Genético</Badge>
                      <span className="text-sm">{condition}</span>
                    </div>
                  ))}

                  {data.familyHistory.mentalHealthConditions?.map((condition, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs">Mental</Badge>
                      <span className="text-sm">{condition}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="birth" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Información del Nacimiento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.birthHistory.gestationalAge && (
                  <div>
                    <label className="text-sm font-medium">Edad Gestacional</label>
                    <p className="text-lg">{data.birthHistory.gestationalAge} semanas</p>
                  </div>
                )}
                
                {data.birthHistory.birthWeight && (
                  <div>
                    <label className="text-sm font-medium">Peso al Nacer</label>
                    <p className="text-lg">{data.birthHistory.birthWeight} kg</p>
                  </div>
                )}
                
                {data.birthHistory.birthLength && (
                  <div>
                    <label className="text-sm font-medium">Longitud al Nacer</label>
                    <p className="text-lg">{data.birthHistory.birthLength} cm</p>
                  </div>
                )}
                
                {data.birthHistory.deliveryMethod && (
                  <div>
                    <label className="text-sm font-medium">Tipo de Parto</label>
                    <p className="text-lg capitalize">{data.birthHistory.deliveryMethod.toLowerCase()}</p>
                  </div>
                )}
              </div>

              {data.birthHistory.apgarScore && (
                <div>
                  <label className="text-sm font-medium">Puntuación APGAR</label>
                  <div className="flex space-x-4 mt-2">
                    {data.birthHistory.apgarScore.oneMinute && (
                      <div className="text-center">
                        <p className="text-2xl font-bold">{data.birthHistory.apgarScore.oneMinute}</p>
                        <p className="text-xs text-muted-foreground">1 minuto</p>
                      </div>
                    )}
                    {data.birthHistory.apgarScore.fiveMinute && (
                      <div className="text-center">
                        <p className="text-2xl font-bold">{data.birthHistory.apgarScore.fiveMinute}</p>
                        <p className="text-xs text-muted-foreground">5 minutos</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {data.birthHistory.complications && (
                <div>
                  <label className="text-sm font-medium">Complicaciones</label>
                  <Alert className="mt-2">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{data.birthHistory.complications}</AlertDescription>
                  </Alert>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="development" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Hitos del Desarrollo</CardTitle>
              <CardDescription>
                Progreso en los hitos del desarrollo infantil
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(data.developmentalMilestones).map(([key, value]) => {
                    if (key === 'concerns') return null
                    
                    const milestoneNames: Record<string, string> = {
                      firstSmile: 'Primera Sonrisa',
                      firstSit: 'Primer Sentado',
                      firstCrawl: 'Primer Gateo',
                      firstWalk: 'Primeros Pasos',
                      firstWords: 'Primeras Palabras',
                      toiletTraining: 'Control de Esfínteres'
                    }

                    return (
                      <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{milestoneNames[key] || key}</p>
                          <p className="text-sm text-muted-foreground">{value || 'No registrado'}</p>
                        </div>
                        {value ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <div className="h-5 w-5 border-2 border-gray-300 rounded-full" />
                        )}
                      </div>
                    )
                  })}
                </div>

                {data.developmentalMilestones.concerns && (
                  <div>
                    <label className="text-sm font-medium">Preocupaciones del Desarrollo</label>
                    <Alert className="mt-2">
                      <Info className="h-4 w-4" />
                      <AlertDescription>{data.developmentalMilestones.concerns}</AlertDescription>
                    </Alert>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="medical" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Current Conditions */}
            <Card>
              <CardHeader>
                <CardTitle>Condiciones Actuales</CardTitle>
              </CardHeader>
              <CardContent>
                {data.medicalConditions.currentConditions?.length ? (
                  <div className="space-y-2">
                    {data.medicalConditions.currentConditions.map((condition, index) => (
                      <Badge key={index} variant="secondary" className="mr-2 mb-2">
                        {condition}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No hay condiciones actuales registradas</p>
                )}
              </CardContent>
            </Card>

            {/* Past Conditions */}
            <Card>
              <CardHeader>
                <CardTitle>Condiciones Pasadas</CardTitle>
              </CardHeader>
              <CardContent>
                {data.medicalConditions.pastConditions?.length ? (
                  <div className="space-y-2">
                    {data.medicalConditions.pastConditions.map((condition, index) => (
                      <Badge key={index} variant="outline" className="mr-2 mb-2">
                        {condition}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No hay condiciones pasadas registradas</p>
                )}
              </CardContent>
            </Card>

            {/* Hospitalizations */}
            <Card>
              <CardHeader>
                <CardTitle>Hospitalizaciones</CardTitle>
              </CardHeader>
              <CardContent>
                {data.medicalConditions.hospitalizations?.length ? (
                  <div className="space-y-3">
                    {data.medicalConditions.hospitalizations.map((hosp, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{hosp.reason}</p>
                          <Badge variant="outline">
                            {new Date(hosp.date).toLocaleDateString()}
                          </Badge>
                        </div>
                        {hosp.duration && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Duración: {hosp.duration}
                          </p>
                        )}
                        {hosp.hospital && (
                          <p className="text-sm text-muted-foreground">
                            Hospital: {hosp.hospital}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No hay hospitalizaciones registradas</p>
                )}
              </CardContent>
            </Card>

            {/* Surgeries */}
            <Card>
              <CardHeader>
                <CardTitle>Cirugías</CardTitle>
              </CardHeader>
              <CardContent>
                {data.medicalConditions.surgeries?.length ? (
                  <div className="space-y-3">
                    {data.medicalConditions.surgeries.map((surgery, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{surgery.procedure}</p>
                          <Badge variant="outline">
                            {new Date(surgery.date).toLocaleDateString()}
                          </Badge>
                        </div>
                        {surgery.surgeon && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Cirujano: {surgery.surgeon}
                          </p>
                        )}
                        {surgery.hospital && (
                          <p className="text-sm text-muted-foreground">
                            Hospital: {surgery.hospital}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No hay cirugías registradas</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="family" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Mental Health */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Brain className="h-5 w-5 mr-2" />
                  Salud Mental
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.familyHistory.mentalHealthConditions?.length ? (
                  <div className="space-y-2">
                    {data.familyHistory.mentalHealthConditions.map((condition, index) => (
                      <Badge key={index} variant="destructive" className="mr-2 mb-2">
                        {condition}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No hay condiciones de salud mental registradas</p>
                )}
              </CardContent>
            </Card>

            {/* Physical Conditions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Heart className="h-5 w-5 mr-2" />
                  Condiciones Físicas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.familyHistory.physicalConditions?.length ? (
                  <div className="space-y-2">
                    {data.familyHistory.physicalConditions.map((condition, index) => (
                      <Badge key={index} variant="secondary" className="mr-2 mb-2">
                        {condition}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No hay condiciones físicas registradas</p>
                )}
              </CardContent>
            </Card>

            {/* Genetic Conditions */}
            <Card>
              <CardHeader>
                <CardTitle>Condiciones Genéticas</CardTitle>
              </CardHeader>
              <CardContent>
                {data.familyHistory.geneticConditions?.length ? (
                  <div className="space-y-2">
                    {data.familyHistory.geneticConditions.map((condition, index) => (
                      <Badge key={index} variant="outline" className="mr-2 mb-2">
                        {condition}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No hay condiciones genéticas registradas</p>
                )}
              </CardContent>
            </Card>

            {/* Substance Abuse */}
            <Card>
              <CardHeader>
                <CardTitle>Abuso de Sustancias</CardTitle>
              </CardHeader>
              <CardContent>
                {data.familyHistory.substanceAbuse?.length ? (
                  <div className="space-y-2">
                    {data.familyHistory.substanceAbuse.map((substance, index) => (
                      <Badge key={index} variant="destructive" className="mr-2 mb-2">
                        {substance}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No hay historial de abuso de sustancias</p>
                )}
              </CardContent>
            </Card>
          </div>

          {data.familyHistory.other && (
            <Card>
              <CardHeader>
                <CardTitle>Información Adicional</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{data.familyHistory.other}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
