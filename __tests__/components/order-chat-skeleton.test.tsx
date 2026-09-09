import { render, screen } from "@testing-library/react"
import OrderChatSkeleton from "@/components/order-chat-skeleton"

describe("OrderChatSkeleton", () => {
  it("renders the skeleton structure", () => {
    const { container } = render(<OrderChatSkeleton />)
    
    // Check main container exists
    expect(container.firstChild).toHaveClass("flex", "flex-col", "h-full", "overflow-auto")
  })

  it("renders header skeleton with avatar and text placeholders", () => {
    const { container } = render(<OrderChatSkeleton />)
    
    // Header should exist
    const header = container.querySelector(".border-b")
    expect(header).toBeInTheDocument()
    
    // Avatar skeleton - check for Skeleton component
    const avatar = container.querySelector(".w-10.h-10.rounded-full")
    expect(avatar).toHaveAttribute("data-slot", "skeleton")
    
    // Text placeholders in header - check for Skeleton components
    const skeletons = container.querySelectorAll('[data-slot="skeleton"]')
    expect(skeletons.length).toBeGreaterThanOrEqual(2)
  })

  it("renders disclaimer section skeleton", () => {
    const { container } = render(<OrderChatSkeleton />)
    
    const disclaimer = container.querySelector(".rounded-\\[16px\\].h-\\[120px\\]")
    expect(disclaimer).toHaveAttribute("data-slot", "skeleton")
  })

  it("renders multiple message skeletons", () => {
    const { container } = render(<OrderChatSkeleton />)
    
    // Should have multiple message skeletons (sent and received)
    const messageContainers = container.querySelectorAll(".justify-start, .justify-end")
    expect(messageContainers.length).toBeGreaterThanOrEqual(4)
  })

  it("renders date header skeleton", () => {
    const { container } = render(<OrderChatSkeleton />)
    
    const dateHeader = container.querySelector(".rounded-full.h-6.w-32")
    expect(dateHeader).toHaveAttribute("data-slot", "skeleton")
  })

  it("renders input section skeleton", () => {
    const { container } = render(<OrderChatSkeleton />)
    
    // Input field skeleton
    const input = container.querySelector(".h-14.w-full")
    expect(input).toHaveAttribute("data-slot", "skeleton")
    
    // Character count skeleton
    const charCount = container.querySelector(".h-3.w-12")
    expect(charCount).toHaveAttribute("data-slot", "skeleton")
  })

  it("applies correct styling to sent vs received message skeletons", () => {
    const { container } = render(<OrderChatSkeleton />)
    
    const sentMessage = container.querySelector(".justify-end")
    const receivedMessage = container.querySelector(".justify-start")
    
    expect(sentMessage).toBeInTheDocument()
    expect(receivedMessage).toBeInTheDocument()
  })

  it("renders with correct border and background styling", () => {
    const { container } = render(<OrderChatSkeleton />)
    
    // Header border
    const header = container.querySelector(".border-b")
    expect(header).toBeInTheDocument()
    
    // Footer background
    const footer = container.querySelector(".bg-slate-75")
    expect(footer).toBeInTheDocument()
  })

  it("uses Skeleton component for all placeholder elements", () => {
    const { container } = render(<OrderChatSkeleton />)
    
    const skeletons = container.querySelectorAll('[data-slot="skeleton"]')
    // Should have header (3), disclaimer (1), date (1), messages (8), input (2) = at least 15
    expect(skeletons.length).toBeGreaterThanOrEqual(15)
  })
})
