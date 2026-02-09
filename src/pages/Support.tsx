import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import BackButton from '../components/BackButton';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';

interface SupportTicket {
  id: string;
  ticket_number: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  description: string;
  booking_id: string | null;
  created_at: string;
  updated_at: string;
}

export default function Support() {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const [view, setView] = useState<'list' | 'create'>('list');
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [bookings, setBookings] = useState<Array<{ id: string; service_name: string; scheduled_date: string }>>([]);

  const [formData, setFormData] = useState({
    subject: '',
    category: 'booking_issue',
    priority: 'medium',
    description: '',
    booking_id: '',
  });

  useEffect(() => {
    loadTickets();
    loadBookings();
  }, []);

  const loadTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('pet_master_id', profile?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error('Error loading tickets:', error);
      showToast('Failed to load support tickets', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('id, service_name, scheduled_date')
        .eq('owner_id', profile?.id)
        .order('scheduled_date', { ascending: false })
        .limit(20);

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error('Error loading bookings:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('support_tickets')
        .insert({
          pet_master_id: profile?.id,
          subject: formData.subject,
          category: formData.category,
          priority: formData.priority,
          description: formData.description,
          booking_id: formData.booking_id || null,
          status: 'open',
        });

      if (error) throw error;

      showToast('Support ticket created successfully', 'success');
      setFormData({
        subject: '',
        category: 'booking_issue',
        priority: 'medium',
        description: '',
        booking_id: '',
      });
      setView('list');
      await loadTickets();
    } catch (error) {
      console.error('Error creating ticket:', error);
      showToast('Failed to create support ticket', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return { bg: '#fef2f2', text: '#991b1b', border: '#ef4444' };
      case 'high':
        return { bg: '#fff7ed', text: '#9a3412', border: '#f97316' };
      case 'medium':
        return { bg: '#fef3c7', text: '#92400e', border: '#f59e0b' };
      default:
        return { bg: '#f0f9ff', text: '#0369a1', border: '#0ea5e9' };
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
      case 'closed':
        return { bg: '#f0fdf4', text: '#166534', border: '#10b981' };
      case 'in_progress':
        return { bg: '#fef3c7', text: '#92400e', border: '#f59e0b' };
      case 'waiting_response':
        return { bg: '#f3e8ff', text: '#6b21a8', border: '#a855f7' };
      default:
        return { bg: '#f0f9ff', text: '#0369a1', border: '#0ea5e9' };
    }
  };

  if (loading) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid #e2e8f0',
            borderTopColor: '#0ea5e9',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
          }} />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ marginBottom: '16px' }}>
          <BackButton color="#0ea5e9" />
        </div>

        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '8px' }}>
            Support Center
          </h1>
          <p style={{ color: '#64748b' }}>
            Get help with your bookings or report issues
          </p>
        </div>

        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => setView('list')}
              style={{
                padding: '10px 20px',
                background: view === 'list' ? '#0ea5e9' : 'white',
                color: view === 'list' ? 'white' : '#64748b',
                border: `1px solid ${view === 'list' ? '#0ea5e9' : '#e2e8f0'}`,
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              My Tickets
            </button>
            <button
              onClick={() => setView('create')}
              style={{
                padding: '10px 20px',
                background: view === 'create' ? '#0ea5e9' : 'white',
                color: view === 'create' ? 'white' : '#64748b',
                border: `1px solid ${view === 'create' ? '#0ea5e9' : '#e2e8f0'}`,
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Create Ticket
            </button>
          </div>
        </div>

        {view === 'list' ? (
          <div>
            {tickets.length === 0 ? (
              <div style={{
                background: 'white',
                padding: '60px 40px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                textAlign: 'center'
              }}>
                <p style={{ fontSize: '1.125rem', color: '#64748b', marginBottom: '16px' }}>
                  No support tickets yet
                </p>
                <button
                  onClick={() => setView('create')}
                  style={{
                    padding: '12px 24px',
                    background: '#0ea5e9',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Create Your First Ticket
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '16px' }}>
                {tickets.map(ticket => {
                  const priorityColors = getPriorityColor(ticket.priority);
                  const statusColors = getStatusColor(ticket.status);

                  return (
                    <div
                      key={ticket.id}
                      style={{
                        background: 'white',
                        padding: '24px',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600' }}>
                              #{ticket.ticket_number}
                            </span>
                            <span style={{
                              padding: '2px 8px',
                              background: priorityColors.bg,
                              color: priorityColors.text,
                              border: `1px solid ${priorityColors.border}`,
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: '600',
                              textTransform: 'uppercase'
                            }}>
                              {ticket.priority}
                            </span>
                          </div>
                          <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '8px' }}>
                            {ticket.subject}
                          </h3>
                          <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>
                            {ticket.description.length > 150
                              ? `${ticket.description.substring(0, 150)}...`
                              : ticket.description}
                          </p>
                          <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#94a3b8' }}>
                            <span>Category: {ticket.category.replace('_', ' ')}</span>
                            <span>Created: {new Date(ticket.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <span style={{
                          padding: '6px 12px',
                          background: statusColors.bg,
                          color: statusColors.text,
                          border: `1px solid ${statusColors.border}`,
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '600',
                          textTransform: 'capitalize',
                          whiteSpace: 'nowrap'
                        }}>
                          {ticket.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{
            background: 'white',
            padding: '32px',
            borderRadius: '12px',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle}>Subject *</label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                required
                placeholder="Brief description of your issue"
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle}>Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
                style={inputStyle}
              >
                <option value="booking_issue">Booking Issue</option>
                <option value="payment">Payment Problem</option>
                <option value="provider_complaint">Provider Complaint</option>
                <option value="technical">Technical Issue</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle}>Priority *</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                required
                style={inputStyle}
              >
                <option value="low">Low - General question</option>
                <option value="medium">Medium - Issue affecting experience</option>
                <option value="high">High - Urgent issue</option>
                <option value="urgent">Urgent - Critical problem</option>
              </select>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle}>Related Booking (Optional)</label>
              <select
                value={formData.booking_id}
                onChange={(e) => setFormData({ ...formData, booking_id: e.target.value })}
                style={inputStyle}
              >
                <option value="">No related booking</option>
                {bookings.map(booking => (
                  <option key={booking.id} value={booking.id}>
                    {booking.service_name} - {new Date(booking.scheduled_date).toLocaleDateString()}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle}>Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                placeholder="Please provide detailed information about your issue..."
                rows={6}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: submitting ? '#94a3b8' : '#0ea5e9',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: submitting ? 'not-allowed' : 'pointer'
                }}
              >
                {submitting ? 'Submitting...' : 'Submit Ticket'}
              </button>
              <button
                type="button"
                onClick={() => setView('list')}
                disabled={submitting}
                style={{
                  padding: '12px 24px',
                  background: 'white',
                  color: '#64748b',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: submitting ? 'not-allowed' : 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </Layout>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: '8px',
  color: '#334155',
  fontSize: '14px',
  fontWeight: '500'
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  fontSize: '14px',
  outline: 'none'
};
