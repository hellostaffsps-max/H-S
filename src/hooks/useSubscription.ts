import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export interface SubscriptionFeatures {
  plan_id: string;
  plan_name: string;
  status: 'active' | 'pending' | 'free' | 'none';
  job_limit: number;
  allow_articles: boolean;
  featured_listings: boolean;
  max_articles_per_month: number;
  allow_ads: boolean;
  price: number;
  current_job_count: number;
}

const DEFAULT_FREE_FEATURES: SubscriptionFeatures = {
  plan_id: 'free_fallback',
  plan_name: 'الباقة المجانية',
  status: 'none',
  job_limit: 1,
  allow_articles: false,
  featured_listings: false,
  max_articles_per_month: 0,
  allow_ads: false,
  price: 0,
  current_job_count: 0,
};

export function useSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionFeatures>(DEFAULT_FREE_FEATURES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    async function fetchSubscription() {
      try {
        // Fetch job count
        const { count: jobCount } = await supabase
          .from('jobs')
          .select('*', { count: 'exact', head: true })
          .eq('employer_id', user?.id)
          .neq('status', 'closed');

        // 1. Try to find an ACTIVE or FREE subscription
        const { data: activeSub } = await supabase
          .from('user_subscriptions')
          .select('status, plan_id, plan_name, created_at, subscription_plans(id, name, job_limit, allow_articles, featured_listings, max_articles_per_month, allow_ads, price)')
          .eq('user_id', user?.id)
          .in('status', ['active', 'free'])
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (activeSub) {
          if (activeSub.subscription_plans) {
            const plan = Array.isArray(activeSub.subscription_plans)
              ? activeSub.subscription_plans[0]
              : activeSub.subscription_plans;
            if (plan) {
              setSubscription({
                plan_id: plan.id,
                plan_name: plan.name,
                status: activeSub.status as 'active' | 'free',
                job_limit: plan.job_limit || 0,
                allow_articles: plan.allow_articles || false,
                featured_listings: plan.featured_listings || false,
                max_articles_per_month: plan.max_articles_per_month || 0,
                allow_ads: plan.allow_ads || false,
                price: plan.price || 0,
                current_job_count: jobCount || 0,
              });
            } else {
              setSubscription({ ...DEFAULT_FREE_FEATURES, status: activeSub.status as 'active' | 'free', current_job_count: jobCount || 0 });
            }
          } else {
            // Subscription is ACTIVE but has no linked plan_id (e.g. manual/legacy)
            // Use defaults but keep status as active
            setSubscription({
              plan_id: 'manual_plan',
              plan_name: activeSub.plan_name || 'باقة مخصصة',
              status: activeSub.status as 'active' | 'free',
              job_limit: 10, // Generous default for manual activations
              allow_articles: true,
              featured_listings: true,
              max_articles_per_month: 5,
              allow_ads: true,
              price: 0,
              current_job_count: jobCount || 0,
            });
          }
          setLoading(false);
          return;
        }

        // 2. If no active sub, check if they have a PENDING one (for UI info)
        const { data: pendingSub } = await supabase
          .from('user_subscriptions')
          .select('status, plan_id, plan_name, created_at, subscription_plans(id, name, job_limit, allow_articles, featured_listings, max_articles_per_month, allow_ads, price)')
          .eq('user_id', user?.id)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        // 3. Regardless of pending, we also need the REAL Free Plan features from the DB
        const { data: freePlan } = await supabase
          .from('subscription_plans')
          .select('id, name, job_limit, allow_articles, featured_listings, max_articles_per_month, allow_ads, price')
          .eq('price', 0)
          .eq('is_active', true)
          .limit(1)
          .maybeSingle();

        if (freePlan) {
          setSubscription({
            plan_id: freePlan.id,
            plan_name: freePlan.name,
            status: pendingSub ? 'pending' : 'none',
            job_limit: freePlan.job_limit || 0,
            allow_articles: freePlan.allow_articles || false,
            featured_listings: freePlan.featured_listings || false,
            max_articles_per_month: freePlan.max_articles_per_month || 0,
            allow_ads: freePlan.allow_ads || false,
            price: 0,
            current_job_count: jobCount || 0,
          });
        } else {
          setSubscription({
            ...DEFAULT_FREE_FEATURES,
            status: pendingSub ? 'pending' : 'none',
            current_job_count: jobCount || 0,
          });
        }
      } catch (err) {
        console.error('Error fetching subscription:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchSubscription();
  }, [user]);

  return { subscription, loading };
}
