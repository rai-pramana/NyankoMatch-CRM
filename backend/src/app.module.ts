import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { ContactsModule } from "./contacts/contacts.module";
import { DealsModule } from "./deals/deals.module";
import { ActivitiesModule } from "./activities/activities.module";
import { CountriesModule } from "./countries/countries.module";
import { PipelineStagesModule } from "./pipeline-stages/pipeline-stages.module";
import { NotesModule } from "./notes/notes.module";
import { DashboardModule } from "./dashboard/dashboard.module";
import { EventsModule } from "./events/events.module";

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        PrismaModule,
        EventsModule,
        AuthModule,
        UsersModule,
        ContactsModule,
        DealsModule,
        ActivitiesModule,
        CountriesModule,
        PipelineStagesModule,
        NotesModule,
        DashboardModule,
    ],
})
export class AppModule {}
