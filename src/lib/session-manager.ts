import { db } from '@/lib/db'
import { DeviceInfo, getLocationFromIP } from '@/lib/device-detection'

export interface CreateSessionData {
  userId: string
  token: string
  expiresAt: Date
  deviceInfo: Partial<DeviceInfo>
  loginMethod?: string
}

export interface SessionWithDevice {
  id: string
  token: string
  expiresAt: Date
  createdAt: Date
  updatedAt: Date
  lastActivity: Date
  isActive: boolean
  deviceType: string | null
  deviceName: string | null
  browser: string | null
  browserVersion: string | null
  os: string | null
  osVersion: string | null
  ipAddress: string | null
  country: string | null
  city: string | null
  loginMethod: string | null
}

export class SessionManager {
  static async createSession(data: CreateSessionData): Promise<SessionWithDevice> {
    const { userId, token, expiresAt, deviceInfo, loginMethod } = data
    
    // Get location data if IP is available
    const locationData = deviceInfo.ipAddress 
      ? await getLocationFromIP()
      : {}

    const session = await db.session.create({
      data: {
        userId,
        token,
        expiresAt,
        deviceType: deviceInfo.deviceType,
        deviceName: deviceInfo.deviceName,
        browser: deviceInfo.browser,
        browserVersion: deviceInfo.browserVersion,
        os: deviceInfo.os,
        osVersion: deviceInfo.osVersion,
        ipAddress: deviceInfo.ipAddress,
        country: locationData.country,
        city: locationData.city,
        loginMethod: loginMethod || 'email',
        isActive: true,
        lastActivity: new Date(),
      },
    })

    return session
  }

  static async updateSessionActivity(sessionId: string): Promise<void> {
    await db.session.update({
      where: { id: sessionId },
      data: {
        lastActivity: new Date(),
        isActive: true,
      },
    })
  }

  static async deactivateSession(sessionId: string): Promise<void> {
    await db.session.update({
      where: { id: sessionId },
      data: {
        isActive: false,
      },
    })
  }

  static async getUserSessions(userId: string): Promise<SessionWithDevice[]> {
    return db.session.findMany({
      where: {
        userId,
        isActive: true,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        lastActivity: 'desc',
      },
    })
  }

  static async revokeSession(sessionId: string, userId: string): Promise<void> {
    await db.session.update({
      where: { 
        id: sessionId,
        userId, // Ensure user can only revoke their own sessions
      },
      data: {
        isActive: false,
      },
    })
  }

  static async revokeAllUserSessions(userId: string, exceptSessionId?: string): Promise<number> {
    const where = {
      userId,
      isActive: true,
      ...(exceptSessionId && { id: { not: exceptSessionId } }),
    }

    const result = await db.session.updateMany({
      where,
      data: {
        isActive: false,
      },
    })

    return result.count
  }

  static async cleanExpiredSessions(): Promise<number> {
    const result = await db.session.updateMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { 
            lastActivity: { 
              lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days
            } 
          },
        ],
      },
      data: {
        isActive: false,
      },
    })

    return result.count
  }

  static async getSessionStats(userId: string) {
    const totalSessions = await db.session.count({
      where: { userId },
    })

    const activeSessions = await db.session.count({
      where: { 
        userId,
        isActive: true,
        expiresAt: { gt: new Date() },
      },
    })

    const deviceStats = await db.session.groupBy({
      by: ['deviceType'],
      where: {
        userId,
        isActive: true,
        expiresAt: { gt: new Date() },
      },
      _count: {
        deviceType: true,
      },
    })

    const browserStats = await db.session.groupBy({
      by: ['browser'],
      where: {
        userId,
        isActive: true,
        expiresAt: { gt: new Date() },
      },
      _count: {
        browser: true,
      },
    })

    const locationStats = await db.session.groupBy({
      by: ['country', 'city'],
      where: {
        userId,
        isActive: true,
        expiresAt: { gt: new Date() },
        country: { not: null },
      },
      _count: {
        country: true,
      },
    })

    return {
      totalSessions,
      activeSessions,
      deviceBreakdown: deviceStats.reduce((acc, stat) => {
        acc[stat.deviceType || 'unknown'] = stat._count.deviceType
        return acc
      }, {} as Record<string, number>),
      browserBreakdown: browserStats.reduce((acc, stat) => {
        acc[stat.browser || 'unknown'] = stat._count.browser
        return acc
      }, {} as Record<string, number>),
      locationBreakdown: locationStats.map(stat => ({
        location: `${stat.city || 'Unknown'}, ${stat.country || 'Unknown'}`,
        count: stat._count.country,
      })),
    }
  }
}