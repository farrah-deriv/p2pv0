interface KycOnboardingGradientProps {
  variant: "desktop" | "mobile"
}

/**
 * Recreates the Figma onboarding hero gradient.
 *
 * Mobile uses the same SVG paths, colors, and transform as the Flutter hero.
 * Desktop keeps the wider CSS blob treatment used for the large modal panel,
 * anchored to the bottom-right like the Figma frame.
 *
 * Colors map to Quill tokens: red1200 → onboarding-gradient-dark-red,
 * coral800 → onboarding-gradient-medium-red, coral200 → onboarding-gradient-light-red-mobile.
 */
export function KycOnboardingGradient({ variant }: KycOnboardingGradientProps) {
  const isDesktop = variant === "desktop"

  if (!isDesktop) {
    return (
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 390 220"
        preserveAspectRatio="none"
      >
        <defs>
          <filter id="kyc-mobile-gradient-dark" x="-120" y="-120" width="920" height="560" filterUnits="userSpaceOnUse">
            <feGaussianBlur stdDeviation="35" />
          </filter>
          <filter id="kyc-mobile-gradient-mid" x="-120" y="-120" width="920" height="560" filterUnits="userSpaceOnUse">
            <feGaussianBlur stdDeviation="26" />
          </filter>
          <filter id="kyc-mobile-gradient-light" x="-120" y="-120" width="920" height="560" filterUnits="userSpaceOnUse">
            <feGaussianBlur stdDeviation="24" />
          </filter>
        </defs>
        <g transform="matrix(0.88335 0.30432 -0.43383 1.25986 -18.215 -34.008)">
          <path
            className="fill-onboarding-gradient-dark-red"
            d="M609.383 110.615C602.378 157.491 612.053 132.199 612.053 132.199L615.48 145.669L202.858 180.642L71.6207 186.144L86.0705 104.143L153.854 86.3031L259.042 106.699C259.042 106.699 298.566 134.431 377.028 124.075C455.49 113.718 408.584 85.4545 457.51 68.7141C506.436 51.9738 616.388 63.7386 609.383 110.615Z"
            filter="url(#kyc-mobile-gradient-dark)"
          />
          <path
            className="fill-onboarding-gradient-medium-red"
            d="M611.832 133.401C603.876 180.352 614.361 154.996 614.361 154.996L617.788 168.467L183.998 205.109L46.1 211.137L62.3232 128.995L133.739 110.869L220.733 126.353C220.733 126.353 283.727 147.835 366.261 137.157C448.796 126.479 401.271 109.011 452.868 92.0596C504.465 75.1085 619.788 86.4497 611.832 133.401Z"
            filter="url(#kyc-mobile-gradient-mid)"
          />
          <path
            className="fill-onboarding-gradient-light-red-mobile"
            d="M266.016 165.654C266.016 165.654 305.54 193.386 384.002 183.029C462.464 172.672 419.011 161.008 467.937 144.268C516.853 127.531 580.752 147.936 622.447 204.624L209.831 239.596L78.5947 245.099L93.0445 163.097L160.828 145.258L266.016 165.654Z"
            filter="url(#kyc-mobile-gradient-light)"
          />
        </g>
      </svg>
    )
  }

  return (
    <>
      {/* Dark red — largest, farthest off-screen */}
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-56 -right-28 h-72 w-[34rem] rounded-full bg-onboarding-gradient-dark-red opacity-70 blur-[80px]"
      />
      {/* Mid red */}
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-48 -right-10 h-64 w-[30rem] rounded-full bg-onboarding-gradient-medium-red opacity-65 blur-[72px]"
      />
      {/* Light pink — smallest, closest to visible edge */}
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 right-8 h-52 w-80 rounded-full bg-onboarding-gradient-light-red-desktop opacity-50 blur-[60px]"
      />
    </>
  )
}
