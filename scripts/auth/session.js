import { supabase } from '../utils/supabaseClient.js';

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session ?? null;
}

export function onAuthStateChange(handler) {
  return supabase.auth.onAuthStateChange((_event, session) => handler(session ?? null));
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

