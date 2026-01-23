import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: process.env.NODE_ENV === 'production'
      ? [
        process.env.FRONTEND_STORE_URL || 'http://localhost:3001',
        process.env.FRONTEND_ADMIN_URL || 'http://localhost:3002',
        process.env.FRONTEND_POS_URL || 'http://localhost:3003',
      ]
      : true, // Allow all origins in development
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global prefix for API routes (except health check)
  app.setGlobalPrefix('api', {
    exclude: ['health'],
  });

  // Global interceptors
  app.useGlobalInterceptors(new TransformInterceptor());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle('Qote Abaya API')
    .setDescription('Full Web ERP + E-commerce + Web POS API')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication & Authorization')
    .addTag('products', 'Product Catalog Management')
    .addTag('inventory', 'Inventory Management')

    .addTag('sales', 'Sales & POS')
    .addTag('ecommerce', 'E-commerce Orders')
    .addTag('shipping', 'Shipping & Delivery')
    .addTag('payments', 'Payment Processing')
    .addTag('reports', 'Reports & Analytics')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  // Debug logging filter
  const logger = new Logger('GlobalFilter');
  app.useGlobalFilters(new (class {
    catch(exception: any, host: any) {
      const ctx = host.switchToHttp();
      const response = ctx.getResponse();
      const request = ctx.getRequest();
      const status = exception.getStatus ? exception.getStatus() : 500;

      const logMessage = `${request.method} ${request.url} - Status: ${status} - Error: ${JSON.stringify(exception.message || exception)}`;

      if (status >= 500) {
        logger.error(logMessage, exception.stack);
      } else {
        logger.warn(logMessage);
      }

      response
        .status(status)
        .json({
          statusCode: status,
          timestamp: new Date().toISOString(),
          path: request.url,
          message: exception.message || 'Internal server error',
        });
    }
  })());

  await app.listen(port);
  console.log(`🚀 Application is running on: http://localhost:${port}/api`);

  console.log('----------------------------------------------------');
  console.log('    QOTE BACKEND STARTING - V6 UNIFIED TIMELINE     ');
  console.log('    DB HOST: ' + (process.env.DB_HOST || 'localhost'));
  console.log('    DB NAME: ' + (process.env.DB_DATABASE || 'qote_db'));
  console.log('----------------------------------------------------');

  console.log(`🔄 Last updated: ${new Date().toISOString()}`);
  console.log(`📚 Swagger docs available at: http://localhost:${port}/api/docs`);
}

bootstrap();

