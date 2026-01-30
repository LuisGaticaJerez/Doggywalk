import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { ChatBubble } from '../components/ChatBubble';
import { ChatInput } from '../components/ChatInput';
import { useChat } from '../hooks/useChat';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';
import type { Booking, Profile } from '../types';

export function Chat() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [otherUser, setOtherUser] = useState<Profile | null>(null);
  const [loadingBooking, setLoadingBooking] = useState(true);

  const {
    messages,
    loading: loadingMessages,
    sending,
    sendMessage,
    markAllAsRead,
  } = useChat(bookingId || null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (messages.length > 0) {
      markAllAsRead();
    }
  }, [messages, markAllAsRead]);

  useEffect(() => {
    if (!bookingId) return;

    const loadBooking = async () => {
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select('*')
          .eq('id', bookingId)
          .single();

        if (error) throw error;
        if (!data) {
          showToast('Booking not found', 'error');
          navigate('/bookings');
          return;
        }

        if (data.owner_id !== user?.id && data.pet_master_id !== user?.id) {
          showToast('You do not have access to this chat', 'error');
          navigate('/bookings');
          return;
        }

        setBooking(data);

        const otherUserId =
          data.owner_id === user?.id ? data.pet_master_id : data.owner_id;

        if (otherUserId) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', otherUserId)
            .single();

          if (profileData) {
            setOtherUser(profileData);
          }
        }
      } catch (error) {
        console.error('Error loading booking:', error);
        showToast('Failed to load booking', 'error');
      } finally {
        setLoadingBooking(false);
      }
    };

    loadBooking();
  }, [bookingId, user?.id, navigate, showToast]);

  const handleSendMessage = async (message: string) => {
    try {
      await sendMessage(message);
    } catch (error) {
      showToast('Failed to send message', 'error');
      throw error;
    }
  };

  if (loadingBooking) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  if (!booking) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-600">Booking not found</p>
          <Link
            to="/bookings"
            className="text-blue-500 hover:text-blue-600 mt-4 inline-block"
          >
            Back to Bookings
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col h-[calc(100vh-200px)]">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 flex items-center gap-4 shadow-sm">
            <button
              onClick={() => navigate('/bookings')}
              className="hover:bg-blue-600 p-2 rounded-full transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            <div className="flex items-center gap-3 flex-1">
              {otherUser?.avatar_url ? (
                <img
                  src={otherUser.avatar_url}
                  alt={otherUser.full_name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-white"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-white bg-opacity-20 flex items-center justify-center text-white text-xl font-bold">
                  {otherUser?.full_name?.charAt(0).toUpperCase() || '?'}
                </div>
              )}

              <div>
                <h2 className="font-semibold text-lg">
                  {otherUser?.full_name || 'Unknown User'}
                </h2>
                <p className="text-sm text-blue-100">
                  {booking.status === 'in_progress'
                    ? 'Service in progress'
                    : booking.status === 'completed'
                    ? 'Service completed'
                    : booking.status === 'accepted'
                    ? 'Service accepted'
                    : 'Service pending'}
                </p>
              </div>
            </div>

            <Link
              to={`/bookings/${bookingId}`}
              className="hover:bg-blue-600 p-2 rounded-full transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </Link>
          </div>

          <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
            {loadingMessages ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <svg
                  className="w-16 h-16 text-gray-300 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                <p className="text-gray-500 text-lg font-medium">
                  No messages yet
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  Start the conversation by sending a message
                </p>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <ChatBubble
                    key={message.id}
                    message={message}
                    isOwnMessage={message.sender_id === user?.id}
                  />
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          <ChatInput
            onSendMessage={handleSendMessage}
            disabled={sending || booking.status === 'cancelled'}
            placeholder={
              booking.status === 'cancelled'
                ? 'This booking has been cancelled'
                : 'Type a message...'
            }
          />
        </div>
      </div>
    </Layout>
  );
}
