import { MiddlewareConsumer, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HttpModule } from '@nestjs/axios';
import { AuthModule } from './modules/auth/auth.module';
import { ProtectedModule } from './modules/protected/protected.module';
import { UserContextMiddleware } from './common/user-context.middleware';
import { ChatModule } from './modules/chat/chat.module';
import { DataSource } from 'typeorm';
import { DbConfigModule } from './shared/config/dbconfig.module';

@Module({
  imports: [DbConfigModule, HttpModule, AuthModule, ProtectedModule, ChatModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(UserContextMiddleware)
      .forRoutes('*'); 
  }
}
