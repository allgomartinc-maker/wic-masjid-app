/**
 * Admin authentication & role helpers, built on Supabase Auth.
 * Admins sign in with an email magic link (no passwords to leak/reuse).
 * Their role is looked up from the admin_users table (see schema.sql),
 * which is enforced server-side via Row Level Security — the client-side
 * role check here is only used to control which admin UI is shown, not as
 * the actual security boundary.
 */
import { supabase } from './supabase';
import type { AdminRole } from './database.types';

export interface AdminSession {
  userId: string;
  email: string | null;
  role: AdminRole;
  displayName: string | null;
}

export async function sendAdminMagicLink(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { shouldCreateUser: false },
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch {
    return { success: false, error: 'Network error. Please try again.' };
  }
}

export async function getCurrentAdminSession(): Promise<AdminSession | null> {
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;
  if (!user) return null;

  const { data, error } = await supabase
    .from('admin_users')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (error || !data) return null;

  return {
    userId: user.id,
    email: user.email ?? null,
    role: data.role,
    displayName: data.display_name,
  };
}

export async function signOutAdmin(): Promise<void> {
  await supabase.auth.signOut();
}

export function roleCanManage(role: AdminRole, area: 'prayer' | 'content' | 'events' | 'all'): boolean {
  if (role === 'super_admin') return true;
  if (area === 'all') return false;
  if (area === 'prayer') return role === 'masjid_admin';
  if (area === 'content') return role === 'masjid_admin' || role === 'content_editor';
  if (area === 'events') return role === 'masjid_admin' || role === 'events_manager';
  return false;
}

export async function logAdminAction(
  action: string,
  tableName: string,
  recordId: string | null,
  details?: Record<string, unknown>
): Promise<void> {
  try {
    const { data: authData } = await supabase.auth.getUser();
    await supabase.from('audit_log').insert({
      admin_id: authData.user?.id ?? null,
      action,
      table_name: tableName,
      record_id: recordId,
      details: details ?? null,
    });
  } catch {
    // Best-effort logging; never block the actual action on this failing.
  }
}
