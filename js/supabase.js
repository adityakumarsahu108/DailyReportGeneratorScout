import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://iobbwsimgogtzlwidrrm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvYmJ3c2ltZ29ndHpsd2lkcnJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2MjAwMjIsImV4cCI6MjEwMDE5NjAyMn0.VVMz4f9gcWE7qIR-_XY2lLCxH3SuwU5PKEuR4yWGLmg";

export const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);
