import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as Sentry from '@sentry/node';
const Tracing = require('@sentry/tracing');
import { AppModule } from './app.module';
import * as path from 'path';
import { STRAPI_END_POINTS, PROFILE_END_POINTS, OFFRAMP_END_POINTS, WALLET_END_POINTS, ROOT_END_POINTS, SENTRY_LOW_SAMPLING_RATE, SENTRY_MODERATE_SAMPLING_RATE, SENTRY_MINIMUM_SAMPLING_RATE, SENTRY_HIGH_SAMPLING_RATE } from './helpers/constants';

async function bootstrap(): Promise<void> {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);
    if(process.env.NODE_ENV === 'prod'){
      Sentry.init({
        dsn: process.env.SENTRY_DNS,
        environment: process.env.NODE_ENV,
        integrations: [
            new Sentry.Integrations.Http({ tracing: true }),
            new Tracing.Integrations.Express({
                app,
            }),
        ],
        // We recommend adjusting this value in production, or using tracesSampler
        // for finer control
        // tracesSampleRate: 1.0,
        tracesSampler: (samplingContext) => {
            if ( samplingContext.transactionContext.name === STRAPI_END_POINTS) {
                return  SENTRY_LOW_SAMPLING_RATE;
            } else if ([OFFRAMP_END_POINTS, PROFILE_END_POINTS, WALLET_END_POINTS].find(
                url =>
                samplingContext.transactionContext.name.toLowerCase().includes(url)
              )) {
                return SENTRY_MODERATE_SAMPLING_RATE;
            } else if (samplingContext.transactionContext.name === ROOT_END_POINTS) {
                return SENTRY_MINIMUM_SAMPLING_RATE;
            } else {
                return SENTRY_HIGH_SAMPLING_RATE;
            }
        },
    });
    app.use(Sentry.Handlers.requestHandler());
    app.use(Sentry.Handlers.tracingHandler());
    app.use(Sentry.Handlers.errorHandler());
    }
    app.useGlobalPipes(new ValidationPipe());
    app.useStaticAssets(path.join(__dirname, '/../public'));
    app.enableCors();
    const options = new DocumentBuilder()
        .setTitle('IndiGG API')
        .setDescription('IndiGG API')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
    const document = SwaggerModule.createDocument(app, options);
    SwaggerModule.setup('api', app, document);

    const PORT: number | string = process.env.PORT || 3000;
    await app.listen(PORT, () => {
        console.log(
            `Application is running on port ${PORT}. Url: http://localhost:${PORT}`
        );
    });
}

bootstrap();
