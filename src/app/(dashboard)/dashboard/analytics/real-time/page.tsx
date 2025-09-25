"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { WidgetFactory, DEFAULT_WIDGETS } from '@/components/analytics/widget-library'
import { useToast } from '@/hooks/use-toast'
import { RefreshCw, Pause, Play } from 'lucide-react'

export default function RealTimeDashboard() {
  const [isLive, setIsLive] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'error'>('connected')
  const { toast } = useToast()

  useEffect(() => {
    if (isLive) {
      const interval = setInterval(() => {
        setLastUpdate(new Date())
        // Simulate connection check
        setConnectionStatus('connected')
      }, 30000) // Update every 30 seconds

      return () => clearInterval(interval)
    }
  }, [isLive])

  const handleRefresh = async () => {
    try {
      // Clear cache to force fresh data
      await fetch('/api/analytics/real-time', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear_cache' })
      })
      
      setLastUpdate(new Date())
      toast({
        title: 'Dashboard Refreshed',
        description: 'All widgets have been updated with fresh data',
      })
    } catch {
      toast({
        title: 'Refresh Failed',
        description: 'Failed to refresh dashboard data',
        variant: 'destructive'
      })
    }
  }

  const toggleLiveMode = () => {
    setIsLive(!isLive)
    if (!isLive) {
      setLastUpdate(new Date())
    }
    
    toast({
      title: isLive ? 'Live Mode Disabled' : 'Live Mode Enabled',
      description: isLive 
        ? 'Dashboard will no longer auto-refresh' 
        : 'Dashboard will auto-refresh every 30 seconds',
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Real-Time Analytics</h1>
          <p className="text-muted-foreground">
            Live dashboard with real-time data updates
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge 
            variant={connectionStatus === 'connected' ? 'default' : 'destructive'}
            className="animate-pulse"
          >
            {connectionStatus === 'connected' ? '🟢 Live' : '🔴 Disconnected'}
          </Badge>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button 
            variant={isLive ? "default" : "outline"} 
            size="sm" 
            onClick={toggleLiveMode}
          >
            {isLive ? (
              <>
                <Pause className="mr-2 h-4 w-4" />
                Pause Live
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Resume Live
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Status Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dashboard Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <div className="text-sm font-medium">Update Mode</div>
              <div className="text-sm text-muted-foreground">
                {isLive ? 'Auto-refresh enabled (30s)' : 'Manual refresh only'}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium">Last Update</div>
              <div className="text-sm text-muted-foreground">
                {lastUpdate ? lastUpdate.toLocaleTimeString() : 'Never'}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium">Connection</div>
              <div className="text-sm text-muted-foreground">
                {connectionStatus === 'connected' ? 'Connected to live data' : 'Connection lost'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Real-time Dashboard Grid */}
      <div className="grid gap-4 auto-rows-min grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {DEFAULT_WIDGETS.map((widget) => (
          <WidgetFactory key={widget.id} config={widget} />
        ))}
      </div>

      {/* Live Activity Section */}
      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
          <CardDescription>
            Real-time system status and performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-green-600">99.9%</div>
              <div className="text-sm text-muted-foreground">Uptime</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-blue-600">24ms</div>
              <div className="text-sm text-muted-foreground">Avg Response</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-purple-600">2.1K</div>
              <div className="text-sm text-muted-foreground">Requests/min</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-orange-600">0.02%</div>
              <div className="text-sm text-muted-foreground">Error Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}