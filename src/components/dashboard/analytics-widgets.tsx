"use client"

import * as React from "react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from "recharts"
import { TrendingUp, TrendingDown, Users, Eye, UserPlus, Activity } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

// Sample data - in a real app, this would come from your API
const userGrowthData = [
  { month: "Jan", users: 400, newUsers: 45 },
  { month: "Feb", users: 430, newUsers: 50 },
  { month: "Mar", users: 448, newUsers: 48 },
  { month: "Apr", users: 470, newUsers: 52 },
  { month: "May", users: 540, newUsers: 70 },
  { month: "Jun", users: 580, newUsers: 68 },
]

const revenueData = [
  { month: "Jan", revenue: 4000, expenses: 2400 },
  { month: "Feb", revenue: 3000, expenses: 1398 },
  { month: "Mar", revenue: 2000, expenses: 9800 },
  { month: "Apr", revenue: 2780, expenses: 3908 },
  { month: "May", revenue: 1890, expenses: 4800 },
  { month: "Jun", revenue: 2390, expenses: 3800 },
]

const userDistributionData = [
  { name: "Admin", value: 12, color: "#ef4444" },
  { name: "User", value: 485, color: "#3b82f6" },
  { name: "Super Admin", value: 3, color: "#f59e0b" },
]

const activityData = [
  { time: "00:00", active: 12 },
  { time: "04:00", active: 8 },
  { time: "08:00", active: 42 },
  { time: "12:00", active: 85 },
  { time: "16:00", active: 67 },
  { time: "20:00", active: 24 },
]

interface KPICardProps {
  title: string
  value: string | number
  description: string
  icon: React.ReactNode
  trend?: {
    value: number
    direction: "up" | "down"
  }
  className?: string
}

function KPICard({ title, value, description, icon, trend, className }: KPICardProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center space-x-2">
          <p className="text-xs text-muted-foreground">{description}</p>
          {trend && (
            <Badge
              variant={trend.direction === "up" ? "default" : "destructive"}
              className="text-xs"
            >
              {trend.direction === "up" ? (
                <TrendingUp className="h-3 w-3 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1" />
              )}
              {Math.abs(trend.value)}%
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function AnalyticsKPICards() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <KPICard
        title="Total Users"
        value="580"
        description="Active users in system"
        icon={<Users className="h-4 w-4 text-muted-foreground" />}
        trend={{ value: 12, direction: "up" }}
      />
      <KPICard
        title="New Signups"
        value="68"
        description="This month"
        icon={<UserPlus className="h-4 w-4 text-muted-foreground" />}
        trend={{ value: 5, direction: "down" }}
      />
      <KPICard
        title="Page Views"
        value="12,453"
        description="Last 30 days"
        icon={<Eye className="h-4 w-4 text-muted-foreground" />}
        trend={{ value: 18, direction: "up" }}
      />
      <KPICard
        title="Active Sessions"
        value="42"
        description="Currently online"
        icon={<Activity className="h-4 w-4 text-muted-foreground" />}
      />
    </div>
  )
}

export function UserGrowthChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>User Growth</CardTitle>
        <CardDescription>
          Monthly active users and new registrations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={userGrowthData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="users"
              stroke="#3b82f6"
              strokeWidth={2}
              name="Total Users"
            />
            <Line
              type="monotone"
              dataKey="newUsers"
              stroke="#10b981"
              strokeWidth={2}
              name="New Users"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

export function RevenueChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Overview</CardTitle>
        <CardDescription>
          Monthly revenue and expenses
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" />
            <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

export function UserDistributionChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>User Distribution</CardTitle>
        <CardDescription>
          Users by role type
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={userDistributionData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {userDistributionData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

export function ActivityChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Activity</CardTitle>
        <CardDescription>
          Active users throughout the day
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={activityData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="active"
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.3}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

export function AnalyticsDashboard() {
  return (
    <div className="space-y-6">
      <AnalyticsKPICards />
      
      <div className="grid gap-6 lg:grid-cols-2">
        <UserGrowthChart />
        <RevenueChart />
      </div>
      
      <div className="grid gap-6 lg:grid-cols-3">
        <UserDistributionChart />
        <ActivityChart />
        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
            <CardDescription>
              Key metrics at a glance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Bounce Rate</span>
              <span className="text-sm text-muted-foreground">32%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Avg. Session</span>
              <span className="text-sm text-muted-foreground">2m 45s</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Conversion Rate</span>
              <span className="text-sm text-muted-foreground">3.2%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Monthly Recurring</span>
              <span className="text-sm text-muted-foreground">$12,450</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}