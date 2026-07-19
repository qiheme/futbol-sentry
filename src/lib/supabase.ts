import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const url = import.meta.env.PUBLIC_SUPABASE_URL;
const anonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    'PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY must be set (see .env.example).',
  );
}

// Anon-key client: read-only via RLS. Used at build time (getStaticPaths /
// page frontmatter) and inside client islands.
export const supabase = createClient<Database>(url, anonKey);
