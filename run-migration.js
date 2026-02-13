require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function runMigration() {
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY
  );

  try {
    // Read the migration file
    const sql = fs.readFileSync('supabase/migrations/20260132000000_card_template_system.sql', 'utf8');

    // Split into individual statements
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);

    console.log('Running migration...');

    for (const statement of statements) {
      if (statement.trim()) {
        console.log('Executing:', statement.trim().substring(0, 50) + '...');
        const { error } = await supabase.rpc('exec', { query: statement.trim() + ';' });
        if (error) {
          console.error('Error executing statement:', error);
          throw error;
        }
      }
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

runMigration();