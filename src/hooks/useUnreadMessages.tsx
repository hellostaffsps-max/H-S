import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from './useAuth';

interface UnreadMessagesContextValue {
  unreadCount: number;
}

const UnreadMessagesContext = createContext<UnreadMessagesContextValue>({
  unreadCount: 0,
});

export function UnreadMessagesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    if (!isSupabaseConfigured || !user) return;

    try {
      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .eq('is_read', false);

      if (!error && count !== null) {
        setUnreadCount(count);
      }
    } catch (e) {
      console.error('Error fetching unread messages count:', e);
    }
  }, [user]);

  useEffect(() => {
    fetchUnreadCount();

    if (!user) return;

    // Listen for new messages in realtime
    const channel = supabase
      .channel(`unread-messages:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`,
        },
        () => {
          setUnreadCount((prev) => prev + 1);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`,
        },
        (payload) => {
          // When a message is marked as read, decrease count
          if (payload.new && (payload.new as any).is_read === true && payload.old && (payload.old as any).is_read === false) {
            setUnreadCount((prev) => Math.max(0, prev - 1));
          }
        }
      )
      .subscribe();

    // Also refresh count periodically (every 30 seconds)
    const interval = setInterval(fetchUnreadCount, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [user, fetchUnreadCount]);

  return (
    <UnreadMessagesContext.Provider value={{ unreadCount }}>
      {children}
    </UnreadMessagesContext.Provider>
  );
}

export function useUnreadMessages() {
  return useContext(UnreadMessagesContext);
}
