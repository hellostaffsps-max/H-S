import { createAdminClient } from './supabase-admin';
import { headers } from 'next/headers';

export interface AuditLogEntry {
  admin_id?: string | null;
  admin_name?: string | null;
  admin_username?: string | null;
  action: string;
  target_type: string;
  target_id?: string | null;
  target_name?: string | null;
  details?: Record<string, unknown>;
  ip_address?: string | null;
}

/**
 * Log an admin action to the audit log.
 * Call this after a successful operation in admin API routes.
 */
export async function logAdminAction(entry: AuditLogEntry): Promise<void> {
  try {
    const supabase = createAdminClient();
    await supabase.from('admin_audit_logs').insert({
      admin_id: entry.admin_id,
      admin_name: entry.admin_name,
      admin_username: entry.admin_username,
      action: entry.action,
      target_type: entry.target_type,
      target_id: entry.target_id,
      target_name: entry.target_name,
      details: entry.details || {},
      ip_address: entry.ip_address,
    });
  } catch (err) {
    // Audit logging should never break the main operation
    console.error('[Audit] Failed to log admin action:', err);
  }
}

/**
 * Get client IP address from request headers.
 * Must be called inside a Next.js API route (server-side).
 */
export async function getClientIP(): Promise<string | null> {
  try {
    const h = await headers();
    const forwarded = h.get('x-forwarded-for');
    if (forwarded) return forwarded.split(',')[0]?.trim() || null;
    return h.get('x-real-ip') || null;
  } catch {
    return null;
  }
}

/** Action constants for consistency */
export const AuditActions = {
  JOB_APPROVE: 'job.approve',
  JOB_REJECT: 'job.reject',
  JOB_RENEW: 'job.renew',
  JOB_DELETE: 'job.delete',
  JOB_UPDATE: 'job.update',

  ARTICLE_CREATE: 'article.create',
  ARTICLE_UPDATE: 'article.update',
  ARTICLE_DELETE: 'article.delete',
  ARTICLE_PUBLISH: 'article.publish',

  USER_DELETE: 'user.delete',
  USER_UPDATE_ROLE: 'user.update_role',
  USER_VERIFY: 'user.verify',
  USER_REJECT: 'user.reject',

  MODERATOR_CREATE: 'moderator.create',

  PLAN_CREATE: 'plan.create',
  PLAN_UPDATE: 'plan.update',
  PLAN_DELETE: 'plan.delete',

  SUBSCRIPTION_UPDATE: 'subscription.update',

  ROLE_CREATE: 'role.create',
  ROLE_UPDATE: 'role.update',
  ROLE_DELETE: 'role.delete',

  BROADCAST_SEND: 'broadcast.send',

  SETTINGS_UPDATE: 'settings.update',
} as const;
