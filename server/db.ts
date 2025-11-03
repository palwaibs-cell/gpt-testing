import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../shared/schema';

const connectionString = process.env.DATABASE_URL ||
  `postgresql://postgres.xuwpnyegbcaockhherfz:${process.env.DB_PASSWORD || 'postgres'}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`;

const client = postgres(connectionString);
export const db = drizzle(client, { schema });
