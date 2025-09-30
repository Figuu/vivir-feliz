/**
 * API Testing Utilities
 * Helper functions for testing API endpoints
 */

import { NextRequest } from 'next/server'

// Test request builder
export class TestRequestBuilder {
  private url: string
  private method: string = 'GET'
  private headers: Record<string, string> = {}
  private body?: any
  private searchParams: Record<string, string> = {}

  constructor(path: string, baseUrl: string = 'http://localhost:3000') {
    this.url = `${baseUrl}${path}`
  }

  setMethod(method: string): this {
    this.method = method
    return this
  }

  setHeader(key: string, value: string): this {
    this.headers[key] = value
    return this
  }

  setHeaders(headers: Record<string, string>): this {
    this.headers = { ...this.headers, ...headers }
    return this
  }

  setBody(body: any): this {
    this.body = body
    if (typeof body === 'object') {
      this.setHeader('Content-Type', 'application/json')
    }
    return this
  }

  setSearchParam(key: string, value: string): this {
    this.searchParams[key] = value
    return this
  }

  setSearchParams(params: Record<string, string>): this {
    this.searchParams = { ...this.searchParams, ...params }
    return this
  }

  setAuth(token: string): this {
    this.setHeader('Cookie', `sb-access-token=${token}`)
    return this
  }

  build(): NextRequest {
    // Build URL with search params
    const url = new URL(this.url)
    Object.entries(this.searchParams).forEach(([key, value]) => {
      url.searchParams.set(key, value)
    })

    // Build request
    const request = new NextRequest(url, {
      method: this.method,
      headers: new Headers(this.headers),
      body: this.body ? JSON.stringify(this.body) : undefined
    })

    return request
  }
}

// Test response validator
export class TestResponseValidator {
  constructor(private response: Response) {}

  async expectStatus(status: number): Promise<this> {
    if (this.response.status !== status) {
      const body = await this.response.text()
      throw new Error(
        `Expected status ${status}, got ${this.response.status}. Body: ${body}`
      )
    }
    return this
  }

  async expectOk(): Promise<this> {
    return this.expectStatus(200)
  }

  async expectCreated(): Promise<this> {
    return this.expectStatus(201)
  }

  async expectBadRequest(): Promise<this> {
    return this.expectStatus(400)
  }

  async expectUnauthorized(): Promise<this> {
    return this.expectStatus(401)
  }

  async expectForbidden(): Promise<this> {
    return this.expectStatus(403)
  }

  async expectNotFound(): Promise<this> {
    return this.expectStatus(404)
  }

  async expectHeader(key: string, value: string): Promise<this> {
    const headerValue = this.response.headers.get(key)
    if (headerValue !== value) {
      throw new Error(
        `Expected header ${key} to be "${value}", got "${headerValue}"`
      )
    }
    return this
  }

  async expectJson(): Promise<any> {
    const contentType = this.response.headers.get('content-type')
    if (!contentType?.includes('application/json')) {
      throw new Error(
        `Expected JSON response, got content-type: ${contentType}`
      )
    }
    return this.response.json()
  }

  async expectBody(expected: any): Promise<this> {
    const body = await this.response.json()
    if (JSON.stringify(body) !== JSON.stringify(expected)) {
      throw new Error(
        `Expected body ${JSON.stringify(expected)}, got ${JSON.stringify(body)}`
      )
    }
    return this
  }

  async expectBodyContains(key: string): Promise<this> {
    const body = await this.response.json()
    if (!(key in body)) {
      throw new Error(
        `Expected body to contain key "${key}", got: ${JSON.stringify(body)}`
      )
    }
    return this
  }

  async expectError(type?: string): Promise<any> {
    const body = await this.response.json()
    if (!body.error) {
      throw new Error('Expected error response, got: ' + JSON.stringify(body))
    }
    if (type && body.error.type !== type) {
      throw new Error(
        `Expected error type "${type}", got "${body.error.type}"`
      )
    }
    return body.error
  }
}

// Mock data generators
export const mockData = {
  user: (overrides?: Partial<any>) => ({
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    name: 'Test User',
    role: 'USER',
    createdAt: new Date().toISOString(),
    ...overrides
  }),

  patient: (overrides?: Partial<any>) => ({
    id: '123e4567-e89b-12d3-a456-426614174001',
    name: 'Test Patient',
    dateOfBirth: '2000-01-01',
    gender: 'MALE',
    parentName: 'Test Parent',
    parentEmail: 'parent@example.com',
    parentPhone: '+1234567890',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    ...overrides
  }),

  therapist: (overrides?: Partial<any>) => ({
    id: '123e4567-e89b-12d3-a456-426614174002',
    userId: '123e4567-e89b-12d3-a456-426614174000',
    specialization: 'Occupational Therapy',
    licenseNumber: 'OT-12345',
    yearsOfExperience: 5,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    ...overrides
  }),

  session: (overrides?: Partial<any>) => ({
    id: '123e4567-e89b-12d3-a456-426614174003',
    patientId: '123e4567-e89b-12d3-a456-426614174001',
    therapistId: '123e4567-e89b-12d3-a456-426614174002',
    scheduledDate: new Date().toISOString(),
    scheduledTime: '10:00',
    duration: 60,
    status: 'SCHEDULED',
    createdAt: new Date().toISOString(),
    ...overrides
  }),

  proposal: (overrides?: Partial<any>) => ({
    id: '123e4567-e89b-12d3-a456-426614174004',
    patientId: '123e4567-e89b-12d3-a456-426614174001',
    status: 'PENDING',
    totalCost: 5000,
    totalSessions: 24,
    createdAt: new Date().toISOString(),
    ...overrides
  })
}

// API test helpers
export const apiTestHelpers = {
  /**
   * Create a mock authenticated request
   */
  createAuthRequest(path: string, method: string = 'GET', body?: any): NextRequest {
    const builder = new TestRequestBuilder(path)
      .setMethod(method)
      .setAuth('mock-token')

    if (body) {
      builder.setBody(body)
    }

    return builder.build()
  },

  /**
   * Create a mock unauthenticated request
   */
  createUnauthRequest(path: string, method: string = 'GET', body?: any): NextRequest {
    const builder = new TestRequestBuilder(path).setMethod(method)

    if (body) {
      builder.setBody(body)
    }

    return builder.build()
  },

  /**
   * Validate API response
   */
  validateResponse(response: Response): TestResponseValidator {
    return new TestResponseValidator(response)
  },

  /**
   * Extract pagination from response
   */
  async extractPagination(response: Response): Promise<{
    page: number
    limit: number
    total: number
    pages: number
  }> {
    const body = await response.json()
    return body.pagination
  },

  /**
   * Extract data array from response
   */
  async extractData<T = any>(response: Response, key: string = 'data'): Promise<T[]> {
    const body = await response.json()
    return body[key]
  }
}

// Performance testing utilities
export class PerformanceTester {
  private samples: number[] = []

  async measure(fn: () => Promise<any>): Promise<number> {
    const start = performance.now()
    await fn()
    const duration = performance.now() - start
    this.samples.push(duration)
    return duration
  }

  async measureMultiple(fn: () => Promise<any>, iterations: number): Promise<void> {
    for (let i = 0; i < iterations; i++) {
      await this.measure(fn)
    }
  }

  getStats() {
    if (this.samples.length === 0) {
      return null
    }

    const sorted = [...this.samples].sort((a, b) => a - b)
    const sum = sorted.reduce((a, b) => a + b, 0)

    return {
      count: sorted.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: sum / sorted.length,
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)]
    }
  }

  reset(): void {
    this.samples = []
  }
}

// Validation helpers
export const validationHelpers = {
  /**
   * Validate UUID format
   */
  isUUID(value: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    return uuidRegex.test(value)
  },

  /**
   * Validate email format
   */
  isEmail(value: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(value)
  },

  /**
   * Validate ISO date format
   */
  isISODate(value: string): boolean {
    const date = new Date(value)
    return !isNaN(date.getTime()) && value === date.toISOString()
  },

  /**
   * Validate time format (HH:mm)
   */
  isTimeFormat(value: string): boolean {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    return timeRegex.test(value)
  },

  /**
   * Validate phone number format
   */
  isPhoneNumber(value: string): boolean {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/
    return phoneRegex.test(value.replace(/[\s-()]/g, ''))
  }
}

// Example usage in tests
export const exampleTests = {
  /**
   * Example: Test GET endpoint
   */
  async testGetEndpoint() {
    const request = new TestRequestBuilder('/api/user')
      .setMethod('GET')
      .setAuth('test-token')
      .build()

    // Call your API handler
    // const response = await GET(request)

    // Validate response
    // await apiTestHelpers.validateResponse(response)
    //   .expectOk()
    //   .expectJson()
  },

  /**
   * Example: Test POST endpoint
   */
  async testPostEndpoint() {
    const request = new TestRequestBuilder('/api/patients')
      .setMethod('POST')
      .setAuth('test-token')
      .setBody({
        name: 'Test Patient',
        dateOfBirth: '2000-01-01',
        gender: 'MALE'
      })
      .build()

    // Call your API handler
    // const response = await POST(request)

    // Validate response
    // await apiTestHelpers.validateResponse(response)
    //   .expectCreated()
    //   .expectBodyContains('patient')
  },

  /**
   * Example: Test error handling
   */
  async testErrorHandling() {
    const request = new TestRequestBuilder('/api/patients/invalid-id')
      .setMethod('GET')
      .setAuth('test-token')
      .build()

    // Call your API handler
    // const response = await GET(request)

    // Validate error response
    // const error = await apiTestHelpers.validateResponse(response)
    //   .expectNotFound()
    //   .expectError('NOT_FOUND_ERROR')

    // console.log('Error:', error)
  },

  /**
   * Example: Test performance
   */
  async testPerformance() {
    const tester = new PerformanceTester()

    // Measure API calls
    await tester.measureMultiple(async () => {
      const request = new TestRequestBuilder('/api/user')
        .setAuth('test-token')
        .build()
      
      // await GET(request)
    }, 100)

    const stats = tester.getStats()
    console.log('Performance stats:', stats)

    // Assert performance requirements
    if (stats && stats.p95 > 1000) {
      throw new Error(`P95 latency too high: ${stats.p95}ms`)
    }
  }
}
