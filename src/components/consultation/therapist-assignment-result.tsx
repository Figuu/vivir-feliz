'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { 
  User, 
  CheckCircle, 
  XCircle, 
  Star, 
  Clock, 
  Calendar,
  TrendingUp,
  Users,
  Award,
  AlertCircle,
  Info
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { AssignmentResult, TherapistScore } from '@/hooks/use-therapist-assignment'

interface TherapistAssignmentResultProps {
  result: AssignmentResult
  onTherapistSelect?: (therapistId: string, therapistName: string) => void
  onAlternativeSelect?: (therapist: TherapistScore) => void
  selectedTherapistId?: string
}

export function TherapistAssignmentResult({
  result,
  onTherapistSelect,
  onAlternativeSelect,
  selectedTherapistId
}: TherapistAssignmentResultProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 dark:text-green-400'
    if (score >= 75) return 'text-blue-600 dark:text-blue-400'
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getScoreBadge = (score: number) => {
    if (score >= 90) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    if (score >= 75) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    if (score >= 60) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
  }

  const getStrategyIcon = (strategy: string) => {
    if (strategy.includes('Optimal') || strategy.includes('perfect')) return <Award className="h-4 w-4 text-green-500" />
    if (strategy.includes('Good') || strategy.includes('strong')) return <CheckCircle className="h-4 w-4 text-blue-500" />
    if (strategy.includes('Acceptable') || strategy.includes('suitable')) return <Info className="h-4 w-4 text-yellow-500" />
    if (strategy.includes('Suboptimal') || strategy.includes('limited')) return <AlertCircle className="h-4 w-4 text-orange-500" />
    return <XCircle className="h-4 w-4 text-red-500" />
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  return (
    <div className="space-y-6">
      {/* Assignment Strategy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStrategyIcon(result.assignmentStrategy)}
            Assignment Strategy
          </CardTitle>
          <CardDescription>
            {result.assignmentStrategy}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{result.totalCandidates} Candidates</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{formatDate(result.assignmentTime)}</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">
                {result.assignedTherapist ? 'Assigned' : 'No Assignment'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">
                {result.alternativeTherapists.length} Alternatives
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assigned Therapist */}
      {result.assignedTherapist && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Assigned Therapist
              </CardTitle>
              <CardDescription>
                Best match found for your consultation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-lg">
                    {getInitials(result.assignedTherapist.therapistName)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-semibold">{result.assignedTherapist.therapistName}</h3>
                    <Badge className={getScoreBadge(result.assignedTherapist.score)}>
                      Score: {result.assignedTherapist.score}
                    </Badge>
                  </div>
                  
                  <div className="flex flex-wrap gap-1">
                    {result.assignedTherapist.specialties.map((specialty) => (
                      <Badge key={specialty} variant="outline" className="text-xs">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Assignment Reasons:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {result.assignedTherapist.reasons.map((reason, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                          {reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {onTherapistSelect && (
                    <Button 
                      onClick={() => onTherapistSelect(result.assignedTherapist!.therapistId, result.assignedTherapist!.therapistName)}
                      className="mt-4"
                    >
                      Confirm Assignment
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* No Assignment */}
      {!result.assignedTherapist && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
            <CardContent className="p-8 text-center">
              <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-red-600">No Therapist Assigned</h3>
              <p className="text-muted-foreground mb-4">
                {result.assignmentStrategy}
              </p>
              {result.alternativeTherapists.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  Consider the alternative therapists below or try a different time slot.
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Alternative Therapists */}
      {result.alternativeTherapists.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Alternative Therapists ({result.alternativeTherapists.length})
            </CardTitle>
            <CardDescription>
              Other available therapists ranked by suitability
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {result.alternativeTherapists.map((therapist, index) => (
                <motion.div
                  key={therapist.therapistId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card 
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedTherapistId === therapist.therapistId 
                        ? 'border-primary ring-2 ring-primary' 
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => onAlternativeSelect?.(therapist)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src="" />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {getInitials(therapist.therapistName)}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-semibold">{therapist.therapistName}</h4>
                            <Badge className={getScoreBadge(therapist.score)}>
                              Score: {therapist.score}
                            </Badge>
                            {!therapist.availability && (
                              <Badge variant="destructive" className="text-xs">
                                Unavailable
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex flex-wrap gap-1 mb-3">
                            {therapist.specialties.map((specialty) => (
                              <Badge key={specialty} variant="outline" className="text-xs">
                                {specialty}
                              </Badge>
                            ))}
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-muted-foreground mb-3">
                            <div className="flex items-center gap-1">
                              <TrendingUp className="h-3 w-3" />
                              <span>{therapist.experience} years exp.</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              <span>{therapist.currentWorkload}/{therapist.maxWorkload} today</span>
                            </div>
                            {therapist.rating && (
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3" />
                                <span>{therapist.rating}/5.0</span>
                              </div>
                            )}
                            {therapist.lastAssigned && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>Last: {new Date(therapist.lastAssigned).toLocaleDateString()}</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="space-y-1">
                            <h5 className="font-medium text-xs">Key Factors:</h5>
                            <div className="flex flex-wrap gap-1">
                              {therapist.reasons.slice(0, 3).map((reason, reasonIndex) => (
                                <Badge key={reasonIndex} variant="secondary" className="text-xs">
                                  {reason}
                                </Badge>
                              ))}
                              {therapist.reasons.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{therapist.reasons.length - 3} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {selectedTherapistId === therapist.therapistId && (
                          <CheckCircle className="h-6 w-6 text-primary" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Assignment Summary */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="font-medium">
                  {result.assignedTherapist ? '1 Assigned' : '0 Assigned'}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4 text-blue-500" />
                <span className="font-medium">{result.alternativeTherapists.length} Alternatives</span>
              </div>
            </div>
            <div className="text-muted-foreground">
              Total candidates: {result.totalCandidates}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


