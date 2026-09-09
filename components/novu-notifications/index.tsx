"use client"

import dynamic from "next/dynamic"

// @novu/js accesses `window` at module-init time, crashing SSR.
// Dynamic import with ssr:false ensures the module is never evaluated on the server.
export const NovuNotifications = dynamic(() => import("./novu-inner"), { ssr: false })
export const NovuBellLink = dynamic(() => import("./novu-bell-link-inner"), { ssr: false })
