import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

// Use compiled JS files in production, TS files in development
const isProduction = process.env.NODE_ENV === 'production';
const entityPattern = isProduction ? 'dist/**/*.entity.js' : 'src/**/*.entity.ts';
const migrationPattern = isProduction ? 'dist/migrations/*.js' : 'src/migrations/*.ts';

export default new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || process.env.DB_PORT || '5432'),
  username:
    process.env.DATABASE_USERNAME || process.env.DB_USERNAME || 'postgres',
  password:
    process.env.DATABASE_PASSWORD || process.env.DB_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || process.env.DB_DATABASE || 'cosmoslide',
  entities: [entityPattern],
  migrations: [migrationPattern],
  synchronize: false, // Always false for CLI - use migrations instead
});
