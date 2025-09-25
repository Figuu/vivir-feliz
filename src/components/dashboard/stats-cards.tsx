'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Activity, CreditCard, TrendingUp } from 'lucide-react'

export function StatsCards() {
  const stats = [
    {
      title: 'Total Users',
      value: '2,350',
      description: '+20.1% from last month',
      icon: Users,
      trend: 'up',
    },
    {
      title: 'Active Users',
      value: '1,890',
      description: '+12% from last month',
      icon: Activity,
      trend: 'up',
    },
    {
      title: 'Revenue',
      value: '$45,231.89',
      description: '+8% from last month',
      icon: CreditCard,
      trend: 'up',
    },
    {
      title: 'Growth',
      value: '+12.5%',
      description: '+4% from last month',
      icon: TrendingUp,
      trend: 'up',
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">
              {stat.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}