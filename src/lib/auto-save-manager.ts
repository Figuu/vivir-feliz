import { FormProgressTracker, type FormType, type ValidationState } from './form-progress-tracker'

export interface AutoSaveConfig {
  enabled: boolean
  interval: number // milliseconds
  maxRetries: number
  retryDelay: number // milliseconds
  debounceDelay: number // milliseconds
}

export interface AutoSaveState {
  isEnabled: boolean
  isActive: boolean
  lastSaved: Date | null
  nextSave: Date | null
  retryCount: number
  pendingChanges: boolean
  error: string | null
}

export interface AutoSaveData {
  formType: FormType
  formId: string
  userId: string
  currentStep: number
  completedSteps: number[]
  validationState: ValidationState
  formData: any
}

export class AutoSaveManager {
  private static instances: Map<string, AutoSaveManager> = new Map()
  private config: AutoSaveConfig
  private state: AutoSaveState
  private intervalId: NodeJS.Timeout | null = null
  private debounceTimeout: NodeJS.Timeout | null = null
  private listeners: Set<(state: AutoSaveState) => void> = new Set()

  constructor(
    private formKey: string,
    config: Partial<AutoSaveConfig> = {}
  ) {
    this.config = {
      enabled: true,
      interval: 30000, // 30 seconds
      maxRetries: 3,
      retryDelay: 5000, // 5 seconds
      debounceDelay: 2000, // 2 seconds
      ...config
    }

    this.state = {
      isEnabled: this.config.enabled,
      isActive: false,
      lastSaved: null,
      nextSave: null,
      retryCount: 0,
      pendingChanges: false,
      error: null
    }
  }

  /**
   * Get or create auto-save manager instance
   */
  static getInstance(formKey: string, config?: Partial<AutoSaveConfig>): AutoSaveManager {
    if (!this.instances.has(formKey)) {
      this.instances.set(formKey, new AutoSaveManager(formKey, config))
    }
    return this.instances.get(formKey)!
  }

  /**
   * Start auto-save for a form
   */
  start(autoSaveData: AutoSaveData): void {
    if (!this.config.enabled) {
      return
    }

    this.state.isActive = true
    this.state.error = null
    this.state.retryCount = 0

    // Clear existing interval
    if (this.intervalId) {
      clearInterval(this.intervalId)
    }

    // Start auto-save interval
    this.intervalId = setInterval(() => {
      this.performAutoSave(autoSaveData)
    }, this.config.interval)

    // Set next save time
    this.state.nextSave = new Date(Date.now() + this.config.interval)
    this.notifyListeners()

    console.log(`Auto-save started for form: ${this.formKey}`)
  }

  /**
   * Stop auto-save
   */
  stop(): void {
    this.state.isActive = false

    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }

    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout)
      this.debounceTimeout = null
    }

    this.state.nextSave = null
    this.notifyListeners()

    console.log(`Auto-save stopped for form: ${this.formKey}`)
  }

  /**
   * Trigger immediate auto-save
   */
  async triggerAutoSave(autoSaveData: AutoSaveData): Promise<boolean> {
    if (!this.config.enabled || !this.state.isActive) {
      return false
    }

    return await this.performAutoSave(autoSaveData)
  }

  /**
   * Debounced auto-save trigger
   */
  debouncedAutoSave(autoSaveData: AutoSaveData): void {
    if (!this.config.enabled || !this.state.isActive) {
      return
    }

    this.state.pendingChanges = true
    this.notifyListeners()

    // Clear existing debounce timeout
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout)
    }

    // Set new debounce timeout
    this.debounceTimeout = setTimeout(async () => {
      await this.performAutoSave(autoSaveData)
    }, this.config.debounceDelay)
  }

  /**
   * Update auto-save configuration
   */
  updateConfig(newConfig: Partial<AutoSaveConfig>): void {
    const wasEnabled = this.config.enabled
    this.config = { ...this.config, ...newConfig }

    // If auto-save was disabled and now enabled, restart
    if (!wasEnabled && this.config.enabled && this.state.isActive) {
      this.restart()
    }
    // If auto-save was enabled and now disabled, stop
    else if (wasEnabled && !this.config.enabled) {
      this.stop()
    }
    // If interval changed and auto-save is active, restart
    else if (this.state.isActive && newConfig.interval) {
      this.restart()
    }

    this.state.isEnabled = this.config.enabled
    this.notifyListeners()
  }

  /**
   * Get current auto-save state
   */
  getState(): AutoSaveState {
    return { ...this.state }
  }

  /**
   * Get auto-save configuration
   */
  getConfig(): AutoSaveConfig {
    return { ...this.config }
  }

  /**
   * Add state change listener
   */
  addListener(listener: (state: AutoSaveState) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  /**
   * Remove all listeners and cleanup
   */
  destroy(): void {
    this.stop()
    this.listeners.clear()
    AutoSaveManager.instances.delete(this.formKey)
  }

  /**
   * Perform the actual auto-save operation
   */
  private async performAutoSave(autoSaveData: AutoSaveData): Promise<boolean> {
    try {
      this.state.pendingChanges = false
      this.state.error = null

      // Perform auto-save using FormProgressTracker
      await FormProgressTracker.autoSaveProgress(
        autoSaveData.formType,
        autoSaveData.formId,
        autoSaveData.userId,
        autoSaveData.currentStep,
        autoSaveData.completedSteps,
        autoSaveData.validationState
      )

      this.state.lastSaved = new Date()
      this.state.retryCount = 0
      this.state.nextSave = new Date(Date.now() + this.config.interval)
      this.notifyListeners()

      console.log(`Auto-save successful for form: ${this.formKey}`)
      return true

    } catch (error) {
      console.error(`Auto-save failed for form: ${this.formKey}`, error)
      
      this.state.error = error instanceof Error ? error.message : 'Auto-save failed'
      this.state.retryCount++

      // Retry if under max retry count
      if (this.state.retryCount < this.config.maxRetries) {
        setTimeout(() => {
          this.performAutoSave(autoSaveData)
        }, this.config.retryDelay)
      } else {
        // Max retries reached, stop auto-save
        this.stop()
        this.state.error = `Auto-save failed after ${this.config.maxRetries} retries`
      }

      this.notifyListeners()
      return false
    }
  }

  /**
   * Restart auto-save with current configuration
   */
  private restart(): void {
    this.stop()
    // Note: This would need the autoSaveData to restart, which should be provided by the caller
    console.log(`Auto-save restarted for form: ${this.formKey}`)
  }

  /**
   * Notify all listeners of state changes
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.getState())
      } catch (error) {
        console.error('Error in auto-save listener:', error)
      }
    })
  }
}

/**
 * Global auto-save manager factory
 */
export class AutoSaveManagerFactory {
  private static managers: Map<string, AutoSaveManager> = new Map()

  /**
   * Get auto-save manager for a specific form
   */
  static getManager(
    formType: FormType,
    formId: string,
    userId: string,
    config?: Partial<AutoSaveConfig>
  ): AutoSaveManager {
    const key = `${formType}:${formId}:${userId}`
    
    if (!this.managers.has(key)) {
      this.managers.set(key, new AutoSaveManager(key, config))
    }
    
    return this.managers.get(key)!
  }

  /**
   * Remove auto-save manager for a specific form
   */
  static removeManager(formType: FormType, formId: string, userId: string): void {
    const key = `${formType}:${formId}:${userId}`
    const manager = this.managers.get(key)
    
    if (manager) {
      manager.destroy()
      this.managers.delete(key)
    }
  }

  /**
   * Get all active auto-save managers
   */
  static getAllManagers(): AutoSaveManager[] {
    return Array.from(this.managers.values())
  }

  /**
   * Cleanup all auto-save managers
   */
  static cleanup(): void {
    this.managers.forEach(manager => manager.destroy())
    this.managers.clear()
  }
}

