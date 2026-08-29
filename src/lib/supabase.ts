// This file previously initialized the Supabase client.
// Now re-exports the new API client for backward compatibility
// during migration. Direct imports from '../lib/api' are preferred.
export { api } from './api.ts';
