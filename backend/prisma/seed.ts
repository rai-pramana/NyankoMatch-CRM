import { PrismaClient, UserRole, DealStatus, ActivityType, ActivityStatus } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Seeding database...");

    // Create Countries
    const countries = await Promise.all([
        prisma.country.upsert({
            where: { code: "US" },
            update: {},
            create: {
                name: "United States",
                code: "US",
                currency: "USD",
                currencySymbol: "$",
                exchangeRate: 1.08, // 1 EUR = 1.08 USD
            },
        }),
        prisma.country.upsert({
            where: { code: "GB" },
            update: {},
            create: {
                name: "United Kingdom",
                code: "GB",
                currency: "GBP",
                currencySymbol: "£",
                exchangeRate: 0.86, // 1 EUR = 0.86 GBP
            },
        }),
        prisma.country.upsert({
            where: { code: "JP" },
            update: {},
            create: {
                name: "Japan",
                code: "JP",
                currency: "JPY",
                currencySymbol: "¥",
                exchangeRate: 158.5, // 1 EUR = 158.5 JPY
            },
        }),
        prisma.country.upsert({
            where: { code: "DE" },
            update: {},
            create: {
                name: "Germany",
                code: "DE",
                currency: "EUR",
                currencySymbol: "€",
                exchangeRate: 1.0,
            },
        }),
        prisma.country.upsert({
            where: { code: "FR" },
            update: {},
            create: {
                name: "France",
                code: "FR",
                currency: "EUR",
                currencySymbol: "€",
                exchangeRate: 1.0,
            },
        }),
    ]);

    console.log("✅ Countries created");

    // Create Admin User
    const hashedAdminPassword = await bcrypt.hash("Admin123!", 10);
    const adminUser = await prisma.user.upsert({
        where: { email: "admin@nyankomatch.com" },
        update: {},
        create: {
            email: "admin@nyankomatch.com",
            password: hashedAdminPassword,
            name: "Admin User",
            role: UserRole.ADMIN,
            isActive: true,
        },
    });

    // Create Manager User
    const hashedManagerPassword = await bcrypt.hash("Manager123!", 10);
    const managerUser = await prisma.user.upsert({
        where: { email: "manager@nyankomatch.com" },
        update: {},
        create: {
            email: "manager@nyankomatch.com",
            password: hashedManagerPassword,
            name: "Manager User",
            role: UserRole.MANAGER,
            isActive: true,
        },
    });

    // Assign countries to manager
    await prisma.userCountry.createMany({
        data: [
            { userId: managerUser.id, countryId: countries[0].id }, // US
            { userId: managerUser.id, countryId: countries[2].id }, // Japan
        ],
        skipDuplicates: true,
    });

    console.log("✅ Users created");

    // Create Pipeline Stages
    const stages = await Promise.all([
        prisma.pipelineStage.upsert({
            where: { id: "stage-lead" },
            update: {},
            create: { id: "stage-lead", name: "Lead", order: 1 },
        }),
        prisma.pipelineStage.upsert({
            where: { id: "stage-qualified" },
            update: {},
            create: { id: "stage-qualified", name: "Qualified", order: 2 },
        }),
        prisma.pipelineStage.upsert({
            where: { id: "stage-proposal" },
            update: {},
            create: { id: "stage-proposal", name: "Proposal", order: 3 },
        }),
        prisma.pipelineStage.upsert({
            where: { id: "stage-negotiation" },
            update: {},
            create: { id: "stage-negotiation", name: "Negotiation", order: 4 },
        }),
        prisma.pipelineStage.upsert({
            where: { id: "stage-close" },
            update: {},
            create: { id: "stage-close", name: "Close", order: 5 },
        }),
    ]);

    console.log("✅ Pipeline stages created");

    // Create Sample Contacts
    const contacts = await Promise.all([
        prisma.contact.upsert({
            where: { id: "contact-1" },
            update: {},
            create: {
                id: "contact-1",
                name: "Jane Cooper",
                email: "jane.cooper@techflow.com",
                phone: "+1 (555) 0123-4567",
                company: "TechFlow Inc.",
                notes: "Interested in enterprise plan for Q3 deployment.",
                countryId: countries[0].id,
                createdById: adminUser.id,
            },
        }),
        prisma.contact.upsert({
            where: { id: "contact-2" },
            update: {},
            create: {
                id: "contact-2",
                name: "Sarah Jennings",
                email: "sarah@techflow.com",
                phone: "+1 (555) 0987-6543",
                company: "TechFlow Inc.",
                notes: "VP of Operations. Primary decision maker.",
                countryId: countries[0].id,
                createdById: adminUser.id,
            },
        }),
        prisma.contact.upsert({
            where: { id: "contact-3" },
            update: {},
            create: {
                id: "contact-3",
                name: "Takeshi Yamamoto",
                email: "takeshi@kyotohotel.jp",
                phone: "+81 3-1234-5678",
                company: "Kyoto Hotel Chain",
                notes: "Looking for booking system integration.",
                countryId: countries[2].id,
                createdById: managerUser.id,
            },
        }),
        prisma.contact.upsert({
            where: { id: "contact-4" },
            update: {},
            create: {
                id: "contact-4",
                name: "Cody Fisher",
                email: "cody.fisher@abstergo.co.uk",
                phone: "+44 20 7123 4567",
                company: "Abstergo Ltd.",
                notes: "Met at London conference. Potential partner for EU expansion.",
                countryId: countries[1].id,
                createdById: adminUser.id,
            },
        }),
    ]);

    console.log("✅ Contacts created");

    // Create Sample Deals
    const deals = await Promise.all([
        prisma.deal.upsert({
            where: { id: "deal-1" },
            update: {},
            create: {
                id: "deal-1",
                name: "Enterprise License Expansion - Q3",
                value: 125000,
                probability: 75,
                expectedCloseDate: new Date("2024-10-24"),
                status: DealStatus.OPEN,
                stageId: stages[3].id, // Negotiation
                contactId: contacts[1].id,
                ownerId: adminUser.id,
                countryId: countries[0].id,
            },
        }),
        prisma.deal.upsert({
            where: { id: "deal-2" },
            update: {},
            create: {
                id: "deal-2",
                name: "Kyoto Hotel Chain - Booking System",
                value: 30000,
                probability: 50,
                expectedCloseDate: new Date("2024-11-10"),
                status: DealStatus.OPEN,
                stageId: stages[0].id, // Lead
                contactId: contacts[2].id,
                ownerId: managerUser.id,
                countryId: countries[2].id,
            },
        }),
        prisma.deal.upsert({
            where: { id: "deal-3" },
            update: {},
            create: {
                id: "deal-3",
                name: "Acme Corp Renewal",
                value: 15000,
                probability: 30,
                expectedCloseDate: new Date("2024-11-12"),
                status: DealStatus.OPEN,
                stageId: stages[0].id, // Lead
                contactId: contacts[0].id,
                ownerId: adminUser.id,
                countryId: countries[0].id,
            },
        }),
        prisma.deal.upsert({
            where: { id: "deal-4" },
            update: {},
            create: {
                id: "deal-4",
                name: "Abstergo EU Partnership",
                value: 85000,
                probability: 60,
                expectedCloseDate: new Date("2024-12-01"),
                status: DealStatus.OPEN,
                stageId: stages[1].id, // Qualified
                contactId: contacts[3].id,
                ownerId: adminUser.id,
                countryId: countries[1].id,
            },
        }),
    ]);

    console.log("✅ Deals created");

    // Create Sample Activities
    await Promise.all([
        prisma.activity.upsert({
            where: { id: "activity-1" },
            update: {},
            create: {
                id: "activity-1",
                title: "Draft Contract for Review",
                description: "Review legal terms with counsel before sending.",
                type: ActivityType.TASK,
                status: ActivityStatus.PENDING,
                dueDate: new Date(),
                dealId: deals[0].id,
                assignedToId: adminUser.id,
                createdById: adminUser.id,
            },
        }),
        prisma.activity.upsert({
            where: { id: "activity-2" },
            update: {},
            create: {
                id: "activity-2",
                title: "Call with Sarah Jennings",
                description: "Discuss pricing tiers and implementation timeline.",
                type: ActivityType.CALL,
                status: ActivityStatus.COMPLETED,
                dueDate: new Date(),
                completedAt: new Date(),
                dealId: deals[0].id,
                assignedToId: adminUser.id,
                createdById: adminUser.id,
            },
        }),
        prisma.activity.upsert({
            where: { id: "activity-3" },
            update: {},
            create: {
                id: "activity-3",
                title: "Follow up with Kyoto Hotel",
                description: "Send detailed proposal for booking system.",
                type: ActivityType.EMAIL,
                status: ActivityStatus.PENDING,
                dueDate: new Date(Date.now() + 86400000 * 2), // 2 days from now
                dealId: deals[1].id,
                assignedToId: managerUser.id,
                createdById: managerUser.id,
            },
        }),
    ]);

    console.log("✅ Activities created");

    // Create Sample Notes
    await Promise.all([
        prisma.note.upsert({
            where: { id: "note-1" },
            update: {},
            create: {
                id: "note-1",
                content: "Internal sync: We can offer a 5% discount if they close by end of month. Approval from finance obtained.",
                dealId: deals[0].id,
                userId: adminUser.id,
            },
        }),
        prisma.note.upsert({
            where: { id: "note-2" },
            update: {},
            create: {
                id: "note-2",
                content: "Sarah mentioned they are also talking to competitors. Need to highlight our unique features.",
                dealId: deals[0].id,
                userId: adminUser.id,
            },
        }),
    ]);

    console.log("✅ Notes created");

    console.log("🎉 Database seeded successfully!");
}

main()
    .catch((e) => {
        console.error("❌ Error seeding database:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
