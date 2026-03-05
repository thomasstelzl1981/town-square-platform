/**
 * Email module types & constants (R-7 extraction from EmailTab.tsx)
 */
import { Inbox, Send, FileEdit, Trash2, Archive } from 'lucide-react';
import React from 'react';

export type EmailProvider = 'google' | 'microsoft' | 'imap';

export interface EmailAccount {
  id: string;
  provider: EmailProvider;
  email_address: string;
  display_name: string;
  sync_status: 'connected' | 'syncing' | 'error' | 'disconnected';
  last_sync_at: string | null;
}

export interface EmailFolder {
  id: string;
  name: string;
  icon: React.ReactNode;
  count?: number;
}

export interface EmailThread {
  threadId: string;
  messages: any[];
  latestMessage: any;
  unreadCount: number;
  subject: string;
}

export const folders: EmailFolder[] = [
  { id: 'inbox', name: 'Eingang', icon: React.createElement(Inbox, { className: 'h-4 w-4' }) },
  { id: 'sent', name: 'Gesendet', icon: React.createElement(Send, { className: 'h-4 w-4' }) },
  { id: 'drafts', name: 'Entwürfe', icon: React.createElement(FileEdit, { className: 'h-4 w-4' }) },
  { id: 'trash', name: 'Papierkorb', icon: React.createElement(Trash2, { className: 'h-4 w-4' }) },
  { id: 'archive', name: 'Archiv', icon: React.createElement(Archive, { className: 'h-4 w-4' }) },
];
