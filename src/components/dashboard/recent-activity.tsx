'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

const recentActivity = [
  {
    name: 'John Doe',
    email: 'john@example.com',
    avatar: null,
    action: 'signed up',
    time: '2 minutes ago',
  },
  {
    name: 'Jane Smith',
    email: 'jane@example.com',
    avatar: null,
    action: 'updated profile',
    time: '5 minutes ago',
  },
  {
    name: 'Bob Johnson',
    email: 'bob@example.com',
    avatar: null,
    action: 'made a purchase',
    time: '10 minutes ago',
  },
  {
    name: 'Alice Brown',
    email: 'alice@example.com',
    avatar: null,
    action: 'left a review',
    time: '15 minutes ago',
  },
  {
    name: 'Charlie Davis',
    email: 'charlie@example.com',
    avatar: null,
    action: 'signed up',
    time: '20 minutes ago',
  },
]

export function RecentActivity() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>
          Latest user activities in your application
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {recentActivity.map((activity, index) => (
            <div key={index} className="flex items-center">
              <Avatar className="h-9 w-9">
                <AvatarImage src={activity.avatar || undefined} alt={activity.name} />
                <AvatarFallback>
                  {activity.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="ml-4 space-y-1">
                <p className="text-sm font-medium leading-none">
                  {activity.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {activity.action} • {activity.time}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}