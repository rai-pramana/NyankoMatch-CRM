"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuthStore, useAppStore } from "@/lib/store";
import { authApi } from "@/lib/api";

const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
    { href: "/deals", label: "Deals", icon: "monetization_on" },
    { href: "/contacts", label: "Contacts", icon: "group" },
    { href: "/activities", label: "Activities", icon: "task_alt" },
    { href: "/settings", label: "Settings", icon: "settings" },
];

const adminNavItems = [{ href: "/users", label: "Users", icon: "manage_accounts" }];

const MIN_SIDEBAR_WIDTH = 64;
const MAX_SIDEBAR_WIDTH = 400;
const COLLAPSED_WIDTH = 64;
const EXPANDED_MIN_WIDTH = 220;
const DEFAULT_EXPANDED_WIDTH = 280;
const MOBILE_BREAKPOINT = 768;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, isAuthenticated, clearAuth } = useAuthStore();
    const { sidebarOpen, setSidebarOpen } = useAppStore();
    const [isLoading, setIsLoading] = useState(true);
    const [isHydrated, setIsHydrated] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Resizable sidebar state
    const [sidebarWidth, setSidebarWidth] = useState(sidebarOpen ? DEFAULT_EXPANDED_WIDTH : COLLAPSED_WIDTH);
    const [isResizing, setIsResizing] = useState(false);
    const [savedExpandedWidth, setSavedExpandedWidth] = useState(DEFAULT_EXPANDED_WIDTH);
    const sidebarRef = useRef<HTMLElement>(null);

    // Check for mobile viewport
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
            if (window.innerWidth < MOBILE_BREAKPOINT) {
                setMobileMenuOpen(false);
            }
        };

        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    // Close mobile menu when navigating
    useEffect(() => {
        if (isMobile) {
            setMobileMenuOpen(false);
        }
    }, [pathname, isMobile]);

    // Sync sidebar width with open/closed state (only when not resizing)
    useEffect(() => {
        if (!isResizing) {
            setSidebarWidth(sidebarOpen ? savedExpandedWidth : COLLAPSED_WIDTH);
        }
    }, [sidebarOpen, isResizing, savedExpandedWidth]);

    // Handle mouse move during resize
    const handleMouseMove = useCallback(
        (e: MouseEvent) => {
            if (!isResizing) return;

            const newWidth = e.clientX;
            if (newWidth >= MIN_SIDEBAR_WIDTH && newWidth <= MAX_SIDEBAR_WIDTH) {
                setSidebarWidth(newWidth);
            }
        },
        [isResizing]
    );

    // Handle mouse up to stop resizing and save position
    const handleMouseUp = useCallback(() => {
        setIsResizing(false);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";

        // Save the final position when releasing
        if (sidebarWidth <= COLLAPSED_WIDTH + 20) {
            setSidebarOpen(false);
            setSidebarWidth(COLLAPSED_WIDTH);
        } else {
            setSidebarOpen(true);
            // Save the expanded width for future toggles
            setSavedExpandedWidth(Math.max(sidebarWidth, EXPANDED_MIN_WIDTH));
        }
    }, [sidebarWidth, setSidebarOpen]);

    // Add/remove event listeners for resize
    useEffect(() => {
        if (isResizing) {
            document.addEventListener("mousemove", handleMouseMove);
            document.addEventListener("mouseup", handleMouseUp);
            document.body.style.cursor = "col-resize";
            document.body.style.userSelect = "none";
        }

        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isResizing, handleMouseMove, handleMouseUp]);

    // Start resizing
    const startResizing = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(true);
    }, []);

    // Calculate collapsed state
    const isCollapsed = sidebarWidth <= COLLAPSED_WIDTH + 20;

    // Check if a nav item is the current page
    const isCurrentPage = (href: string) => pathname === href || pathname.startsWith(href + "/");

    // Toggle sidebar only when clicking on the current page's icon
    const handleIconClick = (e: React.MouseEvent, href: string) => {
        if (isCurrentPage(href)) {
            // Toggle sidebar when clicking current page icon
            e.preventDefault();
            if (isCollapsed) {
                setSidebarOpen(true);
                setSidebarWidth(savedExpandedWidth);
            } else {
                setSidebarOpen(false);
                setSidebarWidth(COLLAPSED_WIDTH);
            }
        }
        // If clicking a different page, just navigate (no toggle)
    };

    // Wait for Zustand to hydrate from localStorage
    useEffect(() => {
        setIsHydrated(true);
    }, []);

    useEffect(() => {
        // Only check auth after hydration is complete
        if (!isHydrated) return;

        if (!isAuthenticated) {
            router.push("/login");
        } else {
            setIsLoading(false);
        }
    }, [isAuthenticated, isHydrated, router]);

    const handleLogout = () => {
        clearAuth();
        authApi.logout();
    };

    if (!isHydrated || isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
        );
    }

    const allNavItems = user?.role === "ADMIN" ? [...navItems, ...adminNavItems] : navItems;

    // Mobile Layout
    if (isMobile) {
        return (
            <div className="flex flex-col h-screen w-full overflow-hidden">
                {/* Mobile Header */}
                <header className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-white dark:bg-[#151f2b] border-b border-slate-200 dark:border-slate-800">
                    <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <span className="material-symbols-outlined text-[24px] text-slate-700 dark:text-slate-300">{mobileMenuOpen ? "close" : "menu"}</span>
                    </button>
                    <h1 className="text-slate-900 dark:text-white text-base font-bold">NyankoMatch CRM</h1>
                    <div
                        className="bg-center bg-no-repeat bg-cover rounded-full size-8"
                        style={{
                            backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuBPZ5ki1ILaSNKlGW8i0MtRKkmLzXiePJTqdMHMz9-K5HYoS2f8d36DmQl4Ixd0q4EtHWF2Cvur6gs9ci145HccQ1L1gV0K2roH4mBxpSjUFNSTK_3pUOU-SJ1CGKOiS-lBh5xHGjLMJHs4dLy6DPkH-2RZEF_8GpaEz0IKohtUeHatMIBoJj4bQGTKlQEOYvVny9PuPvkFFeKHeW6px0bhQ5ag8FpdyhmGQO-2KjJBA0BM0xP9tiSVd7Tcs5bplTeVxeOrL-j3tic')`,
                        }}
                    ></div>
                </header>

                {/* Mobile Menu Overlay */}
                {mobileMenuOpen && <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setMobileMenuOpen(false)} />}

                {/* Mobile Sidebar */}
                <aside
                    className={`fixed top-0 left-0 z-50 h-full w-72 bg-white dark:bg-[#151f2b] border-r border-slate-200 dark:border-slate-800 transform transition-transform duration-300 ease-in-out ${
                        mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
                >
                    {/* Mobile Sidebar Header */}
                    <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <div className="flex gap-3 items-center">
                            <div className="bg-primary/10 rounded-full p-2 flex items-center justify-center">
                                <div
                                    className="bg-center bg-no-repeat bg-cover rounded-full size-8"
                                    style={{
                                        backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuDXefNJ8OkBmrGPRDDkThM1xSU97yONyUarblu6zsOQaJVnawwCgzdCXHNaB0MuKmWw3es_Kd_8o-1eyJ4un1PQtIbB6euAWXDcOi3FSkCusf47t1Zyijf9nr8VMHb-dxAUZ7n42-i-0d5fP5m35mX5UYlyPWEpfQM7TFmCnzOpI11n3zzKa2kQcD76YjQ6hynz2Oe31kRUS_QrrC_e776h6VeVmKRc2XL0U6RWVp-2PiHF0FqwHz462W4fTnq-0I1FTYZZmb89vcc')`,
                                    }}
                                ></div>
                            </div>
                            <div className="flex flex-col">
                                <h1 className="text-slate-900 dark:text-white text-base font-bold">NyankoMatch CRM</h1>
                                <p className="text-slate-500 dark:text-slate-400 text-xs">{user?.role === "ADMIN" ? "Admin" : "Manager"} Workspace</p>
                            </div>
                        </div>
                        <button onClick={() => setMobileMenuOpen(false)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                            <span className="material-symbols-outlined text-[20px] text-slate-500">close</span>
                        </button>
                    </div>

                    {/* Mobile Nav Items */}
                    <nav className="flex flex-col gap-1 p-4 flex-1 overflow-y-auto">
                        {allNavItems.map((item) => (
                            <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)} className={`sidebar-link ${isCurrentPage(item.href) ? "active" : ""}`}>
                                <span className="material-symbols-outlined text-[24px]">{item.icon}</span>
                                <p className="text-sm font-medium leading-normal">{item.label}</p>
                            </Link>
                        ))}
                    </nav>

                    {/* Mobile User Profile */}
                    <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                        <div
                            onClick={() => {
                                handleLogout();
                                setMobileMenuOpen(false);
                            }}
                            className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 p-2 rounded-lg transition-colors"
                        >
                            <div
                                className="bg-center bg-no-repeat bg-cover rounded-full size-10"
                                style={{
                                    backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuBPZ5ki1ILaSNKlGW8i0MtRKkmLzXiePJTqdMHMz9-K5HYoS2f8d36DmQl4Ixd0q4EtHWF2Cvur6gs9ci145HccQ1L1gV0K2roH4mBxpSjUFNSTK_3pUOU-SJ1CGKOiS-lBh5xHGjLMJHs4dLy6DPkH-2RZEF_8GpaEz0IKohtUeHatMIBoJj4bQGTKlQEOYvVny9PuPvkFFeKHeW6px0bhQ5ag8FpdyhmGQO-2KjJBA0BM0xP9tiSVd7Tcs5bplTeVxeOrL-j3tic')`,
                                }}
                            ></div>
                            <div className="flex flex-col overflow-hidden flex-1">
                                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{user?.name}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
                            </div>
                            <span className="material-symbols-outlined text-[20px] text-slate-400">logout</span>
                        </div>
                    </div>
                </aside>

                {/* Mobile Main Content */}
                <main className="flex-1 flex flex-col overflow-hidden">{children}</main>
            </div>
        );
    }

    // Desktop Layout
    return (
        <div className="flex h-screen w-full overflow-hidden">
            {/* Sidebar */}
            <aside
                ref={sidebarRef}
                style={{ width: sidebarWidth }}
                className={`flex-shrink-0 border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-[#151f2b] flex flex-col overflow-hidden relative select-none ${!isResizing ? "transition-all duration-300 ease-in-out" : ""}`}
            >
                {/* Resize Handle */}
                <div onMouseDown={startResizing} className={`absolute right-0 top-0 bottom-0 w-1 cursor-col-resize z-50 transition-colors hover:bg-primary/50 ${isResizing ? "bg-primary" : "bg-transparent"}`} />

                {/* Sidebar Header */}
                <div className={`${isCollapsed ? "p-3" : "p-6 pb-2"} transition-all duration-300 ease-in-out`}>
                    <div
                        className="flex gap-3 items-center cursor-pointer"
                        onClick={() => {
                            if (isCollapsed) {
                                setSidebarOpen(true);
                                setSidebarWidth(savedExpandedWidth);
                            }
                        }}
                    >
                        <div className="bg-primary/10 rounded-full p-2 flex items-center justify-center shrink-0">
                            <div
                                className="bg-center bg-no-repeat bg-cover rounded-full size-8"
                                style={{
                                    backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuDXefNJ8OkBmrGPRDDkThM1xSU97yONyUarblu6zsOQaJVnawwCgzdCXHNaB0MuKmWw3es_Kd_8o-1eyJ4un1PQtIbB6euAWXDcOi3FSkCusf47t1Zyijf9nr8VMHb-dxAUZ7n42-i-0d5fP5m35mX5UYlyPWEpfQM7TFmCnzOpI11n3zzKa2kQcD76YjQ6hynz2Oe31kRUS_QrrC_e776h6VeVmKRc2XL0U6RWVp-2PiHF0FqwHz462W4fTnq-0I1FTYZZmb89vcc')`,
                                }}
                            ></div>
                        </div>
                        {!isCollapsed && (
                            <div className="flex flex-col overflow-hidden min-w-0">
                                <h1 className="text-slate-900 dark:text-white text-base font-bold leading-normal whitespace-nowrap">NyankoMatch CRM</h1>
                                <p className="text-slate-500 dark:text-slate-400 text-xs font-normal leading-normal truncate">{user?.role === "ADMIN" ? "Admin" : "Manager"} Workspace</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Nav Items */}
                <nav className={`flex flex-col gap-1 ${isCollapsed ? "p-2" : "p-4"} flex-1 overflow-y-auto transition-all duration-300 ease-in-out`}>
                    {allNavItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={(e) => handleIconClick(e, item.href)}
                            className={`sidebar-link transition-all duration-300 ease-in-out ${isCurrentPage(item.href) ? "active" : ""} ${isCollapsed ? "justify-center px-2" : ""}`}
                            title={isCollapsed ? item.label : undefined}
                        >
                            <span className="material-symbols-outlined text-[24px]">{item.icon}</span>
                            {!isCollapsed && <p className="text-sm font-medium leading-normal">{item.label}</p>}
                        </Link>
                    ))}
                </nav>

                {/* User Profile */}
                <div className={`${isCollapsed ? "p-2" : "p-4"} border-t border-slate-200 dark:border-slate-800 transition-all duration-300 ease-in-out`}>
                    <div
                        onClick={handleLogout}
                        className={`flex items-center gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 p-2 rounded-lg transition-colors ${isCollapsed ? "justify-center" : ""}`}
                        title={isCollapsed ? "Logout" : undefined}
                    >
                        <div
                            className={`bg-center bg-no-repeat bg-cover rounded-full ${isCollapsed ? "size-8" : "size-10"}`}
                            style={{
                                backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuBPZ5ki1ILaSNKlGW8i0MtRKkmLzXiePJTqdMHMz9-K5HYoS2f8d36DmQl4Ixd0q4EtHWF2Cvur6gs9ci145HccQ1L1gV0K2roH4mBxpSjUFNSTK_3pUOU-SJ1CGKOiS-lBh5xHGjLMJHs4dLy6DPkH-2RZEF_8GpaEz0IKohtUeHatMIBoJj4bQGTKlQEOYvVny9PuPvkFFeKHeW6px0bhQ5ag8FpdyhmGQO-2KjJBA0BM0xP9tiSVd7Tcs5bplTeVxeOrL-j3tic')`,
                            }}
                        ></div>
                        {!isCollapsed && (
                            <div className="flex flex-col overflow-hidden">
                                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{user?.name}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
                            </div>
                        )}
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-full overflow-hidden">{children}</main>
        </div>
    );
}
