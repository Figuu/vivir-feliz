'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Settings, 
  Save,
  RefreshCw,
  Calendar,
  DollarSign,
  Bell,
  Shield,
  Palette,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

interface SystemConfig {
  id: string
  category: string
  key: string
  value: any
  updatedAt: string
  updatedBy?: string
}

interface ConfigCategory {
  name: string
  icon: any
  key: string
  description: string
}

export function SystemConfigurationManager() {
  const [loading, setLoading] = useState(false)
  const [configs, setConfigs] = useState<SystemConfig[]>([])
  const [activeCategory, setActiveCategory] = useState('general')
  const [hasChanges, setHasChanges] = useState(false)
  
  const [settings, setSettings] = useState<Record<string, any>>({
    general: {
      systemName: 'Vivir Feliz Therapy Center',
      systemEmail: 'contact@vivirfeliz.com',
      systemPhone: '+1234567890',
      timezone: 'America/New_York',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h'
    },
    scheduling: {
      sessionDuration: 60,
      bufferTime: 15,
      advanceBookingDays: 30,
      cancellationHours: 24,
      maxSessionsPerDay: 8,
      workingHoursStart: '08:00',
      workingHoursEnd: '18:00'
    },
    payment: {
      currency: 'USD',
      paymentDueDays: 30,
      latePaymentFee: 25,
      latePaymentGraceDays: 7,
      allowPartialPayments: true,
      autoGenerateInvoices: true,
      sendPaymentReminders: true,
      reminderDaysBeforeDue: 7
    },
    notification: {
      enableEmailNotifications: true,
      enableSmsNotifications: false,
      sendAppointmentReminders: true,
      reminderHoursBefore: 24,
      sendPaymentReminders: true,
      sendReportNotifications: true,
      adminNotificationEmail: 'admin@vivirfeliz.com'
    },
    security: {
      sessionTimeout: 60,
      maxLoginAttempts: 5,
      lockoutDuration: 30,
      passwordMinLength: 8,
      requirePasswordChange: false,
      passwordChangeDays: 90,
      enableTwoFactor: false,
      allowMultipleSessions: false
    },
    appearance: {
      primaryColor: '#3b82f6',
      secondaryColor: '#8b5cf6',
      accentColor: '#10b981',
      theme: 'light',
      logoUrl: '',
      faviconUrl: ''
    }
  })

  const categories: ConfigCategory[] = [
    {
      name: 'General',
      icon: Settings,
      key: 'general',
      description: 'Basic system settings and information'
    },
    {
      name: 'Scheduling',
      icon: Calendar,
      key: 'scheduling',
      description: 'Session scheduling and appointment settings'
    },
    {
      name: 'Payment',
      icon: DollarSign,
      key: 'payment',
      description: 'Payment processing and billing configuration'
    },
    {
      name: 'Notifications',
      icon: Bell,
      key: 'notification',
      description: 'Email and SMS notification preferences'
    },
    {
      name: 'Security',
      icon: Shield,
      key: 'security',
      description: 'Security and authentication settings'
    },
    {
      name: 'Appearance',
      icon: Palette,
      key: 'appearance',
      description: 'Theme and branding customization'
    }
  ]

  useEffect(() => {
    loadConfigurations()
  }, [])

  const loadConfigurations = async () => {
    try {
      setLoading(true)
      
      const response = await fetch('/api/system-configuration')
      
      if (!response.ok) {
        throw new Error('Failed to load configurations')
      }

      const result = await response.json()
      
      // Process loaded configs and merge with defaults
      if (result.data && result.data.length > 0) {
        const loadedSettings: Record<string, any> = {}
        
        result.data.forEach((config: SystemConfig) => {
          if (!loadedSettings[config.category]) {
            loadedSettings[config.category] = {}
          }
          loadedSettings[config.category][config.key] = config.value
        })

        // Merge with defaults
        setSettings(prev => {
          const merged = { ...prev }
          Object.keys(loadedSettings).forEach(category => {
            merged[category] = { ...prev[category], ...loadedSettings[category] }
          })
          return merged
        })
      }
      
      setConfigs(result.data || [])
    } catch (err) {
      console.error('Error loading configurations:', err)
      toast.error('Failed to load system configurations')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSettings = async () => {
    try {
      setLoading(true)

      const response = await fetch('/api/system-configuration', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: activeCategory,
          settings: settings[activeCategory],
          updatedBy: 'super-admin-1' // Should come from auth context
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save settings')
      }

      toast.success('Settings saved successfully')
      setHasChanges(false)
      loadConfigurations()
    } catch (err: any) {
      console.error('Error saving settings:', err)
      toast.error(err.message || 'Failed to save settings')
    } finally {
      setLoading(false)
    }
  }

  const updateSetting = (category: string, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }))
    setHasChanges(true)
  }

  const renderGeneralSettings = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="systemName">System Name</Label>
        <Input
          id="systemName"
          value={settings.general.systemName}
          onChange={(e) => updateSetting('general', 'systemName', e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="systemEmail">System Email</Label>
        <Input
          id="systemEmail"
          type="email"
          value={settings.general.systemEmail}
          onChange={(e) => updateSetting('general', 'systemEmail', e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="systemPhone">System Phone</Label>
        <Input
          id="systemPhone"
          value={settings.general.systemPhone}
          onChange={(e) => updateSetting('general', 'systemPhone', e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="timezone">Timezone</Label>
        <select
          id="timezone"
          value={settings.general.timezone}
          onChange={(e) => updateSetting('general', 'timezone', e.target.value)}
          className="w-full border rounded-md px-3 py-2"
        >
          <option value="America/New_York">Eastern Time</option>
          <option value="America/Chicago">Central Time</option>
          <option value="America/Denver">Mountain Time</option>
          <option value="America/Los_Angeles">Pacific Time</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="dateFormat">Date Format</Label>
        <select
          id="dateFormat"
          value={settings.general.dateFormat}
          onChange={(e) => updateSetting('general', 'dateFormat', e.target.value)}
          className="w-full border rounded-md px-3 py-2"
        >
          <option value="MM/DD/YYYY">MM/DD/YYYY</option>
          <option value="DD/MM/YYYY">DD/MM/YYYY</option>
          <option value="YYYY-MM-DD">YYYY-MM-DD</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="timeFormat">Time Format</Label>
        <select
          id="timeFormat"
          value={settings.general.timeFormat}
          onChange={(e) => updateSetting('general', 'timeFormat', e.target.value)}
          className="w-full border rounded-md px-3 py-2"
        >
          <option value="12h">12 Hour (AM/PM)</option>
          <option value="24h">24 Hour</option>
        </select>
      </div>
    </div>
  )

  const renderSchedulingSettings = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="sessionDuration">Default Session Duration (minutes)</Label>
        <Input
          id="sessionDuration"
          type="number"
          value={settings.scheduling.sessionDuration}
          onChange={(e) => updateSetting('scheduling', 'sessionDuration', parseInt(e.target.value))}
          min={15}
          max={180}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="bufferTime">Buffer Time Between Sessions (minutes)</Label>
        <Input
          id="bufferTime"
          type="number"
          value={settings.scheduling.bufferTime}
          onChange={(e) => updateSetting('scheduling', 'bufferTime', parseInt(e.target.value))}
          min={0}
          max={60}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="advanceBookingDays">Advance Booking Days</Label>
        <Input
          id="advanceBookingDays"
          type="number"
          value={settings.scheduling.advanceBookingDays}
          onChange={(e) => updateSetting('scheduling', 'advanceBookingDays', parseInt(e.target.value))}
          min={1}
          max={365}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="cancellationHours">Cancellation Notice (hours)</Label>
        <Input
          id="cancellationHours"
          type="number"
          value={settings.scheduling.cancellationHours}
          onChange={(e) => updateSetting('scheduling', 'cancellationHours', parseInt(e.target.value))}
          min={1}
          max={72}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="maxSessionsPerDay">Max Sessions Per Day</Label>
        <Input
          id="maxSessionsPerDay"
          type="number"
          value={settings.scheduling.maxSessionsPerDay}
          onChange={(e) => updateSetting('scheduling', 'maxSessionsPerDay', parseInt(e.target.value))}
          min={1}
          max={20}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="workingHoursStart">Working Hours Start</Label>
        <Input
          id="workingHoursStart"
          type="time"
          value={settings.scheduling.workingHoursStart}
          onChange={(e) => updateSetting('scheduling', 'workingHoursStart', e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="workingHoursEnd">Working Hours End</Label>
        <Input
          id="workingHoursEnd"
          type="time"
          value={settings.scheduling.workingHoursEnd}
          onChange={(e) => updateSetting('scheduling', 'workingHoursEnd', e.target.value)}
        />
      </div>
    </div>
  )

  const renderPaymentSettings = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="currency">Currency</Label>
        <select
          id="currency"
          value={settings.payment.currency}
          onChange={(e) => updateSetting('payment', 'currency', e.target.value)}
          className="w-full border rounded-md px-3 py-2"
        >
          <option value="USD">USD - US Dollar</option>
          <option value="EUR">EUR - Euro</option>
          <option value="GBP">GBP - British Pound</option>
          <option value="MXN">MXN - Mexican Peso</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="paymentDueDays">Payment Due Days</Label>
        <Input
          id="paymentDueDays"
          type="number"
          value={settings.payment.paymentDueDays}
          onChange={(e) => updateSetting('payment', 'paymentDueDays', parseInt(e.target.value))}
          min={1}
          max={90}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="latePaymentFee">Late Payment Fee ($)</Label>
        <Input
          id="latePaymentFee"
          type="number"
          value={settings.payment.latePaymentFee}
          onChange={(e) => updateSetting('payment', 'latePaymentFee', parseFloat(e.target.value))}
          min={0}
          step={0.01}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="latePaymentGraceDays">Grace Period (days)</Label>
        <Input
          id="latePaymentGraceDays"
          type="number"
          value={settings.payment.latePaymentGraceDays}
          onChange={(e) => updateSetting('payment', 'latePaymentGraceDays', parseInt(e.target.value))}
          min={0}
          max={30}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="reminderDaysBeforeDue">Reminder Days Before Due</Label>
        <Input
          id="reminderDaysBeforeDue"
          type="number"
          value={settings.payment.reminderDaysBeforeDue}
          onChange={(e) => updateSetting('payment', 'reminderDaysBeforeDue', parseInt(e.target.value))}
          min={1}
          max={30}
        />
      </div>
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="allowPartialPayments"
            checked={settings.payment.allowPartialPayments}
            onChange={(e) => updateSetting('payment', 'allowPartialPayments', e.target.checked)}
            className="rounded"
          />
          <Label htmlFor="allowPartialPayments" className="cursor-pointer">
            Allow Partial Payments
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="autoGenerateInvoices"
            checked={settings.payment.autoGenerateInvoices}
            onChange={(e) => updateSetting('payment', 'autoGenerateInvoices', e.target.checked)}
            className="rounded"
          />
          <Label htmlFor="autoGenerateInvoices" className="cursor-pointer">
            Auto-Generate Invoices
          </Label>
        </div>
      </div>
    </div>
  )

  const renderNotificationSettings = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="enableEmailNotifications"
            checked={settings.notification.enableEmailNotifications}
            onChange={(e) => updateSetting('notification', 'enableEmailNotifications', e.target.checked)}
            className="rounded"
          />
          <Label htmlFor="enableEmailNotifications" className="cursor-pointer">
            Enable Email Notifications
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="enableSmsNotifications"
            checked={settings.notification.enableSmsNotifications}
            onChange={(e) => updateSetting('notification', 'enableSmsNotifications', e.target.checked)}
            className="rounded"
          />
          <Label htmlFor="enableSmsNotifications" className="cursor-pointer">
            Enable SMS Notifications
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="sendAppointmentReminders"
            checked={settings.notification.sendAppointmentReminders}
            onChange={(e) => updateSetting('notification', 'sendAppointmentReminders', e.target.checked)}
            className="rounded"
          />
          <Label htmlFor="sendAppointmentReminders" className="cursor-pointer">
            Send Appointment Reminders
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="sendPaymentReminders"
            checked={settings.notification.sendPaymentReminders}
            onChange={(e) => updateSetting('notification', 'sendPaymentReminders', e.target.checked)}
            className="rounded"
          />
          <Label htmlFor="sendPaymentReminders" className="cursor-pointer">
            Send Payment Reminders
          </Label>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="reminderHoursBefore">Appointment Reminder Hours Before</Label>
          <Input
            id="reminderHoursBefore"
            type="number"
            value={settings.notification.reminderHoursBefore}
            onChange={(e) => updateSetting('notification', 'reminderHoursBefore', parseInt(e.target.value))}
            min={1}
            max={168}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="adminNotificationEmail">Admin Notification Email</Label>
          <Input
            id="adminNotificationEmail"
            type="email"
            value={settings.notification.adminNotificationEmail}
            onChange={(e) => updateSetting('notification', 'adminNotificationEmail', e.target.value)}
          />
        </div>
      </div>
    </div>
  )

  const renderSecuritySettings = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
        <Input
          id="sessionTimeout"
          type="number"
          value={settings.security.sessionTimeout}
          onChange={(e) => updateSetting('security', 'sessionTimeout', parseInt(e.target.value))}
          min={5}
          max={480}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
        <Input
          id="maxLoginAttempts"
          type="number"
          value={settings.security.maxLoginAttempts}
          onChange={(e) => updateSetting('security', 'maxLoginAttempts', parseInt(e.target.value))}
          min={3}
          max={10}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="lockoutDuration">Lockout Duration (minutes)</Label>
        <Input
          id="lockoutDuration"
          type="number"
          value={settings.security.lockoutDuration}
          onChange={(e) => updateSetting('security', 'lockoutDuration', parseInt(e.target.value))}
          min={5}
          max={1440}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="passwordMinLength">Password Min Length</Label>
        <Input
          id="passwordMinLength"
          type="number"
          value={settings.security.passwordMinLength}
          onChange={(e) => updateSetting('security', 'passwordMinLength', parseInt(e.target.value))}
          min={6}
          max={20}
        />
      </div>
      <div className="space-y-4 col-span-2">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="requirePasswordChange"
            checked={settings.security.requirePasswordChange}
            onChange={(e) => updateSetting('security', 'requirePasswordChange', e.target.checked)}
            className="rounded"
          />
          <Label htmlFor="requirePasswordChange" className="cursor-pointer">
            Require Periodic Password Changes
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="enableTwoFactor"
            checked={settings.security.enableTwoFactor}
            onChange={(e) => updateSetting('security', 'enableTwoFactor', e.target.checked)}
            className="rounded"
          />
          <Label htmlFor="enableTwoFactor" className="cursor-pointer">
            Enable Two-Factor Authentication
          </Label>
        </div>
      </div>
    </div>
  )

  const renderAppearanceSettings = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="primaryColor">Primary Color</Label>
        <div className="flex space-x-2">
          <Input
            id="primaryColor"
            type="color"
            value={settings.appearance.primaryColor}
            onChange={(e) => updateSetting('appearance', 'primaryColor', e.target.value)}
            className="w-20 h-10"
          />
          <Input
            value={settings.appearance.primaryColor}
            onChange={(e) => updateSetting('appearance', 'primaryColor', e.target.value)}
            className="flex-1"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="secondaryColor">Secondary Color</Label>
        <div className="flex space-x-2">
          <Input
            id="secondaryColor"
            type="color"
            value={settings.appearance.secondaryColor}
            onChange={(e) => updateSetting('appearance', 'secondaryColor', e.target.value)}
            className="w-20 h-10"
          />
          <Input
            value={settings.appearance.secondaryColor}
            onChange={(e) => updateSetting('appearance', 'secondaryColor', e.target.value)}
            className="flex-1"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="theme">Theme</Label>
        <select
          id="theme"
          value={settings.appearance.theme}
          onChange={(e) => updateSetting('appearance', 'theme', e.target.value)}
          className="w-full border rounded-md px-3 py-2"
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="auto">Auto (System Preference)</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="logoUrl">Logo URL</Label>
        <Input
          id="logoUrl"
          type="url"
          value={settings.appearance.logoUrl}
          onChange={(e) => updateSetting('appearance', 'logoUrl', e.target.value)}
          placeholder="https://example.com/logo.png"
        />
      </div>
    </div>
  )

  const getCurrentCategorySettings = () => {
    switch (activeCategory) {
      case 'general': return renderGeneralSettings()
      case 'scheduling': return renderSchedulingSettings()
      case 'payment': return renderPaymentSettings()
      case 'notification': return renderNotificationSettings()
      case 'security': return renderSecuritySettings()
      case 'appearance': return renderAppearanceSettings()
      default: return null
    }
  }

  const currentCategory = categories.find(c => c.key === activeCategory)

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              System Configuration
            </CardTitle>
            <div className="flex items-center space-x-2">
              {hasChanges && (
                <Badge variant="outline" className="bg-yellow-50">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Unsaved Changes
                </Badge>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={loadConfigurations}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button 
                size="sm" 
                onClick={handleSaveSettings}
                disabled={loading || !hasChanges}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Category Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {categories.map((category) => {
          const Icon = category.icon
          const isActive = activeCategory === category.key
          
          return (
            <motion.div
              key={category.key}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card
                className={`cursor-pointer transition-all ${
                  isActive ? 'border-primary shadow-md bg-primary/5' : 'hover:shadow-md'
                }`}
                onClick={() => setActiveCategory(category.key)}
              >
                <CardContent className="pt-6 text-center">
                  <Icon className={`h-8 w-8 mx-auto mb-2 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                  <p className={`text-sm font-medium ${isActive ? 'text-primary' : ''}`}>
                    {category.name}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Settings Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-base">
            {currentCategory && <currentCategory.icon className="h-5 w-5 mr-2" />}
            {currentCategory?.name} Settings
          </CardTitle>
          <p className="text-sm text-muted-foreground">{currentCategory?.description}</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : (
            getCurrentCategorySettings()
          )}
        </CardContent>
      </Card>

      {/* Save Reminder */}
      {hasChanges && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You have unsaved changes. Click "Save Changes" to apply your updates.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
