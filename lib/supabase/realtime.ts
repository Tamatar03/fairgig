import { supabase } from './client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE';

export interface SubscriptionCallback {
  (payload: any): void;
}

export function subscribeToCheatScores(
  sessionId: string,
  callback: SubscriptionCallback
): RealtimeChannel {
  const channel = supabase
    .channel(`cheat_scores:${sessionId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'cheat_scores',
        filter: `session_id=eq.${sessionId}`,
      },
      callback
    )
    .subscribe();
  
  return channel;
}

export function subscribeToSessions(
  callback: SubscriptionCallback
): RealtimeChannel {
  const channel = supabase
    .channel('exam_sessions')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'exam_sessions',
      },
      callback
    )
    .subscribe();
  
  return channel;
}

export function subscribeToSnapshots(
  sessionId: string,
  callback: SubscriptionCallback
): RealtimeChannel {
  const channel = supabase
    .channel(`snapshots:${sessionId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'suspicious_snapshots',
        filter: `session_id=eq.${sessionId}`,
      },
      callback
    )
    .subscribe();
  
  return channel;
}

export function subscribeToSessionStatus(
  sessionId: string,
  callback: SubscriptionCallback
): RealtimeChannel {
  const channel = supabase
    .channel(`session_status:${sessionId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'exam_sessions',
        filter: `id=eq.${sessionId}`,
      },
      callback
    )
    .subscribe();
  
  return channel;
}

export function unsubscribe(channel: RealtimeChannel): void {
  supabase.removeChannel(channel);
}

export function unsubscribeAll(): void {
  supabase.removeAllChannels();
}

// Broadcast message to a channel (for custom events)
export async function broadcastEvent(
  channelName: string,
  event: string,
  payload: any
): Promise<void> {
  const channel = supabase.channel(channelName);
  await channel.send({
    type: 'broadcast',
    event,
    payload,
  });
}
