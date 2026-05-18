'use server';

import { createClient } from '@/lib/supabase-server';

/**
 * Check if the user's active subscription has expired and update its status.
 * Also runs the global expiry function to clean up any old subscriptions.
 * Returns the current effective subscription after expiry check.
 */
export async function checkAndExpireSubscription() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Unauthorized' };
  }

  // Run global expiry function first (efficient batch update)
  const { data: expiredCount, error: rpcError } = await supabase.rpc('expire_old_subscriptions');

  if (rpcError) {
    console.error('Error running expire_old_subscriptions:', rpcError);
    // Fallback: check user's specific subscription manually
  }

  // Find active/free subscription that might have expired
  const { data: sub } = await supabase
    .from('user_subscriptions')
    .select('id, status, ends_at')
    .eq('user_id', user.id)
    .in('status', ['active', 'free'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (sub && sub.ends_at && new Date(sub.ends_at) < new Date()) {
    // Expire the subscription (fallback if RPC didn't catch it)
    const { error } = await supabase
      .from('user_subscriptions')
      .update({ status: 'expired' })
      .eq('id', sub.id);

    if (error) {
      console.error('Error expiring subscription:', error);
      return { success: false, error: error.message };
    }

    return { success: true, expired: true, subscriptionId: sub.id };
  }

  return { success: true, expired: false };
}
