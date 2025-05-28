"use client"

import { Inbox } from "@novu/nextjs"
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
            throw new Error(`Failed to fetch subscriber hash: ${response.status}`)
        }

        const data = await response.json()
        return data.subscriberHash
    } catch (error) {
        console.log(error);
        return null
    }
}

export function NovuNotifications() {
    const [mounted, setMounted] = useState(false)
    const [subscriberHash, setSubscriberHash] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const subscriberId = USER.id || ""
    const applicationIdentifier = NOTIFICATIONS.applicationId

    const appearance = {
        variables: {
            borderRadius: "8px",
            fontSize: "14px",
            colorShadow: "rgba(0, 0, 0, 0.1)",
            colorNeutral: "#1A1523",
            colorCounterForeground: "#ffffff",
            colorCounter: "#00D0FF",
            colorSecondaryForeground: "#1A1523",
            colorSecondary: "#002A33",
            colorPrimaryForeground: "#ffffff",
            colorPrimary: "#00D0FF",
            colorForeground: "#181C25",
            colorBackground: "#ffffff",
        },
    }

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
                if (!hash) {
                    setError("Failed to retrieve subscriber hash")
                }
            } catch (err: any) {
                setError(err.message)
            } finally {
                setIsLoading(false)
            }
        }

        getSubscriberHash()
    }, [subscriberId])

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
        <div style={{ position: "static" }}>
            <Inbox
                applicationIdentifier={applicationIdentifier}
                subscriber={subscriberId}
                subscriberHash={subscriberHash}
                colorScheme="light"
                i18n={{
                    poweredBy: "Notifications by",
                }}
                appearance={appearance}
                styles={{
                    bell: {
                        root: {
                            background: "transparent",
                            color: "black",
                        },
                    },
                    popover: {
                        root: {
                            zIndex: 100,
                        },
                    },
                }}
            />
        </div>
    )
}
