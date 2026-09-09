import { render, screen } from '@testing-library/react'
import { OrderDetails } from '@/components/order-details/order-details'
import type { Order } from '@/services/api/api-orders'
import { USER } from '@/lib/local-variables'

// Mock the USER constant
jest.mock('@/lib/local-variables', () => ({
  USER: { id: 'user123' }
}))

// Mock the utils
jest.mock('@/lib/utils', () => ({
  formatAmount: jest.fn((amount) => amount.toFixed(2)),
  formatDateTime: jest.fn((date) => new Date(date).toLocaleDateString())
}))

const mockOrder: Order = {
  id: 'order123',
  type: 'buy',
  amount: 1000,
  payment_amount: 50000,
  exchange_rate: 50,
  created_at: '2024-01-15T10:30:00Z',
  user: {
    id: 'buyer123',
    nickname: 'BuyerUser'
  },
  advert: {
    id: 'ad123',
    account_currency: 'USD',
    payment_currency: 'IDR',
    user: {
      id: 'seller456',
      nickname: 'SellerUser'
    }
  }
} as Order

describe('OrderDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render all order detail fields correctly', () => {
    render(<OrderDetails order={mockOrder} />)
    
    expect(screen.getByText('Order ID')).toBeInTheDocument()
    expect(screen.getByText('order123')).toBeInTheDocument()
    
    expect(screen.getByText('Exchange rate (USD 1)')).toBeInTheDocument()
    expect(screen.getByText('IDR 50.00')).toBeInTheDocument()
    
    expect(screen.getByText('You pay')).toBeInTheDocument()
    expect(screen.getByText('IDR 50000.00')).toBeInTheDocument()
    
    expect(screen.getByText('You receive')).toBeInTheDocument()
    expect(screen.getByText('USD 1000.00')).toBeInTheDocument()
    
    expect(screen.getByText('Order time')).toBeInTheDocument()
    
    expect(screen.getByText('Seller')).toBeInTheDocument()
    expect(screen.getByText('SellerUser')).toBeInTheDocument()
  })

  it('should display correct labels for sell order when user is not the advertiser', () => {
    const sellOrder = {
      ...mockOrder,
      type: 'sell' as const
    }
    
    render(<OrderDetails order={sellOrder} />)
    
    expect(screen.getByText('You receive')).toBeInTheDocument()
    expect(screen.getByText('You send')).toBeInTheDocument()
    expect(screen.getByText('Buyer')).toBeInTheDocument()
  })

  it('should display correct counterparty when user is the advertiser', () => {
    const orderWhereUserIsAdvertiser = {
      ...mockOrder,
      advert: {
        ...mockOrder.advert,
        user: {
          id: 'user123', // Same as USER.id
          nickname: 'CurrentUser'
        }
      }
    }
    
    render(<OrderDetails order={orderWhereUserIsAdvertiser} />)
    
    expect(screen.getByText('Buyer')).toBeInTheDocument()
    expect(screen.getByText('BuyerUser')).toBeInTheDocument()
  })

  it('should handle missing optional fields gracefully', () => {
    const orderWithMissingFields = {
      ...mockOrder,
      user: undefined,
      advert: {
        ...mockOrder.advert,
        account_currency: undefined,
        payment_currency: undefined
      }
    } as any
    
    render(<OrderDetails order={orderWithMissingFields} />)
    
    expect(screen.getByText('Order ID')).toBeInTheDocument()
    expect(screen.getByText('order123')).toBeInTheDocument()
  })

  it('should format exchange rate with correct decimal places', () => {
    const orderWithDecimalRate = {
      ...mockOrder,
      exchange_rate: 50.123456
    }
    
    render(<OrderDetails order={orderWithDecimalRate} />)
    
    expect(screen.getByText('IDR 50.12')).toBeInTheDocument()
  })

  it('should handle edge case where both user IDs match', () => {
    const edgeCaseOrder = {
      ...mockOrder,
      user: {
        id: 'user123',
        nickname: 'SameUser'
      },
      advert: {
        ...mockOrder.advert,
        user: {
          id: 'user123',
          nickname: 'SameUser'
        }
      }
    }
    
    render(<OrderDetails order={edgeCaseOrder} />)
    
    expect(screen.getByText('SameUser')).toBeInTheDocument()
  })

  it('should apply correct CSS classes for styling', () => {
    render(<OrderDetails order={mockOrder} />)
    
    const container = screen.getByTestId('order-details-container')
    expect(container).toHaveClass('space-y-[16px]')
    
    const labels = screen.getAllByText(/Order ID|Exchange rate|You pay|You receive|Order time|Seller/)
    labels.forEach(label => {
      if (label.tagName === 'H3') {
        expect(label).toHaveClass('text-sm', 'text-slate-500', 'mb-1')
      }
    })
  })

  it('should handle null or undefined order gracefully', () => {
    const { container } = render(<OrderDetails order={null as any} />)
    expect(container.firstChild).toBeNull()
  })
})
