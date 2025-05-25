import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessageEntity } from '../entities/message.entity';
import 'dotenv/config';

  const entities = [
    MessageEntity
  ]
  @Module({
    imports: [
      TypeOrmModule.forRoot({
        type: process.env.DATABASE_TYPE as any,
        host: process.env.DATABASE_HOST,
        port: Number(process.env.DATABASE_PORT),
        username: process.env.DATABASE_USERNAME,
        password: process.env.DATABASE_PASSWORD,
        database: process.env.DATABASE_NAME,
        entities: entities,
        synchronize: true,
        logging: false,
      }),
      TypeOrmModule.forFeature(entities)
    ],
    exports: [TypeOrmModule]
  })
  export class DbConfigModule { }
  