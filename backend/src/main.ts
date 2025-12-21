import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // Enable CORS for localhost and network access
    const allowedOrigins = ["http://localhost:3000", "http://127.0.0.1:3000", "http://192.168.1.7:3000", "https://nyanko-match-crm.vercel.app"];
    if (process.env.FRONTEND_URL) {
        allowedOrigins.push(process.env.FRONTEND_URL);
    }

    app.enableCors({
        origin: allowedOrigins,
        credentials: true,
    });

    // Global prefix
    app.setGlobalPrefix("api");

    // Validation pipe
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            transform: true,
            forbidNonWhitelisted: true,
        })
    );

    // Swagger documentation
    const config = new DocumentBuilder().setTitle("NyankoMatch CRM API").setDescription("API documentation for NyankoMatch CRM").setVersion("1.0").addBearerAuth().build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup("api/docs", app, document);

    const port = process.env.PORT || 3001;
    await app.listen(port);
    console.log(`🚀 Application is running on: http://localhost:${port}`);
    console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
}
bootstrap();
