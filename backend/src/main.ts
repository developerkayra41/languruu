import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BadRequestException, ValidationError, ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './_common/exceptions/http.exception.filter';
import basicAuth from 'express-basic-auth';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { LoggingInterceptor } from './_common/interceptors/login.interceptor';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.set('trust proxy', 1) // sadece gerçekten bir proxy arkasındaysan
  app.use(helmet({ contentSecurityPolicy: false }));
  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  });

  app.setGlobalPrefix('api');

  app.useGlobalPipes(new ValidationPipe({
    exceptionFactory: (errors) => {
      const findFirstError = (errors: ValidationError[]) => {
        for (const error of errors) {
          if (error.constraints) return Object.values(error.constraints)[0]
          if (error.children && error.children.length > 0) {
            const childError = findFirstError(error.children);
            if (childError) return childError;
          }
        }
      }
      const firstError = findFirstError(errors);
      return new BadRequestException(firstError);
    }
  }))

  if (process.env.NODE_ENV !== 'production') {
    const swaggerUser = process.env.SWAGGER_USER;
    const swaggerPassword = process.env.SWAGGER_PASSWORD;

    if (!swaggerUser || !swaggerPassword)
      throw new Error('SWAGGER_USER / SWAGGER_PASSWORD tanımlı değil. .env dosyasını kontrol et');

    app.use(
      '/docs',
      basicAuth({
        challenge: true,
        users: {
          [swaggerUser]: swaggerPassword
        }
      }),
    )

    const config = new DocumentBuilder()
      .setTitle("Languruu")
      .setDescription("Languruu API")
      .setVersion('1.0')
      .addBearerAuth()
      .build()

    const documentFactory = () => SwaggerModule.createDocument(app, config)
    SwaggerModule.setup('docs', app, documentFactory, { customSiteTitle: 'Languruu' })
  }

  app.use(cookieParser())

  app.useGlobalInterceptors(new LoggingInterceptor());
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
