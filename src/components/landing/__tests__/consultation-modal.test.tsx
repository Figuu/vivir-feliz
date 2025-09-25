import { render, screen, fireEvent } from '@testing-library/react'
import { ConsultationModal } from '../consultation-modal'

// Mock the config module
jest.mock('@/lib/config', () => ({
  therapyConfig: {
    defaultConsultationPrice: 100,
    defaultConsultationDuration: 60,
    defaultInterviewDuration: 45,
  },
}))

describe('ConsultationModal', () => {
  it('renders the modal trigger button', () => {
    render(
      <ConsultationModal>
        <button>Open Modal</button>
      </ConsultationModal>
    )
    
    expect(screen.getByText('Open Modal')).toBeInTheDocument()
  })

  it('opens modal when trigger is clicked', () => {
    render(
      <ConsultationModal>
        <button>Open Modal</button>
      </ConsultationModal>
    )
    
    fireEvent.click(screen.getByText('Open Modal'))
    
    expect(screen.getByText('Choose Your Consultation Type')).toBeInTheDocument()
  })

  it('displays both consultation and interview options', () => {
    render(
      <ConsultationModal>
        <button>Open Modal</button>
      </ConsultationModal>
    )
    
    fireEvent.click(screen.getByText('Open Modal'))
    
    expect(screen.getByText('Professional Consultation')).toBeInTheDocument()
    expect(screen.getByText('Free Interview')).toBeInTheDocument()
  })

  it('shows correct pricing information', () => {
    render(
      <ConsultationModal>
        <button>Open Modal</button>
      </ConsultationModal>
    )
    
    fireEvent.click(screen.getByText('Open Modal'))
    
    expect(screen.getByText('$100')).toBeInTheDocument()
    expect(screen.getByText('Free')).toBeInTheDocument()
  })

  it('shows correct duration information', () => {
    render(
      <ConsultationModal>
        <button>Open Modal</button>
      </ConsultationModal>
    )
    
    fireEvent.click(screen.getByText('Open Modal'))
    
    expect(screen.getByText('60 min')).toBeInTheDocument()
    expect(screen.getByText('45 min')).toBeInTheDocument()
  })
})
