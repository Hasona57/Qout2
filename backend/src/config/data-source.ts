import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import * as path from 'path';

config();

// Support both DATABASE_URL and individual DB_* variables
const getDatabaseConfig = () => {
  // If DATABASE_URL is provided, use it
  if (process.env.DATABASE_URL) {
    return {
      url: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    };
  }

  // Otherwise, use individual variables
  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'Hassanebad.90',
    database: process.env.DB_DATABASE || 'postgres',
    ssl: process.env.DB_SSL === 'true' || process.env.NODE_ENV === 'production' 
      ? { rejectUnauthorized: false } 
      : false,
  };
};

export const AppDataSource = new DataSource({
  type: 'postgres',
  ...getDatabaseConfig(),
  entities: [path.join(__dirname, '../**/*.entity{.ts,.js}')],
  migrations: [path.join(__dirname, '../database/migrations/*{.ts,.js}')],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
});
