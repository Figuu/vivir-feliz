'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Activity, 
  Database,
  Server,
  CheckCircle,
  AlertTriangle,
  XCircle,
  MemoryStick,
  Cpu
} from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from '@/hooks/use-toast'

interface HealthData {
  overall: {
    status: string
    uptime: number
    responseTime: number
  }
  components: {
    database: {
      status: string
      responseTime: number
    }
    api: {
      status: string
      responseTime: number
    }
  }
  resources: {
    memory: {
      percentage: string
    }
  }
}

export function MobileSystemHealth() {
  const [loading, setLoading] = useState(false)
  const [health, setHealth] = useState<HealthData | null>(null)

  useEffect(() => {
    loadHealth()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadHealth, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadHealth = async () => {
    try {
      setLoading(true)
      
      const response = await fetch('/api/super-admin/system-health')
      
      if (!response.ok) {
        throw new Error('Failed to load system health')
      }

      const result = await response.json()
      setHealth(result.data)
    } catch (err) {
      console.error('Error loading system health:', err)
      toast({
        variant: "destructive",
        title: "Error",
        description: 'Failed to load system health'
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'healthy': return <CheckCircle className="h-8 w-8 text-green-500" />
      case 'warning': return <AlertTriangle className="h-8 w-8 text-yellow-500" />
      case 'critical': return <XCircle className="h-8 w-8 text-red-500" />
      default: return <Activity className="h-8 w-8 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'healthy': return 'bg-green-50 border-green-200'
      case 'warning': return 'bg-yellow-50 border-yellow-200'
      case 'critical': return 'bg-red-50 border-red-200'
      default: return 'bg-gray-50 border-gray-200'
    }
  }

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (days > 0) return `${days}d ${hours}h`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  if (loading || !health) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading system health...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Status Header */}
      <div className={`p-6 sticky top-0 z-10 shadow-md border-b-4 ${getStatusColor(health.overall.status)}`}>
        <div className="text-center">
          <div className="flex justify-center mb-3">
            {getStatusIcon(health.overall.status)}
          </div>
          <h2 className="text-2xl font-bold mb-2 capitalize">{health.overall.status}</h2>
          <p className="text-sm text-muted-foreground">
            Uptime: {formatUptime(health.overall.uptime)}
          </p>
        </div>
      </div>

      {/* Component Status */}
      <div className="p-4 space-y-3 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <Database className="h-10 w-10 text-blue-500" />
                  <div>
                    <p className="font-semibold">Database</p>
                    <Badge className={getStatusColor(health.components.database.status).replace('bg-', 'bg-').replace('border-', 'text-')}>
                      {health.components.database.status}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Response Time</span>
                  <span className="font-medium">{health.components.database.responseTime}ms</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <Server className="h-10 w-10 text-green-500" />
                  <div>
                    <p className="font-semibold">API Server</p>
                    <Badge className={getStatusColor(health.components.api.status).replace('bg-', 'bg-').replace('border-', 'text-')}>
                      {health.components.api.status}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Response Time</span>
                  <span className="font-medium">{health.components.api.responseTime}ms</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <MemoryStick className="h-10 w-10 text-purple-500" />
                  <div>
                    <p className="font-semibold">Memory Usage</p>
                    <Badge variant="outline">
                      {health.resources.memory.percentage}%
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    parseFloat(health.resources.memory.percentage) > 90 ? 'bg-red-500' :
                    parseFloat(health.resources.memory.percentage) > 70 ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`}
                  style={{ width: `${health.resources.memory.percentage}%` }}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
