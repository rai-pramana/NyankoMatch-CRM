import { Injectable } from "@nestjs/common";
import { UserRole, DealStatus, ActivityStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class DashboardService {
    constructor(private prisma: PrismaService) {}

    private getDateRanges() {
        const now = new Date();
        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

        return {
            currentMonthStart,
            previousMonthStart,
            previousMonthEnd,
        };
    }

    private calculatePercentageChange(current: number, previous: number): number {
        if (previous === 0) {
            return current > 0 ? 100 : 0;
        }
        return Math.round(((current - previous) / previous) * 100);
    }

    async getOverview(user: any, countryId?: string) {
        const where: any = {};
        const { currentMonthStart, previousMonthStart, previousMonthEnd } = this.getDateRanges();

        if (user.role === UserRole.MANAGER) {
            const countryIds = user.countries.map((c: any) => c.id);
            where.countryId = { in: countryIds };
        }

        if (countryId) {
            where.countryId = countryId;
        }

        // Build contact where clause
        const contactWhere = user.role === UserRole.MANAGER ? { countryId: { in: user.countries.map((c: any) => c.id) } } : countryId ? { countryId } : {};

        // Build activity where clause
        const activityWhere = {
            status: ActivityStatus.PENDING,
            ...(user.role === UserRole.MANAGER ? { assignedToId: user.id } : {}),
        };

        const [
            totalDeals,
            totalContacts,
            pendingActivities,
            // Current month counts
            currentMonthDeals,
            currentMonthContacts,
            currentMonthActivities,
            // Previous month counts
            previousMonthDeals,
            previousMonthContacts,
            previousMonthActivities,
            dealsByStage,
            recentActivities,
            regionalPerformance,
        ] = await Promise.all([
            // Total deals count
            this.prisma.deal.count({ where }),

            // Total contacts count
            this.prisma.contact.count({ where: contactWhere }),

            // Pending activities count
            this.prisma.activity.count({ where: activityWhere }),

            // Current month deals
            this.prisma.deal.count({
                where: {
                    ...where,
                    createdAt: { gte: currentMonthStart },
                },
            }),

            // Current month contacts
            this.prisma.contact.count({
                where: {
                    ...contactWhere,
                    createdAt: { gte: currentMonthStart },
                },
            }),

            // Current month pending activities (created this month)
            this.prisma.activity.count({
                where: {
                    ...activityWhere,
                    createdAt: { gte: currentMonthStart },
                },
            }),

            // Previous month deals
            this.prisma.deal.count({
                where: {
                    ...where,
                    createdAt: {
                        gte: previousMonthStart,
                        lte: previousMonthEnd,
                    },
                },
            }),

            // Previous month contacts
            this.prisma.contact.count({
                where: {
                    ...contactWhere,
                    createdAt: {
                        gte: previousMonthStart,
                        lte: previousMonthEnd,
                    },
                },
            }),

            // Previous month pending activities
            this.prisma.activity.count({
                where: {
                    ...activityWhere,
                    createdAt: {
                        gte: previousMonthStart,
                        lte: previousMonthEnd,
                    },
                },
            }),

            // Deals by stage
            this.getDealsByStage(where),

            // Recent activities
            this.getRecentActivities(user),

            // Regional performance
            this.getRegionalPerformance(where),
        ]);

        return {
            stats: {
                totalDeals,
                totalContacts,
                pendingActivities,
                dealsChange: this.calculatePercentageChange(currentMonthDeals, previousMonthDeals),
                contactsChange: this.calculatePercentageChange(currentMonthContacts, previousMonthContacts),
                activitiesChange: this.calculatePercentageChange(currentMonthActivities, previousMonthActivities),
            },
            dealsByStage,
            recentActivities,
            regionalPerformance,
        };
    }

    private async getDealsByStage(where: any) {
        const stages = await this.prisma.pipelineStage.findMany({
            orderBy: { order: "asc" },
            include: {
                deals: {
                    where: { ...where, status: DealStatus.OPEN },
                    select: { value: true },
                },
            },
        });

        return stages.map((stage) => ({
            id: stage.id,
            name: stage.name,
            order: stage.order,
            dealCount: stage.deals.length,
            totalValue: stage.deals.reduce((sum, deal) => sum + deal.value, 0),
        }));
    }

    private async getRecentActivities(user: any) {
        const where: any = {};

        if (user.role === UserRole.MANAGER) {
            where.assignedToId = user.id;
        }

        return this.prisma.activity.findMany({
            where,
            take: 10,
            orderBy: { createdAt: "desc" },
            include: {
                deal: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                assignedTo: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });
    }

    private async getRegionalPerformance(where: any) {
        const countries = await this.prisma.country.findMany({
            include: {
                deals: {
                    where,
                    select: {
                        value: true,
                        status: true,
                    },
                },
            },
        });

        return countries
            .map((country) => {
                const totalDeals = country.deals.length;
                const totalValue = country.deals.reduce((sum, deal) => sum + deal.value, 0);
                const wonDeals = country.deals.filter((d) => d.status === DealStatus.WON);
                const wonValue = wonDeals.reduce((sum, deal) => sum + deal.value, 0);

                return {
                    id: country.id,
                    name: country.name,
                    code: country.code,
                    currency: country.currency,
                    currencySymbol: country.currencySymbol,
                    exchangeRate: country.exchangeRate,
                    dealCount: totalDeals,
                    totalValue,
                    wonValue,
                };
            })
            .filter((c) => c.dealCount > 0)
            .sort((a, b) => b.totalValue - a.totalValue);
    }
}
