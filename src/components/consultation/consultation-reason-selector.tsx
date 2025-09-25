'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Search, Brain, Heart, Users, BookOpen, Activity, ArrowRight, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useConsultationReasons } from '@/hooks/use-consultation-reasons'

interface ConsultationReason {
  id: string
  name: string
  description?: string
  specialty: {
    id: string
    name: string
    description?: string
  }
}

interface Specialty {
  id: string
  name: string
  description?: string
  icon?: string
}

interface ConsultationReasonSelectorProps {
  onReasonSelect: (reason: ConsultationReason) => void
  onSpecialtySelect: (specialty: Specialty) => void
  selectedReason?: ConsultationReason
  selectedSpecialty?: Specialty
}


export function ConsultationReasonSelector({
  onReasonSelect,
  onSpecialtySelect,
  selectedReason,
  selectedSpecialty
}: ConsultationReasonSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredReasons, setFilteredReasons] = useState<ConsultationReason[]>([])
  const [selectedSpecialtyFilter, setSelectedSpecialtyFilter] = useState<string | null>(null)
  
  const { 
    consultationReasons, 
    specialties, 
    loading, 
    error, 
    fetchReasons 
  } = useConsultationReasons()

  useEffect(() => {
    let filtered = consultationReasons

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(reason =>
        reason.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reason.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reason.specialty.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by specialty
    if (selectedSpecialtyFilter) {
      filtered = filtered.filter(reason => reason.specialty.id === selectedSpecialtyFilter)
    }

    setFilteredReasons(filtered)
  }, [searchTerm, selectedSpecialtyFilter, consultationReasons])

  // Fetch reasons when search or specialty filter changes
  useEffect(() => {
    if (searchTerm || selectedSpecialtyFilter) {
      fetchReasons({
        specialtyId: selectedSpecialtyFilter || undefined,
        search: searchTerm || undefined
      })
    }
  }, [searchTerm, selectedSpecialtyFilter, fetchReasons])

  const handleSpecialtyClick = (specialty: Specialty) => {
    setSelectedSpecialtyFilter(specialty.id)
    onSpecialtySelect(specialty)
  }

  const getSpecialtyIcon = (specialtyName: string): string => {
    const iconMap: { [key: string]: string } = {
      'Psicología Clínica': '🧠',
      'Fonoaudiología': '🗣️',
      'Terapia Ocupacional': '🤲',
      'Fisioterapia': '🏃',
      'Psicopedagogía': '📚'
    }
    return iconMap[specialtyName] || '🏥'
  }

  const handleReasonClick = (reason: ConsultationReason) => {
    onReasonSelect(reason)
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedSpecialtyFilter(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Select Consultation Reason</h2>
        <p className="text-muted-foreground">
          Choose the main reason for your consultation to help us match you with the right specialist
        </p>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="search">Search consultation reasons</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Search by reason, description, or specialty..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Filter by specialty</Label>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedSpecialtyFilter === null ? "default" : "outline"}
                size="sm"
                onClick={clearFilters}
              >
                All Specialties
              </Button>
              {specialties.map((specialty) => (
                <Button
                  key={specialty.id}
                  variant={selectedSpecialtyFilter === specialty.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleSpecialtyClick(specialty)}
                >
                  <span className="mr-1">{getSpecialtyIcon(specialty.name)}</span>
                  {specialty.name}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Specialty Overview */}
      {selectedSpecialtyFilter && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">
                {getSpecialtyIcon(specialties.find(s => s.id === selectedSpecialtyFilter)?.name || '')}
              </span>
              {specialties.find(s => s.id === selectedSpecialtyFilter)?.name}
            </CardTitle>
            <CardDescription>
              {specialties.find(s => s.id === selectedSpecialtyFilter)?.description}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Consultation Reasons */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            Available Consultation Reasons
            {filteredReasons.length !== consultationReasons.length && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({filteredReasons.length} of {consultationReasons.length})
              </span>
            )}
          </h3>
        </div>

        <AnimatePresence>
          <div className="grid gap-4">
            {filteredReasons.map((reason, index) => (
              <motion.div
                key={reason.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card 
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                    selectedReason?.id === reason.id 
                      ? 'ring-2 ring-primary bg-primary/5' 
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => handleReasonClick(reason)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-lg">{reason.name}</h4>
                          <Badge variant="secondary" className="text-xs">
                            {reason.specialty.name}
                          </Badge>
                        </div>
                        {reason.description && (
                          <p className="text-sm text-muted-foreground mb-3">
                            {reason.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="text-lg">{getSpecialtyIcon(reason.specialty.name)}</span>
                          <span>{reason.specialty.name}</span>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>

        {loading && (
          <Card>
            <CardContent className="p-8 text-center">
              <Loader2 className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-spin" />
              <h3 className="text-lg font-semibold mb-2">Loading consultation reasons...</h3>
            </CardContent>
          </Card>
        )}

        {error && (
          <Card>
            <CardContent className="p-8 text-center">
              <Search className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-red-600">Error loading data</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button variant="outline" onClick={() => fetchReasons()}>
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {!loading && !error && filteredReasons.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No consultation reasons found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search terms or specialty filter
              </p>
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Selected Reason Summary */}
      {selectedReason && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <Card className="border-primary bg-primary/5">
            <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">{getSpecialtyIcon(selectedReason.specialty.name)}</span>
              Selected Consultation Reason
            </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <h4 className="font-semibold text-lg">{selectedReason.name}</h4>
                {selectedReason.description && (
                  <p className="text-muted-foreground">{selectedReason.description}</p>
                )}
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{selectedReason.specialty.name}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {selectedReason.specialty.description}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
