'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DollarSign } from 'lucide-react'

export function ParentPaymentView({ patientId }: { patientId: string }) {
  const [payments, setPayments] = useState<any[]>([])

  useEffect(() => {
    fetch(`/api/payments?patientId=${patientId}`)
      .then(res => res.json())
      .then(data => setPayments(data.data || []))
  }, [patientId])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <DollarSign className="h-5 w-5 mr-2" />
          Payment History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {payments.map((payment) => (
            <div key={payment.id} className="border rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">${payment.amount?.toFixed(2)}</div>
                  <div className="text-sm text-muted-foreground">{payment.paymentMethod}</div>
                </div>
                <Badge>{payment.status}</Badge>
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                {new Date(payment.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
