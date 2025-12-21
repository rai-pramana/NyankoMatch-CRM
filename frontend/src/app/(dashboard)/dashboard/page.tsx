"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { dashboardApi, countriesApi, contactsApi, dealsApi } from "@/lib/api";
import { useAuthStore, useAppStore } from "@/lib/store";
import { DashboardData, Country, Contact, Deal } from "@/lib/types";
import { format } from "date-fns";

export default function DashboardPage() {
    const router = useRouter();
    const { user } = useAuthStore();
    const { selectedCountryId, setSelectedCountryId } = useAppStore();
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const notificationsRef = useRef<HTMLDivElement>(null);

    // Close dropdowns when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsSearchOpen(false);
            }
            if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
                setIsNotificationsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const { data: countries = [] } = useQuery<Country[]>({
        queryKey: ["countries"],
        queryFn: countriesApi.getAll,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    const { data: dashboardData, isLoading } = useQuery<DashboardData>({
        queryKey: ["dashboard", selectedCountryId],
        queryFn: () => dashboardApi.getOverview(selectedCountryId || undefined),
        refetchInterval: 30 * 1000, // Refetch every 30 seconds
        refetchIntervalInBackground: true, // Keep refetching even when tab is not focused
    });

    // Search queries - only fetch when there's a search query
    const { data: searchContacts = [], isFetching: isSearchingContacts } = useQuery<Contact[]>({
        queryKey: ["search-contacts", searchQuery],
        queryFn: () => contactsApi.getAll({ search: searchQuery }),
        enabled: searchQuery.length >= 2,
        staleTime: 30 * 1000,
    });

    const { data: searchDeals = [], isFetching: isSearchingDeals } = useQuery<Deal[]>({
        queryKey: ["search-deals", searchQuery],
        queryFn: () => dealsApi.getAll(),
        enabled: searchQuery.length >= 2,
        staleTime: 30 * 1000,
        select: (deals) => deals.filter((deal) => deal.name.toLowerCase().includes(searchQuery.toLowerCase())),
    });

    const isSearching = isSearchingContacts || isSearchingDeals;
    const hasResults = searchContacts.length > 0 || searchDeals.length > 0;

    const handleSearchFocus = () => {
        setIsSearchOpen(true);
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
        if (e.target.value.length >= 2) {
            setIsSearchOpen(true);
        }
    };

    const navigateToContact = (contactId: string) => {
        setIsSearchOpen(false);
        setSearchQuery("");
        router.push(`/contacts?highlight=${contactId}`);
    };

    const navigateToDeal = (dealId: string) => {
        setIsSearchOpen(false);
        setSearchQuery("");
        router.push(`/deals/${dealId}`);
    };

    const navigateToActivity = (activity: { deal?: { id: string } }) => {
        setIsNotificationsOpen(false);
        if (activity.deal) {
            router.push(`/deals/${activity.deal.id}`);
        } else {
            router.push("/activities");
        }
    };

    const getActivityIcon = (type: string) => {
        switch (type) {
            case "CALL":
                return "call";
            case "EMAIL":
                return "mail";
            case "MEETING":
                return "event";
            default:
                return "task";
        }
    };

    const getActivityColor = (type: string) => {
        switch (type) {
            case "CALL":
                return "bg-blue-50 dark:bg-blue-900/20 text-blue-600";
            case "EMAIL":
                return "bg-purple-50 dark:bg-purple-900/20 text-purple-600";
            case "MEETING":
                return "bg-green-50 dark:bg-green-900/20 text-green-600";
            default:
                return "bg-orange-50 dark:bg-orange-900/20 text-orange-600";
        }
    };

    // Count pending notifications (activities that are pending)
    const pendingCount = dashboardData?.recentActivities.filter((a) => a.status === "PENDING").length || 0;

    const formatCurrency = (value: number, currencySymbol = "€") => {
        return `${currencySymbol}${value.toLocaleString()}`;
    };

    // Helper to render percentage change badge
    const renderPercentageBadge = (change: number) => {
        const isPositive = change >= 0;
        const bgColor = isPositive ? "bg-green-50 dark:bg-green-900/20" : "bg-red-50 dark:bg-red-900/20";
        const textColor = isPositive ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400";
        const icon = isPositive ? "trending_up" : "trending_down";
        const sign = isPositive ? "+" : "";

        return (
            <span className={`inline-flex items-center gap-1 rounded-full ${bgColor} px-2 py-1 text-xs font-medium ${textColor}`}>
                <span className="material-symbols-outlined text-[14px]">{icon}</span> {sign}
                {change}%
            </span>
        );
    };

    if (isLoading) {
        return (
            <div className="flex flex-1 items-center justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
        );
    }

    return (
        <>
            {/* Top Header & Filters */}
            <header className="w-full px-4 sm:px-6 py-4 bg-background-light dark:bg-background-dark border-b border-transparent">
                {/* Breadcrumbs */}
                <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-normal">Home</span>
                    <span className="text-slate-400 dark:text-slate-600 text-sm font-medium leading-normal">/</span>
                    <span className="text-slate-900 dark:text-white text-sm font-medium leading-normal">Dashboard</span>
                </div>

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    {/* Headline */}
                    <div className="flex flex-col">
                        <h1 className="text-slate-900 dark:text-white tracking-tight text-xl sm:text-2xl md:text-[28px] font-bold leading-tight">{user?.role === "ADMIN" ? "Admin" : "Manager"} Dashboard Overview</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm pt-1">Welcome back, here&apos;s what&apos;s happening today.</p>
                    </div>

                    {/* Controls */}
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 self-start md:self-end">
                        {/* Search */}
                        <div ref={searchRef} className="relative hidden lg:block">
                            <div className="flex items-center bg-white dark:bg-[#151f2b] border border-slate-200 dark:border-slate-700 rounded-lg h-10 px-3 w-64 hover:border-slate-300 dark:hover:border-slate-600 transition-colors focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary">
                                <span className="material-symbols-outlined text-slate-400 text-[20px]">search</span>
                                <input
                                    className="bg-transparent border-none text-sm text-slate-700 dark:text-slate-200 focus:ring-0 w-full placeholder:text-slate-400"
                                    placeholder="Search deals, contacts..."
                                    type="text"
                                    value={searchQuery}
                                    onChange={handleSearchChange}
                                    onFocus={handleSearchFocus}
                                />
                                {searchQuery && (
                                    <button onClick={() => setSearchQuery("")} className="text-slate-400 hover:text-slate-600">
                                        <span className="material-symbols-outlined text-[18px]">close</span>
                                    </button>
                                )}
                            </div>

                            {/* Search Results Dropdown */}
                            {isSearchOpen && searchQuery.length >= 2 && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#151f2b] border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-50 max-h-[400px] overflow-y-auto">
                                    {isSearching ? (
                                        <div className="flex items-center justify-center py-8">
                                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                                        </div>
                                    ) : !hasResults ? (
                                        <div className="py-8 text-center">
                                            <span className="material-symbols-outlined text-[32px] text-slate-400">search_off</span>
                                            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">No results found for &quot;{searchQuery}&quot;</p>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Contacts Results */}
                                            {searchContacts.length > 0 && (
                                                <div>
                                                    <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                                                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Contacts ({searchContacts.length})</p>
                                                    </div>
                                                    {searchContacts.slice(0, 5).map((contact) => (
                                                        <button
                                                            key={contact.id}
                                                            onClick={() => navigateToContact(contact.id)}
                                                            className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left"
                                                        >
                                                            <div className="size-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 text-sm font-medium">
                                                                {contact.name.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{contact.name}</p>
                                                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{contact.email}</p>
                                                            </div>
                                                            <span className="text-xs text-slate-400">{contact.company || ""}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Deals Results */}
                                            {searchDeals.length > 0 && (
                                                <div>
                                                    <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                                                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Deals ({searchDeals.length})</p>
                                                    </div>
                                                    {searchDeals.slice(0, 5).map((deal) => (
                                                        <button
                                                            key={deal.id}
                                                            onClick={() => navigateToDeal(deal.id)}
                                                            className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left"
                                                        >
                                                            <div className="size-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                                                <span className="material-symbols-outlined text-[16px]">monetization_on</span>
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{deal.name}</p>
                                                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{deal.contact?.name}</p>
                                                            </div>
                                                            <span className="text-sm font-semibold text-primary">
                                                                {deal.country?.currencySymbol || "€"}
                                                                {deal.value.toLocaleString()}
                                                            </span>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Country Filter */}
                        <div className="relative min-w-[120px] sm:min-w-[160px]">
                            <select
                                value={selectedCountryId || ""}
                                onChange={(e) => setSelectedCountryId(e.target.value || null)}
                                className="appearance-none flex w-full cursor-pointer items-center justify-between rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#151f2b] py-2 sm:py-2.5 pl-3 sm:pl-4 pr-8 sm:pr-10 text-xs sm:text-sm font-medium text-slate-900 dark:text-white hover:border-slate-300 dark:hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                            >
                                <option value="">All Countries</option>
                                {countries.map((country) => (
                                    <option key={country.id} value={country.id}>
                                        {country.name}
                                    </option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 sm:px-3 text-slate-500">
                                <span className="material-symbols-outlined text-[18px] sm:text-[20px]">expand_more</span>
                            </div>
                        </div>

                        {/* Notifications */}
                        <div ref={notificationsRef} className="relative">
                            <button
                                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                                className="relative flex items-center justify-center size-9 sm:size-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#151f2b] text-slate-500 hover:text-primary hover:border-primary/30 transition-colors"
                            >
                                <span className="material-symbols-outlined text-[18px] sm:text-[20px]">notifications</span>
                                {pendingCount > 0 && <span className="absolute -top-1 -right-1 flex items-center justify-center size-5 rounded-full bg-red-500 text-white text-xs font-bold">{pendingCount > 9 ? "9+" : pendingCount}</span>}
                            </button>

                            {/* Notifications Dropdown */}
                            {isNotificationsOpen && (
                                <div className="absolute top-full right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-[#151f2b] border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-50 max-h-[480px] overflow-hidden">
                                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Notifications</h3>
                                        {pendingCount > 0 && <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-600 px-2 py-0.5 rounded-full">{pendingCount} pending</span>}
                                    </div>

                                    <div className="max-h-[360px] overflow-y-auto">
                                        {!dashboardData?.recentActivities || dashboardData.recentActivities.length === 0 ? (
                                            <div className="py-12 text-center">
                                                <span className="material-symbols-outlined text-[40px] text-slate-300 dark:text-slate-600">notifications_off</span>
                                                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">No notifications yet</p>
                                            </div>
                                        ) : (
                                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                                {dashboardData.recentActivities.slice(0, 8).map((activity) => (
                                                    <button
                                                        key={activity.id}
                                                        onClick={() => navigateToActivity(activity)}
                                                        className={`w-full p-4 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left ${
                                                            activity.status === "PENDING" ? "bg-blue-50/50 dark:bg-blue-900/10" : ""
                                                        }`}
                                                    >
                                                        <div className={`p-2 rounded-lg flex-shrink-0 ${getActivityColor(activity.type)}`}>
                                                            <span className="material-symbols-outlined text-[18px]">{getActivityIcon(activity.type)}</span>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-start justify-between gap-2">
                                                                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{activity.title}</p>
                                                                <span
                                                                    className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                                                                        activity.status === "COMPLETED" ? "bg-green-50 dark:bg-green-900/20 text-green-600" : "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600"
                                                                    }`}
                                                                >
                                                                    {activity.status}
                                                                </span>
                                                            </div>
                                                            {activity.deal && <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{activity.deal.name}</p>}
                                                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{format(new Date(activity.dueDate), "MMM d, yyyy 'at' h:mm a")}</p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30">
                                        <button
                                            onClick={() => {
                                                setIsNotificationsOpen(false);
                                                router.push("/activities");
                                            }}
                                            className="w-full text-center text-sm font-medium text-primary hover:underline"
                                        >
                                            View All Activities
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Scrollable Dashboard Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 scroll-smooth">
                <div className="flex flex-col gap-4 sm:gap-6 max-w-[1400px] mx-auto">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                        {/* Total Deals */}
                        <div className="card flex flex-col gap-3 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start">
                                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-primary">
                                    <span className="material-symbols-outlined text-[20px] sm:text-[24px]">monetization_on</span>
                                </div>
                                {renderPercentageBadge(dashboardData?.stats.dealsChange ?? 0)}
                            </div>
                            <div>
                                <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium leading-normal">Total Deals</p>
                                <p className="text-slate-900 dark:text-white tracking-tight text-2xl sm:text-3xl font-bold leading-tight mt-1">{dashboardData?.stats.totalDeals || 0}</p>
                            </div>
                        </div>

                        {/* Total Contacts */}
                        <div className="card flex flex-col gap-3 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start">
                                <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400">
                                    <span className="material-symbols-outlined text-[20px] sm:text-[24px]">group</span>
                                </div>
                                {renderPercentageBadge(dashboardData?.stats.contactsChange ?? 0)}
                            </div>
                            <div>
                                <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium leading-normal">Total Contacts</p>
                                <p className="text-slate-900 dark:text-white tracking-tight text-2xl sm:text-3xl font-bold leading-tight mt-1">{dashboardData?.stats.totalContacts || 0}</p>
                            </div>
                        </div>

                        {/* Pending Activities */}
                        <div className="card flex flex-col gap-3 hover:shadow-md transition-shadow sm:col-span-2 lg:col-span-1">
                            <div className="flex justify-between items-start">
                                <div className="p-2 rounded-lg bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400">
                                    <span className="material-symbols-outlined text-[20px] sm:text-[24px]">pending_actions</span>
                                </div>
                                {renderPercentageBadge(dashboardData?.stats.activitiesChange ?? 0)}
                            </div>
                            <div>
                                <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium leading-normal">Pending Activities</p>
                                <p className="text-slate-900 dark:text-white tracking-tight text-2xl sm:text-3xl font-bold leading-tight mt-1">{dashboardData?.stats.pendingActivities || 0}</p>
                            </div>
                        </div>
                    </div>

                    {/* Layout Grid: Charts & Timeline */}
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        {/* Main Panel: Pipeline (Left 2/3) */}
                        <div className="flex flex-col gap-6 xl:col-span-2">
                            {/* Pipeline Chart */}
                            <div className="card p-0 overflow-hidden">
                                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Deals by Stage</h3>
                                    <a href="/deals" className="text-primary text-sm font-medium hover:underline">
                                        View Full Report
                                    </a>
                                </div>
                                <div className="p-6">
                                    <div className="space-y-5">
                                        {dashboardData?.dealsByStage.map((stage) => {
                                            const maxValue = Math.max(...dashboardData.dealsByStage.map((s) => s.dealCount));
                                            const percentage = maxValue > 0 ? (stage.dealCount / maxValue) * 100 : 0;
                                            return (
                                                <div key={stage.id}>
                                                    <div className="flex justify-between mb-1">
                                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{stage.name}</span>
                                                        <span className="text-sm font-medium text-slate-900 dark:text-white">
                                                            {stage.dealCount} deals ({formatCurrency(stage.totalValue)})
                                                        </span>
                                                    </div>
                                                    <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5">
                                                        <div className="bg-primary h-2.5 rounded-full transition-all duration-300" style={{ width: `${percentage}%` }}></div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Regional Performance */}
                            <div className="card p-0 overflow-hidden">
                                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Regional Performance</h3>
                                </div>
                                <div className="p-6">
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-slate-100 dark:border-slate-800">
                                                    <th className="text-left py-3 text-sm font-medium text-slate-500 dark:text-slate-400">Country</th>
                                                    <th className="text-right py-3 text-sm font-medium text-slate-500 dark:text-slate-400">Deals</th>
                                                    <th className="text-right py-3 text-sm font-medium text-slate-500 dark:text-slate-400">Total Value</th>
                                                    <th className="text-right py-3 text-sm font-medium text-slate-500 dark:text-slate-400">Won Value</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {dashboardData?.regionalPerformance.map((region) => (
                                                    <tr key={region.id} className="border-b border-slate-50 dark:border-slate-800/50">
                                                        <td className="py-3">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-sm font-medium text-slate-900 dark:text-white">{region.name}</span>
                                                                <span className="text-xs text-slate-500 dark:text-slate-400">({region.code})</span>
                                                            </div>
                                                        </td>
                                                        <td className="py-3 text-right text-sm text-slate-700 dark:text-slate-300">{region.dealCount}</td>
                                                        <td className="py-3 text-right text-sm font-medium text-slate-900 dark:text-white">{formatCurrency(region.totalValue, region.currencySymbol)}</td>
                                                        <td className="py-3 text-right text-sm font-medium text-green-600 dark:text-green-400">{formatCurrency(region.wonValue, region.currencySymbol)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Panel: Recent Activities (1/3) */}
                        <div className="card p-0 overflow-hidden">
                            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Recent Activities</h3>
                                <a href="/activities" className="text-primary text-sm font-medium hover:underline">
                                    View All
                                </a>
                            </div>
                            <div className="p-4 max-h-[500px] overflow-y-auto">
                                <div className="space-y-4">
                                    {dashboardData?.recentActivities.map((activity) => (
                                        <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                                            <div
                                                className={`p-2 rounded-lg ${
                                                    activity.type === "CALL"
                                                        ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600"
                                                        : activity.type === "EMAIL"
                                                        ? "bg-purple-50 dark:bg-purple-900/20 text-purple-600"
                                                        : activity.type === "MEETING"
                                                        ? "bg-green-50 dark:bg-green-900/20 text-green-600"
                                                        : "bg-orange-50 dark:bg-orange-900/20 text-orange-600"
                                                }`}
                                            >
                                                <span className="material-symbols-outlined text-[20px]">{activity.type === "CALL" ? "call" : activity.type === "EMAIL" ? "mail" : activity.type === "MEETING" ? "event" : "task"}</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{activity.title}</p>
                                                {activity.deal && <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{activity.deal.name}</p>}
                                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{format(new Date(activity.dueDate), "MMM d, yyyy")}</p>
                                            </div>
                                            <span className={`text-xs px-2 py-1 rounded-full ${activity.status === "COMPLETED" ? "bg-green-50 dark:bg-green-900/20 text-green-600" : "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600"}`}>
                                                {activity.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
