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
        const token = localStorage.getItem('auth_token');
        const isPublic = PUBLIC_ROUTES.includes(pathname);

        if (!token && !isPublic) {
            setIsHeaderVisible(false);
            router.push('/login');
        }

        if (token) {
            setIsHeaderVisible(true);
            router.push('/');
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
