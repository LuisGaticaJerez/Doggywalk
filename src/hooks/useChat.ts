import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { uploadPhoto, compressImage } from '../utils/photoStorage';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface ChatMessage {
  id: string;
  booking_id: string;
  sender_id: string;
  message: string;
  image_url: string | null;
  read_at: string | null;
  created_at: string;
  sender?: {
    full_name: string;
    avatar_url: string | null;
  };
}

export function useChat(bookingId: string | null) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadMessages = useCallback(async () => {
    if (!bookingId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          sender:profiles!sender_id (
            full_name,
            avatar_url
          )
        `)
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      const unread = (data || []).filter(
        (msg) => msg.sender_id !== user?.id && !msg.read_at
      ).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  }, [bookingId, user?.id]);

  const sendMessage = useCallback(async (message: string, photoFile?: File) => {
    if (!bookingId || !user?.id) return;
    if (!message.trim() && !photoFile) return;

    setSending(true);
    try {
      let imageUrl: string | null = null;

      if (photoFile) {
        const compressed = await compressImage(photoFile);
        imageUrl = await uploadPhoto(bookingId, compressed);
      }

      const { error } = await supabase.from('chat_messages').insert({
        booking_id: bookingId,
        sender_id: user.id,
        message: message.trim() || (photoFile ? 'Photo' : ''),
        image_url: imageUrl,
      });

      if (error) throw error;

      await loadMessages();
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    } finally {
      setSending(false);
    }
  }, [bookingId, user?.id, loadMessages]);

  const markAsRead = useCallback(async (messageId: string) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('chat_messages')
        .update({ read_at: new Date().toISOString() })
        .eq('id', messageId)
        .is('read_at', null);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  }, [user?.id]);

  const markAllAsRead = useCallback(async () => {
    if (!bookingId || !user?.id) return;

    try {
      const { error } = await supabase
        .from('chat_messages')
        .update({ read_at: new Date().toISOString() })
        .eq('booking_id', bookingId)
        .neq('sender_id', user.id)
        .is('read_at', null);

      if (error) throw error;
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }, [bookingId, user?.id]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    if (!bookingId) return;

    let channel: RealtimeChannel;

    const setupRealtimeSubscription = async () => {
      try {
        channel = supabase
          .channel(`chat:${bookingId}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'chat_messages',
              filter: `booking_id=eq.${bookingId}`,
            },
            async (payload) => {
              const { data: senderData } = await supabase
                .from('profiles')
                .select('full_name, avatar_url')
                .eq('id', payload.new.sender_id)
                .maybeSingle();

              const newMessage = {
                ...payload.new,
                sender: senderData || undefined,
              } as ChatMessage;

              setMessages((prev) => [...prev, newMessage]);

              if (newMessage.sender_id !== user?.id) {
                setUnreadCount((prev) => prev + 1);
              }
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'chat_messages',
              filter: `booking_id=eq.${bookingId}`,
            },
            (payload) => {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === payload.new.id ? { ...msg, ...payload.new } : msg
                )
              );

              if (payload.new.read_at && payload.new.sender_id !== user?.id) {
                setUnreadCount((prev) => Math.max(0, prev - 1));
              }
            }
          )
          .subscribe();
      } catch (error) {
        console.error('Error setting up realtime subscription:', error);
      }
    };

    setupRealtimeSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [bookingId, user?.id]);

  return {
    messages,
    loading,
    sending,
    unreadCount,
    sendMessage,
    markAsRead,
    markAllAsRead,
    refresh: loadMessages,
  };
}
