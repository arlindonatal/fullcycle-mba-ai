import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
void NestFactory.createApplicationContext(AppModule);
