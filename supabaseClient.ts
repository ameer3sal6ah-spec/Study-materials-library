import { createClient, SupabaseClient } from '@supabase/supabase-js';

// IMPORTANT: Replace with your Supabase project's URL and Anon Key.
// You can find these in your Supabase project settings under "API".
// It's recommended to use environment variables for this.
const supabaseUrl = process.env.SUPABASE_URL || 'https://hthqnpbwqshtrgvcaktp.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0aHFucGJ3cXNodHJndmNha3RwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyMjM1NDMsImV4cCI6MjA3Njc5OTU0M30.qFanBNtrIPwoNQoRZMxTTkPWt2lbWTsBHMlD6xuxfgc';

let supabase: SupabaseClient | null = null;

if (supabaseUrl && supabaseUrl !== 'YOUR_SUPABASE_URL' && supabaseAnonKey && supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY') {
    try {
        supabase = createClient(supabaseUrl, supabaseAnonKey);
    } catch (error) {
        console.error("Error creating Supabase client:", error);
    }
} else {
    const warningStyle = 'color: orange; font-size: 14px; font-weight: bold;';
    console.warn('%cSupabase is not configured!', warningStyle);
    console.warn('Please add your Supabase URL and Anon Key in `supabaseClient.ts` to connect to the database.');
}


export { supabase };