import { supabase } from './supabase';

/** Subscribe an email to the WIC newsletter. Public insert-only (see RLS policy). */
export async function subscribeToNewsletter(email: string): Promise<{ success: boolean; error?: string }> {
  const trimmed = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return { success: false, error: 'Please enter a valid email address.' };
  }
  try {
    const { error } = await supabase.from('newsletter_subscribers').insert({ email: trimmed });
    if (error) {
      // Unique violation = already subscribed, treat as success
      if (error.code === '23505') return { success: true };
      return { success: false, error: 'Could not subscribe right now. Please try again later.' };
    }
    return { success: true };
  } catch {
    return { success: false, error: 'No internet connection. Please try again later.' };
  }
}
