-- ============================================================
-- Migration: consolidate_rls_policies_for_performance
-- Date: 2026-05-11
-- Description: توحيد سياسات RLS المتعددة في سياسة واحدة لكل عملية
--              لتحسين أداء قاعدة البيانات بشكل كبير
-- Affected tables: jobs, messages, articles, platform_settings,
--                  subscription_plans, user_subscriptions,
--                  support_tickets, ticket_replies
-- ============================================================

-- ============================================================
-- 1. جدول jobs
-- ============================================================
DROP POLICY IF EXISTS "Admins can view all jobs." ON public.jobs;
DROP POLICY IF EXISTS "Approved jobs viewable by everyone." ON public.jobs;
DROP POLICY IF EXISTS "Employers can view own jobs." ON public.jobs;
DROP POLICY IF EXISTS "Admins can update any job." ON public.jobs;
DROP POLICY IF EXISTS "Employers can update own jobs." ON public.jobs;

CREATE POLICY "jobs_select_policy" ON public.jobs FOR SELECT
USING (
  status = 'approved'
  OR (select auth.uid()) = employer_id
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (select auth.uid()) AND role = 'admin'
  )
);

CREATE POLICY "jobs_update_policy" ON public.jobs FOR UPDATE
USING (
  (select auth.uid()) = employer_id
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (select auth.uid()) AND role = 'admin'
  )
);

-- ============================================================
-- 2. جدول messages
-- ============================================================
DROP POLICY IF EXISTS "Admins can manage messages." ON public.messages;
DROP POLICY IF EXISTS "Admins can view all messages" ON public.messages;
DROP POLICY IF EXISTS "Users can read own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can view own messages." ON public.messages;
DROP POLICY IF EXISTS "Anonymous contact form inserts" ON public.messages;
DROP POLICY IF EXISTS "Users can insert messages." ON public.messages;
DROP POLICY IF EXISTS "Users can insert own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update received messages" ON public.messages;

CREATE POLICY "messages_select_policy" ON public.messages FOR SELECT
USING (
  (select auth.uid()) = sender_id
  OR (select auth.uid()) = receiver_id
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (select auth.uid()) AND role = 'admin'
  )
);

CREATE POLICY "messages_insert_policy" ON public.messages FOR INSERT
WITH CHECK (
  (select auth.uid()) = sender_id
  OR (select auth.uid()) IS NULL
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (select auth.uid()) AND role = 'admin'
  )
);

CREATE POLICY "messages_update_policy" ON public.messages FOR UPDATE
USING (
  (select auth.uid()) = receiver_id
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (select auth.uid()) AND role = 'admin'
  )
);

CREATE POLICY "messages_delete_policy" ON public.messages FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (select auth.uid()) AND role = 'admin'
  )
);

-- ============================================================
-- 3. جدول articles
-- ============================================================
DROP POLICY IF EXISTS "Admins can view all articles." ON public.articles;
DROP POLICY IF EXISTS "Authors can view own articles" ON public.articles;
DROP POLICY IF EXISTS "Public can view published articles." ON public.articles;
DROP POLICY IF EXISTS "Admins can insert articles." ON public.articles;
DROP POLICY IF EXISTS "Authors can insert own articles" ON public.articles;
DROP POLICY IF EXISTS "Admins can update articles." ON public.articles;
DROP POLICY IF EXISTS "Authors can update own articles" ON public.articles;
DROP POLICY IF EXISTS "Admins can delete articles." ON public.articles;
DROP POLICY IF EXISTS "Authors can delete own articles" ON public.articles;

CREATE POLICY "articles_select_policy" ON public.articles FOR SELECT
USING (
  status = 'published'
  OR (select auth.uid()) = author_id
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (select auth.uid()) AND role = 'admin'
  )
);

CREATE POLICY "articles_insert_policy" ON public.articles FOR INSERT
WITH CHECK (
  (select auth.uid()) = author_id
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (select auth.uid()) AND role = 'admin'
  )
);

CREATE POLICY "articles_update_policy" ON public.articles FOR UPDATE
USING (
  (select auth.uid()) = author_id
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (select auth.uid()) AND role = 'admin'
  )
);

CREATE POLICY "articles_delete_policy" ON public.articles FOR DELETE
USING (
  (select auth.uid()) = author_id
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (select auth.uid()) AND role = 'admin'
  )
);

-- ============================================================
-- 4. جدول platform_settings
-- ============================================================
DROP POLICY IF EXISTS "Admins can manage settings." ON public.platform_settings;
DROP POLICY IF EXISTS "Public can view settings." ON public.platform_settings;

CREATE POLICY "platform_settings_select_policy" ON public.platform_settings FOR SELECT
USING (true);

CREATE POLICY "platform_settings_modify_policy" ON public.platform_settings FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (select auth.uid()) AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (select auth.uid()) AND role = 'admin'
  )
);

-- ============================================================
-- 5. جدول subscription_plans
-- ============================================================
DROP POLICY IF EXISTS "Admins can manage plans." ON public.subscription_plans;
DROP POLICY IF EXISTS "Public can view active plans." ON public.subscription_plans;

CREATE POLICY "subscription_plans_select_policy" ON public.subscription_plans FOR SELECT
USING (
  is_active = true
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (select auth.uid()) AND role = 'admin'
  )
);

CREATE POLICY "subscription_plans_admin_policy" ON public.subscription_plans FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (select auth.uid()) AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (select auth.uid()) AND role = 'admin'
  )
);

-- ============================================================
-- 6. جدول user_subscriptions
-- ============================================================
DROP POLICY IF EXISTS "Admins can manage subscriptions." ON public.user_subscriptions;
DROP POLICY IF EXISTS "Admins can view all subscriptions." ON public.user_subscriptions;
DROP POLICY IF EXISTS "Users can view own subscriptions." ON public.user_subscriptions;
DROP POLICY IF EXISTS "Users can insert own subscriptions" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Users can create own subscriptions" ON public.user_subscriptions;

CREATE POLICY "user_subscriptions_select_policy" ON public.user_subscriptions FOR SELECT
USING (
  (select auth.uid()) = user_id
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (select auth.uid()) AND role = 'admin'
  )
);

CREATE POLICY "user_subscriptions_insert_policy" ON public.user_subscriptions FOR INSERT
WITH CHECK (
  (select auth.uid()) = user_id
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (select auth.uid()) AND role = 'admin'
  )
);

CREATE POLICY "user_subscriptions_admin_modify_policy" ON public.user_subscriptions FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (select auth.uid()) AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (select auth.uid()) AND role = 'admin'
  )
);

-- ============================================================
-- 7. جدول support_tickets
-- ============================================================
DROP POLICY IF EXISTS "Users can create support tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "admin_full_access_tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "users_read_own_tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Admins can read all tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Admins can update tickets" ON public.support_tickets;

CREATE POLICY "support_tickets_select_policy" ON public.support_tickets FOR SELECT
USING (
  (select auth.uid()) = user_id
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (select auth.uid()) AND role = 'admin'
  )
);

CREATE POLICY "support_tickets_insert_policy" ON public.support_tickets FOR INSERT
WITH CHECK (
  (select auth.uid()) = user_id
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (select auth.uid()) AND role = 'admin'
  )
);

CREATE POLICY "support_tickets_update_policy" ON public.support_tickets FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (select auth.uid()) AND role = 'admin'
  )
);

CREATE POLICY "support_tickets_delete_policy" ON public.support_tickets FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (select auth.uid()) AND role = 'admin'
  )
);

-- ============================================================
-- 8. جدول ticket_replies
-- ============================================================
DROP POLICY IF EXISTS "admin_full_access_ticket_replies" ON public.ticket_replies;
DROP POLICY IF EXISTS "users_reply_own_tickets" ON public.ticket_replies;
DROP POLICY IF EXISTS "users_read_own_ticket_replies" ON public.ticket_replies;

CREATE POLICY "ticket_replies_select_policy" ON public.ticket_replies FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.support_tickets st
    WHERE st.id = ticket_id
      AND (
        st.user_id = (select auth.uid())
        OR EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = (select auth.uid()) AND role = 'admin'
        )
      )
  )
);

CREATE POLICY "ticket_replies_insert_policy" ON public.ticket_replies FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.support_tickets st
    WHERE st.id = ticket_id
      AND (
        st.user_id = (select auth.uid())
        OR EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = (select auth.uid()) AND role = 'admin'
        )
      )
  )
);

CREATE POLICY "ticket_replies_admin_policy" ON public.ticket_replies FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (select auth.uid()) AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (select auth.uid()) AND role = 'admin'
  )
);
