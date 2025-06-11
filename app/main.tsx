'use client';

import { useEffect, useState } from "react"
import "./globals.css"
import { usePathname, useRouter } from 'next/navigation';
import MobileFooterNav from "@/components/mobile-footer-nav"
import Header from "@/components/header"

export default function Main({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    const pathname = usePathname();
    const router = useRouter();
    const [isHeaderVisible, setIsHeaderVisible] = useState(false);

    useEffect(() => {
        const PUBLIC_ROUTES = ['/login'];
        const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJvdHAiLCJ0aW1lc3RhbXAiOjE3NDk2MzY3Nzd9XSwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZW1haWwiLCJwcm92aWRlcnMiOlsiZW1haWwiXX0sImF1ZCI6ImF1dGhlbnRpY2F0ZWQiLCJjbGllbnRfaWQiOjQzOSwiZW1haWwiOiJmYXJyYWhAcmVnZW50bWFya2V0cy5jb20iLCJleHAiOjE3NDk3MjMxNzcsImlhdCI6MTc0OTYzNjc3NywiaXNfYW5vbnltb3VzIjpmYWxzZSwicGhvbmUiOiIiLCJyb2xlIjoiYXV0aGVudGljYXRlZCIsInNlc3Npb25faWQiOiJlNmZhYjhmZS1mNTdlLTQ5YzQtYTk4YS02N2FiMzU2M2ZkZTgiLCJzdWIiOiIxMTI0MmFjYy1hNzg2LTQ5MDgtYThhZC1jNTA0NDQ3Zjc0YTUiLCJ1c2VyX21ldGFkYXRhIjp7ImVtYWlsIjoiZmFycmFoQHJlZ2VudG1hcmtldHMuY29tIiwiZW1haWxfdmVyaWZpZWQiOmZhbHNlLCJwaG9uZV92ZXJpZmllZCI6ZmFsc2UsInN1YiI6IjExMjQyYWNjLWE3ODYtNDkwOC1hOGFkLWM1MDQ0NDdmNzRhNSJ9fQ.IfzmmcQWZ1zyZODVinb-q0NYdPyKfTd0IP7P7AyQCIE";
        const isPublic = PUBLIC_ROUTES.includes(pathname);

        if (!token && !isPublic) {
            setIsHeaderVisible(false);
            router.push('/login');
        }

        if (token) {
            setIsHeaderVisible(true);
            router.push(pathname);
        }
    }, [pathname]);


    return (
        <div className="container mx-auto flex flex-col h-screen overflow-hidden">
            {isHeaderVisible && <Header className="flex-shrink-0" />}
            <main className="flex-1 overflow-hidden">{children}</main>
            <MobileFooterNav className="flex-shrink-0 md:hidden" />
        </div>
    )
}
