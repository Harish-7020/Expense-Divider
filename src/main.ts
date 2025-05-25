import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import 'dotenv/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors(); 

  const config = new DocumentBuilder()
    .setTitle('My Microservice APIs')
    .setDescription('Backend APIs for Chat, Payment, Expense Splitter')
    .setVersion('1.0')
    .addBearerAuth()  // <== Add Bearer Auth for token
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);
  
  const port = process.env.APP_PORT ? Number(process.env.APP_PORT) : 3000;
  await app.listen(port);
}
bootstrap();
