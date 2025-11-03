import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../shared/schema';

const connectionString = 'postgresql://postgres.xuwpnyegbcaockhherfz:V6C2w9g2FVvGVWCR@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres';

const client = postgres(connectionString, {
  prepare: false,
});

export const db = drizzle(client, { schema });
