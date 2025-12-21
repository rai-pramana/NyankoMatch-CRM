export type UserRole = "ADMIN" | "MANAGER";
export type DealStatus = "OPEN" | "WON" | "LOST";
export type ActivityType = "CALL" | "EMAIL" | "MEETING" | "TASK" | "NOTE";
export type ActivityStatus = "PENDING" | "COMPLETED";

export interface Country {
    id: string;
    name: string;
    code: string;
    currency: string;
    currencySymbol: string;
    exchangeRate: number;
    createdAt: string;
    updatedAt: string;
}

export interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    isActive: boolean;
    countries: Country[];
    createdAt: string;
    updatedAt: string;
}

export interface Contact {
    id: string;
    name: string;
    email: string;
    phone?: string;
    company?: string;
    position?: string;
    countryId: string;
    country: Country;
    deals?: Deal[];
    createdAt: string;
    updatedAt: string;
}

export interface PipelineStage {
    id: string;
    name: string;
    order: number;
    deals?: Deal[];
    createdAt: string;
    updatedAt: string;
}

export interface Deal {
    id: string;
    name: string;
    value: number;
    status: DealStatus;
    expectedCloseDate?: string;
    stageId: string;
    stage?: PipelineStage;
    contactId: string;
    contact?: Contact;
    countryId: string;
    country?: Country;
    activities?: Activity[];
    notes?: Note[];
    createdAt: string;
    updatedAt: string;
}

export interface Activity {
    id: string;
    type: ActivityType;
    title: string;
    description?: string;
    dueDate: string;
    status: ActivityStatus;
    dealId?: string;
    deal?: Deal;
    assignedToId: string;
    assignedTo?: User;
    createdAt: string;
    updatedAt: string;
}

export interface Note {
    id: string;
    content: string;
    dealId: string;
    deal?: Deal;
    userId: string;
    user?: User;
    createdAt: string;
    updatedAt: string;
}

export interface DashboardStats {
    totalDeals: number;
    totalContacts: number;
    pendingActivities: number;
    dealsChange: number;
    contactsChange: number;
    activitiesChange: number;
}

export interface DealsByStage {
    id: string;
    name: string;
    order: number;
    dealCount: number;
    totalValue: number;
}

export interface RegionalPerformance {
    id: string;
    name: string;
    code: string;
    currency: string;
    currencySymbol: string;
    exchangeRate: number;
    dealCount: number;
    totalValue: number;
    wonValue: number;
}

export interface DashboardData {
    stats: DashboardStats;
    dealsByStage: DealsByStage[];
    recentActivities: Activity[];
    regionalPerformance: RegionalPerformance[];
}
