
import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL || '';
const sql = postgres(databaseUrl);

async function inspect() {
  try {
    console.log('🔍 Inspecting restaurants table...');
    const columns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'restaurants'
    `;
    console.table(columns);
  } catch (error) {
    console.error('❌ Inspection failed:', error);
  } finally {
    await sql.end();
  }
}

inspect();
