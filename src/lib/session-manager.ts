import { db } from '@/lib/db'
import { DeviceInfo, getLocationFromIP } from '@/lib/device-detection'

export interface CreateSessionData {
  profileId: string
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
  lastActivityAt: Date
  device: string | null
  browser: string | null
  os: string | null
  ipAddress: string | null
  country: string | null
  city: string | null
  userAgent: string | null
}

export class SessionManager {
  static async createSession(data: CreateSessionData): Promise<SessionWithDevice> {
    const { profileId, token, expiresAt, deviceInfo } = data
    
    // Get location data if IP is available
    const locationData = deviceInfo.ipAddress 
      ? await getLocationFromIP()
      : {}

    const session = await db.session.create({
      data: {
        profileId,
        token,
        expiresAt,
        device: deviceInfo.deviceName || deviceInfo.deviceType || null,
        browser: deviceInfo.browser || null,
        os: deviceInfo.os || null,
        ipAddress: deviceInfo.ipAddress || null,
        userAgent: deviceInfo.userAgent || null,
        country: locationData.country || null,
        city: locationData.city || null,
        lastActivityAt: new Date(),
      },
    })

    return session as SessionWithDevice
  }

  static async updateSessionActivity(sessionId: string): Promise<void> {
    await db.session.update({
      where: { id: sessionId },
      data: {
        lastActivityAt: new Date(),
      },
    })
  }

  static async deactivateSession(sessionId: string): Promise<void> {
    await db.session.delete({
      where: { id: sessionId },
    })
  }

  static async getUserSessions(profileId: string): Promise<SessionWithDevice[]> {
    const sessions = await db.session.findMany({
      where: {
        profileId,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        lastActivityAt: 'desc',
      },
    })
    return sessions as SessionWithDevice[]
  }

  static async revokeSession(sessionId: string, profileId: string): Promise<void> {
    await db.session.deleteMany({
      where: { 
        id: sessionId,
        profileId, // Ensure user can only revoke their own sessions
      },
    })
  }

  static async revokeAllUserSessions(profileId: string, exceptSessionId?: string): Promise<number> {
    const where = {
      profileId,
      ...(exceptSessionId && { id: { not: exceptSessionId } }),
    }

    const result = await db.session.deleteMany({
      where,
    })

    return result.count
  }

  static async cleanExpiredSessions(): Promise<number> {
    const result = await db.session.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { 
            lastActivityAt: { 
              lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days
            } 
          },
        ],
      },
    })

    return result.count
  }

  static async getSessionStats(profileId: string) {
    const totalSessions = await db.session.count({
      where: { profileId },
    })

    const activeSessions = await db.session.count({
      where: { 
        profileId,
        expiresAt: { gt: new Date() },
      },
    })

    const browserStats = await db.session.groupBy({
      by: ['browser'],
      where: {
        profileId,
        expiresAt: { gt: new Date() },
      },
      _count: {
        browser: true,
      },
    })

    const locationStats = await db.session.groupBy({
      by: ['country', 'city'],
      where: {
        profileId,
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
      browserBreakdown: browserStats.reduce((acc, stat) => {
        acc[stat.browser || 'unknown'] = stat._count.browser || 0
        return acc
      }, {} as Record<string, number>),
      locationBreakdown: locationStats.map(stat => ({
        location: `${stat.city || 'Unknown'}, ${stat.country || 'Unknown'}`,
        count: stat._count.country || 0,
      })),
    }
  }
}