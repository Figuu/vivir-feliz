import { NextRequest } from 'next/server'

export interface DeviceInfo {
  deviceType: string
  deviceName: string
  browser: string
  browserVersion: string
  os: string
  osVersion: string
  ipAddress: string
}

export function parseUserAgent(userAgent: string): Partial<DeviceInfo> {
  if (!userAgent) {
    return {}
  }

  const ua = userAgent.toLowerCase()
  
  // Detect device type
  let deviceType = 'desktop'
  if (/mobile|android|iphone/.test(ua)) {
    deviceType = 'mobile'
  } else if (/tablet|ipad/.test(ua)) {
    deviceType = 'tablet'
  }

  // Detect browser
  let browser = 'unknown'
  let browserVersion = 'unknown'
  
  if (ua.includes('chrome/') && !ua.includes('edg/')) {
    browser = 'Chrome'
    const match = ua.match(/chrome\/(\d+)/)
    browserVersion = match ? match[1] : 'unknown'
  } else if (ua.includes('firefox/')) {
    browser = 'Firefox'
    const match = ua.match(/firefox\/(\d+)/)
    browserVersion = match ? match[1] : 'unknown'
  } else if (ua.includes('safari/') && !ua.includes('chrome/')) {
    browser = 'Safari'
    const match = ua.match(/version\/(\d+)/)
    browserVersion = match ? match[1] : 'unknown'
  } else if (ua.includes('edg/')) {
    browser = 'Edge'
    const match = ua.match(/edg\/(\d+)/)
    browserVersion = match ? match[1] : 'unknown'
  }

  // Detect OS
  let os = 'unknown'
  let osVersion = 'unknown'
  
  if (ua.includes('windows')) {
    os = 'Windows'
    if (ua.includes('windows nt 10')) osVersion = '10'
    else if (ua.includes('windows nt 6.3')) osVersion = '8.1'
    else if (ua.includes('windows nt 6.2')) osVersion = '8'
    else if (ua.includes('windows nt 6.1')) osVersion = '7'
  } else if (ua.includes('mac os x')) {
    os = 'macOS'
    const match = ua.match(/mac os x (\d+[._]\d+)/)
    if (match) {
      osVersion = match[1].replace('_', '.')
    }
  } else if (ua.includes('linux')) {
    os = 'Linux'
  } else if (ua.includes('android')) {
    os = 'Android'
    const match = ua.match(/android (\d+(?:\.\d+)?)/)
    osVersion = match ? match[1] : 'unknown'
  } else if (ua.includes('iphone') || ua.includes('ipad')) {
    os = ua.includes('ipad') ? 'iPadOS' : 'iOS'
    const match = ua.match(/os (\d+[._]\d+)/)
    if (match) {
      osVersion = match[1].replace('_', '.')
    }
  }

  // Generate device name
  const deviceName = `${os} ${osVersion} - ${browser} ${browserVersion}`

  return {
    deviceType,
    deviceName,
    browser,
    browserVersion,
    os,
    osVersion,
  }
}

export function getClientIP(request: NextRequest): string {
  // Try various headers that might contain the real IP
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const cfConnectingIP = request.headers.get('cf-connecting-ip')
  
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, get the first one
    return forwarded.split(',')[0].trim()
  }
  
  if (realIP) {
    return realIP
  }
  
  if (cfConnectingIP) {
    return cfConnectingIP
  }
  
  // Fallback to unknown if no headers found
  return 'unknown'
}

export async function getLocationFromIP(): Promise<{ country?: string; city?: string }> {
  // In a production app, you would use a service like:
  // - ipapi.co
  // - ip-api.com  
  // - MaxMind GeoIP
  // - CloudFlare's IP geolocation
  
  // For now, return empty object
  // You can implement this based on your preferred IP geolocation service
  return {}
}

export function getDeviceInfo(request: NextRequest): Partial<DeviceInfo> {
  const userAgent = request.headers.get('user-agent') || ''
  const ipAddress = getClientIP(request)
  
  const deviceInfo = parseUserAgent(userAgent)
  
  return {
    ...deviceInfo,
    ipAddress,
  }
}