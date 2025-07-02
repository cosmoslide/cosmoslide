import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST') || configService.get('DB_HOST'),
        port: +configService.get('DATABASE_PORT') || +configService.get('DB_PORT'),
        username: configService.get('DATABASE_USERNAME') || configService.get('DB_USERNAME'),
        password: configService.get('DATABASE_PASSWORD') || configService.get('DB_PASSWORD'),
        database: configService.get('DATABASE_NAME') || configService.get('DB_DATABASE'),
        entities: [__dirname + '/../**/*.entity{.ts,.js}'],
        synchronize: configService.get('NODE_ENV') === 'development',
        logging: configService.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}