/**
 * Email helper functions (R-7 extraction from EmailTab.tsx)
 */
import type { EmailThread } from './emailTypes';

/**
 * Groups flat message arrays into threads, sorts by latest message.
 * In search mode, each message becomes its own "thread".
 */
export function buildThreads(messages: any[], isSearchMode: boolean): EmailThread[] {
  if (isSearchMode) {
    return messages.map((msg: any) => ({
      threadId: msg.id,
      messages: [msg],
      latestMessage: msg,
      unreadCount: msg.is_read ? 0 : 1,
      subject: msg.subject || '(Kein Betreff)',
    }));
  }

  const grouped = new Map<string, any[]>();
  for (const msg of messages) {
    const key = msg.thread_id || msg.id;
    const existing = grouped.get(key) || [];
    existing.push(msg);
    grouped.set(key, existing);
  }

  return Array.from(grouped.values())
    .map(msgs => {
      const sorted = msgs.sort(
        (a: any, b: any) => new Date(a.received_at).getTime() - new Date(b.received_at).getTime()
      );
      return {
        threadId: sorted[0].thread_id || sorted[0].id,
        messages: sorted,
        latestMessage: sorted[sorted.length - 1],
        unreadCount: sorted.filter((m: any) => !m.is_read).length,
        subject: sorted[0].subject || '(Kein Betreff)',
      };
    })
    .sort(
      (a, b) =>
        new Date(b.latestMessage.received_at).getTime() -
        new Date(a.latestMessage.received_at).getTime()
    );
}
