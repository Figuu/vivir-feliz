'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  DollarSign, 
  TrendingUp,
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronRight
} from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from '@/hooks/use-toast'

interface FinancialData {
  overview: {
    totalRevenue: number
    totalPaid: number
    totalPending: number
    totalOverdue: number
    collectionRate: string
  }
}

export function MobileFinancialOverview() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<FinancialData | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      const response = await fetch('/api/super-admin/financial-oversight')
      
      if (!response.ok) {
        throw new Error('Failed to load financial data')
      }

      const result = await response.json()
      setData(result.data)
    } catch (err) {
      console.error('Error loading financial data:', err)
      toast({
        variant: "destructive",
        title: "Error",
        description: 'Failed to load financial data'
      })
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading financial data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Revenue Summary */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6 sticky top-0 z-10 shadow-md">
        <div className="text-center">
          <p className="text-sm text-white/80 mb-1">Total Revenue</p>
          <p className="text-4xl font-bold mb-2">{formatCurrency(data.overview.totalRevenue)}</p>
          <Badge className="bg-white/20 text-white border-white/30">
            <TrendingUp className="h-3 w-3 mr-1" />
            {data.overview.collectionRate}% Collection Rate
          </Badge>
        </div>
      </div>

      {/* Breakdown Cards */}
      <div className="p-4 space-y-3 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
          whileTap={{ scale: 0.98 }}
        >
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="p-4 bg-green-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-10 w-10 text-green-500" />
                    <div>
                      <p className="text-sm text-green-700 mb-1">Collected</p>
                      <p className="text-2xl font-bold text-green-900">{formatCurrency(data.overview.totalPaid)}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          whileTap={{ scale: 0.98 }}
        >
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="p-4 bg-yellow-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Clock className="h-10 w-10 text-yellow-500" />
                    <div>
                      <p className="text-sm text-yellow-700 mb-1">Pending</p>
                      <p className="text-2xl font-bold text-yellow-900">{formatCurrency(data.overview.totalPending)}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          whileTap={{ scale: 0.98 }}
        >
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="p-4 bg-red-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <AlertCircle className="h-10 w-10 text-red-500" />
                    <div>
                      <p className="text-sm text-red-700 mb-1">Overdue</p>
                      <p className="text-2xl font-bold text-red-900">{formatCurrency(data.overview.totalOverdue)}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
