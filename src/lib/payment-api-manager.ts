export interface PaymentRequest {
  patientId: string
  therapistId: string
  consultationRequestId?: string
  paymentPlanId?: string
  amount: number
  paymentMethod: string
  paymentType: string
  description?: string
  reference?: string
  metadata?: Record<string, any>
  dueDate?: Date
  autoProcess?: boolean
}

export interface Payment {
  id: string
  patientId: string
  therapistId: string
  amount: number
  status: string
  paymentMethod: string
  paymentType: string
  createdAt: Date
  updatedAt: Date
}

export class PaymentApiManager {
  static async createPayment(paymentRequest: PaymentRequest): Promise<Payment> {
    // Mock implementation - replace with actual database operations
    return {
      id: `payment_${Date.now()}`,
      patientId: paymentRequest.patientId,
      therapistId: paymentRequest.therapistId,
      amount: paymentRequest.amount,
      status: 'PENDING',
      paymentMethod: paymentRequest.paymentMethod,
      paymentType: paymentRequest.paymentType,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  }
}