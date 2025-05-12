"use client"

import { NovuProvider, PopoverNotificationCenter, NotificationBell } from "@novu/notification-center"
import { useEffect, useState } from "react"
import { USER, NOTIFICATIONS } from "@/lib/local-variables"

// Function to fetch the subscriber hash
async function fetchSubscriberHash(subscriberId: string) {
    try {
        const url = `${NOTIFICATIONS.subscriberHashUrl}/${subscriberId}/hash`

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
        })

        if (!response.ok) {
            console.error("Failed to fetch subscriber hash:", response.statusText);
            throw new Error(`Failed to fetch subscriber hash: ${response.status}`)
        }

        const data = await response.json()
        console.log("Subscriber hash data:", data);
        return data.subscriberHash
    } catch (error) {
        return null
    }
}

export function NovuNotifications() {
    // Use client-side rendering to avoid hydration issues
    const [mounted, setMounted] = useState(false)
    const [subscriberHash, setSubscriberHash] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Get the subscriber ID from the USER object in local-variables
    const subscriberId = USER.id || ""
    const applicationIdentifier = NOTIFICATIONS.applicationId

    useEffect(() => {
        setMounted(true)

        // Only fetch if we have a subscriber ID
        if (!subscriberId) {
            setError("No user ID available")
            setIsLoading(false)
            return
        }

        // Fetch the subscriber hash
        const getSubscriberHash = async () => {
            setIsLoading(true)
            setError(null)
            try {
                const hash = await fetchSubscriberHash(subscriberId)
                setSubscriberHash(hash)
            } catch (err) {
                setError(err.message)
            } finally {
                setIsLoading(false)
            }
        }

        getSubscriberHash()
    }, [subscriberId])

    // Return a placeholder while loading or not mounted
    if (!mounted || isLoading) {
        return (
            <div className="relative inline-flex h-5 w-5 bg-yellow-100 rounded-full">
                <span className="sr-only">Notifications loading</span>
            </div>
        )
    }

    if (error || !subscriberHash) {
        return (
            <div
                className="relative inline-flex h-5 w-5 bg-red-100 rounded-full"
                title={error || "Failed to load notifications"}
            >
                <span className="sr-only">Notifications error</span>
            </div>
        )
    }

    return (
        <NovuProvider
            subscriberId={subscriberId}
            applicationIdentifier={applicationIdentifier}
            subscriberHash={subscriberHash}
        >
            <PopoverNotificationCenter>
                {({ unseenCount }) => (
                    <NotificationBell
                        unseenCount={unseenCount}
                        colorScheme="light"
                        className="text-black"
                        bellButtonProps={{
                            style: {
                                background: "transparent",
                                color: "black",
                            },
                        }}
                    />
                )}
            </PopoverNotificationCenter>
        </NovuProvider>
    )
}
