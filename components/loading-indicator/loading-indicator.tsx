"use client"

export default function LoadingIndicator() {
  return (
    <div className="flex items-center justify-center">
      <div className="w-16 h-16 rounded-full bg-white shadow-[0_4px_12px_rgba(0,0,0,0.10)] flex items-center justify-center">
        <div className="relative w-[38px] h-[38px]">
          <div className="absolute inset-0 rounded-full border-[3px] border-primary/20 border-t-primary animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <svg width="16" height="20" viewBox="0 0 10 13" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7.54649 0.394263L6.90159 4.05014H4.66298C2.5745 4.05014 0.583841 5.74157 0.214885 7.82925L0.0587173 8.71784C-0.30852 10.8055 1.08493 12.497 3.17342 12.497H5.04052C6.56269 12.497 8.01278 11.2653 8.28049 9.74371L10 0L7.54649 0.394263ZM5.95807 9.39888C5.8757 9.86891 5.45237 10.2515 4.98217 10.2515H3.84784C2.90914 10.2515 2.28106 9.48978 2.44579 8.54973L2.54361 7.99565C2.71007 7.0573 3.60587 6.29393 4.54457 6.29393H6.50578L5.95807 9.39888Z" className="fill-primary" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}
