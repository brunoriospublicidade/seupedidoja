
import { createClient } from '@supabase/supabase-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const databaseUrl = process.env.DATABASE_URL || '';

console.log('🔍 Available environment keys:', Object.keys(process.env).filter(k => !k.startsWith('NODE_')));

if (!supabaseUrl) console.error('❌ Missing VITE_SUPABASE_URL');
if (!supabaseKey) console.error('❌ Missing VITE_SUPABASE_ANON_KEY');
if (!databaseUrl) console.error('❌ Missing DATABASE_URL');

if (!supabaseUrl || !supabaseKey || !databaseUrl) {
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const sql = postgres(databaseUrl);

async function migrate() {
  console.log('🚀 Starting migration...');

  try {
    // 1. Restaurants
    console.log('📦 Migrating restaurants...');
    const { data: restaurants } = await supabase.from('restaurants').select('*');
    if (restaurants && restaurants.length > 0) {
      for (const res of restaurants) {
        await sql`
          INSERT INTO restaurants ${sql(res)}
          ON CONFLICT (id) DO UPDATE SET ${sql(res)}
        `;
      }
      console.log(`✅ ${restaurants.length} restaurants migrated.`);
    }

    // 2. Categories
    console.log('📦 Migrating categories...');
    const { data: categories } = await supabase.from('categories').select('*');
    if (categories && categories.length > 0) {
      for (const cat of categories) {
        await sql`
          INSERT INTO categories ${sql(cat)}
          ON CONFLICT (id) DO UPDATE SET ${sql(cat)}
        `;
      }
      console.log(`✅ ${categories.length} categories migrated.`);
    }

    // 3. Products
    console.log('📦 Migrating products...');
    const { data: products } = await supabase.from('products').select('*');
    if (products && products.length > 0) {
      for (const prod of products) {
        // Remove optional groups if they are not in the schema yet or handle them
        await sql`
          INSERT INTO products ${sql(prod)}
          ON CONFLICT (id) DO UPDATE SET ${sql(prod)}
        `;
      }
      console.log(`✅ ${products.length} products migrated.`);
    }

    // 4. Optionals
    console.log('📦 Migrating optional groups...');
    const { data: optionalGroups } = await supabase.from('optional_groups').select('*');
    if (optionalGroups && optionalGroups.length > 0) {
      for (const group of optionalGroups) {
        await sql`
          INSERT INTO optional_groups ${sql(group)}
          ON CONFLICT (id) DO UPDATE SET ${sql(group)}
        `;
      }
    }

    const { data: optionalItems } = await supabase.from('optional_items').select('*');
    if (optionalItems && optionalItems.length > 0) {
      for (const item of optionalItems) {
        await sql`
          INSERT INTO optional_items ${sql(item)}
          ON CONFLICT (id) DO UPDATE SET ${sql(item)}
        `;
      }
    }

    console.log('🎉 Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await sql.end();
  }
}

migrate();
