import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import BackButton from '../components/BackButton';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';

interface DashboardMetrics {
  totalUsers: number;
  totalProviders: number;
  pendingProviders: number;
  activeBookings: number;
  totalRevenue: number;
  openTickets: number;
}

interface PendingProvider {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  created_at: string;
  onboarding_status: string;
  identity_verified: boolean;
}

interface SupportTicket {
  id: string;
  ticket_number: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  pet_master_id: string;
  created_at: string;
  pet_masters: {
    profiles: { full_name: string; email: string };
  };
}

export default function AdminDashboard() {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'providers' | 'tickets'>('overview');
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalUsers: 0,
    totalProviders: 0,
    pendingProviders: 0,
    activeBookings: 0,
    totalRevenue: 0,
    openTickets: 0,
  });
  const [pendingProviders, setPendingProviders] = useState<PendingProvider[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [processingAction, setProcessingAction] = useState<string | null>(null);

  useEffect(() => {
    if (!profile?.is_admin) {
      showToast('Access denied. Admin privileges required.', 'error');
      navigate('/dashboard');
      return;
    }
    loadDashboardData();
  }, [profile]);

  const loadDashboardData = async () => {
    try {
      await Promise.all([
        loadMetrics(),
        loadPendingProviders(),
        loadTickets(),
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      showToast('Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadMetrics = async () => {
    const { count: totalUsers } = await supabase
      .from('pet_masters')
      .select('*', { count: 'exact', head: true });

    const { count: totalProviders } = await supabase
      .from('pet_masters')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'pet_master');

    const { count: pendingProviders } = await supabase
      .from('pet_masters')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'pet_master')
      .eq('onboarding_status', 'pending');

    const { count: activeBookings } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .in('status', ['pending', 'accepted', 'in_progress']);

    const { data: revenueData } = await supabase
      .from('bookings')
      .select('total_amount')
      .eq('status', 'completed');

    const totalRevenue = revenueData?.reduce((sum, b) => sum + (parseFloat(b.total_amount?.toString() || '0')), 0) || 0;

    const { count: openTickets } = await supabase
      .from('support_tickets')
      .select('*', { count: 'exact', head: true })
      .in('status', ['open', 'in_progress', 'waiting_response']);

    setMetrics({
      totalUsers: totalUsers || 0,
      totalProviders: totalProviders || 0,
      pendingProviders: pendingProviders || 0,
      activeBookings: activeBookings || 0,
      totalRevenue,
      openTickets: openTickets || 0,
    });
  };

  const loadPendingProviders = async () => {
    const { data, error } = await supabase
      .from('pet_masters')
      .select('id, profiles(full_name, email, phone), created_at, onboarding_status, identity_verified')
      .eq('role', 'pet_master')
      .in('onboarding_status', ['pending', 'incomplete'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading pending providers:', error);
      return;
    }

    const formatted = data?.map((pm: any) => ({
      id: pm.id,
      full_name: pm.profiles?.full_name || 'Unknown',
      email: pm.profiles?.email || 'Unknown',
      phone: pm.profiles?.phone || 'N/A',
      created_at: pm.created_at,
      onboarding_status: pm.onboarding_status,
      identity_verified: pm.identity_verified,
    })) || [];

    setPendingProviders(formatted);
  };

  const loadTickets = async () => {
    const { data, error } = await supabase
      .from('support_tickets')
      .select(`
        *,
        pet_masters (
          profiles (full_name, email)
        )
      `)
      .in('status', ['open', 'in_progress', 'waiting_response'])
      .order('priority', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error loading tickets:', error);
      return;
    }

    setTickets(data || []);
  };

  const handleApproveProvider = async (providerId: string) => {
    setProcessingAction(providerId);
    try {
      const { error } = await supabase
        .from('pet_masters')
        .update({ onboarding_status: 'approved' })
        .eq('id', providerId);

      if (error) throw error;

      await supabase.from('notifications').insert({
        pet_master_id: providerId,
        type: 'provider_approved',
        title: 'Provider Application Approved',
        message: 'Congratulations! Your provider application has been approved. You can now start accepting bookings.',
        is_read: false,
      });

      showToast('Provider approved successfully', 'success');
      await loadDashboardData();
    } catch (error) {
      console.error('Error approving provider:', error);
      showToast('Failed to approve provider', 'error');
    } finally {
      setProcessingAction(null);
    }
  };

  const handleRejectProvider = async (providerId: string) => {
    setProcessingAction(providerId);
    try {
      const { error } = await supabase
        .from('pet_masters')
        .update({ onboarding_status: 'rejected' })
        .eq('id', providerId);

      if (error) throw error;

      await supabase.from('notifications').insert({
        pet_master_id: providerId,
        type: 'provider_rejected',
        title: 'Provider Application Update',
        message: 'Your provider application requires additional information. Please contact support for details.',
        is_read: false,
      });

      showToast('Provider application rejected', 'success');
      await loadDashboardData();
    } catch (error) {
      console.error('Error rejecting provider:', error);
      showToast('Failed to reject provider', 'error');
    } finally {
      setProcessingAction(null);
    }
  };

  const handleAssignTicket = async (ticketId: string) => {
    setProcessingAction(ticketId);
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({
          assigned_to: profile?.id,
          status: 'in_progress',
          updated_at: new Date().toISOString(),
        })
        .eq('id', ticketId);

      if (error) throw error;

      showToast('Ticket assigned to you', 'success');
      await loadTickets();
    } catch (error) {
      console.error('Error assigning ticket:', error);
      showToast('Failed to assign ticket', 'error');
    } finally {
      setProcessingAction(null);
    }
  };

  const handleResolveTicket = async (ticketId: string) => {
    setProcessingAction(ticketId);
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', ticketId);

      if (error) throw error;

      showToast('Ticket marked as resolved', 'success');
      await loadTickets();
    } catch (error) {
      console.error('Error resolving ticket:', error);
      showToast('Failed to resolve ticket', 'error');
    } finally {
      setProcessingAction(null);
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
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ marginBottom: '16px' }}>
          <BackButton color="#8B5CF6" />
        </div>

        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '8px' }}>
            Admin Dashboard
          </h1>
          <p style={{ color: '#64748b' }}>
            Manage platform operations and user support
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '32px'
        }}>
          <MetricCard
            title="Total Users"
            value={metrics.totalUsers}
            color="#0ea5e9"
          />
          <MetricCard
            title="Active Providers"
            value={metrics.totalProviders}
            color="#10b981"
          />
          <MetricCard
            title="Pending Approvals"
            value={metrics.pendingProviders}
            color="#f59e0b"
          />
          <MetricCard
            title="Active Bookings"
            value={metrics.activeBookings}
            color="#8b5cf6"
          />
          <MetricCard
            title="Total Revenue"
            value={`$${metrics.totalRevenue.toFixed(2)}`}
            color="#06b6d4"
          />
          <MetricCard
            title="Open Tickets"
            value={metrics.openTickets}
            color="#ef4444"
          />
        </div>

        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setActiveTab('overview')}
              style={{
                padding: '10px 20px',
                background: activeTab === 'overview' ? '#8b5cf6' : 'white',
                color: activeTab === 'overview' ? 'white' : '#64748b',
                border: `1px solid ${activeTab === 'overview' ? '#8b5cf6' : '#e2e8f0'}`,
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('providers')}
              style={{
                padding: '10px 20px',
                background: activeTab === 'providers' ? '#8b5cf6' : 'white',
                color: activeTab === 'providers' ? 'white' : '#64748b',
                border: `1px solid ${activeTab === 'providers' ? '#8b5cf6' : '#e2e8f0'}`,
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Provider Approvals ({metrics.pendingProviders})
            </button>
            <button
              onClick={() => setActiveTab('tickets')}
              style={{
                padding: '10px 20px',
                background: activeTab === 'tickets' ? '#8b5cf6' : 'white',
                color: activeTab === 'tickets' ? 'white' : '#64748b',
                border: `1px solid ${activeTab === 'tickets' ? '#8b5cf6' : '#e2e8f0'}`,
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Support Tickets ({metrics.openTickets})
            </button>
          </div>
        </div>

        {activeTab === 'overview' && (
          <div style={{
            background: 'white',
            padding: '32px',
            borderRadius: '12px',
            border: '1px solid #e2e8f0'
          }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '16px' }}>
              Platform Overview
            </h2>
            <p style={{ color: '#64748b', marginBottom: '24px' }}>
              Quick access to key platform metrics and pending actions
            </p>
            <div style={{ display: 'grid', gap: '16px' }}>
              <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#334155', marginBottom: '8px' }}>
                  Providers Awaiting Approval
                </h3>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>
                  {metrics.pendingProviders}
                </p>
                <p style={{ fontSize: '14px', color: '#64748b', marginTop: '8px' }}>
                  Review and approve provider applications
                </p>
              </div>
              <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#334155', marginBottom: '8px' }}>
                  Open Support Tickets
                </h3>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ef4444' }}>
                  {metrics.openTickets}
                </p>
                <p style={{ fontSize: '14px', color: '#64748b', marginTop: '8px' }}>
                  Respond to user support requests
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'providers' && (
          <div>
            {pendingProviders.length === 0 ? (
              <div style={{
                background: 'white',
                padding: '60px 40px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                textAlign: 'center'
              }}>
                <p style={{ fontSize: '1.125rem', color: '#64748b' }}>
                  No pending provider applications
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '16px' }}>
                {pendingProviders.map(provider => (
                  <div
                    key={provider.id}
                    style={{
                      background: 'white',
                      padding: '24px',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '8px' }}>
                          {provider.full_name}
                        </h3>
                        <div style={{ fontSize: '14px', color: '#64748b' }}>
                          <p style={{ marginBottom: '4px' }}>Email: {provider.email}</p>
                          <p style={{ marginBottom: '4px' }}>Phone: {provider.phone}</p>
                          <p style={{ marginBottom: '4px' }}>Applied: {new Date(provider.created_at).toLocaleDateString()}</p>
                          <p>
                            Identity Verified: {' '}
                            <span style={{ color: provider.identity_verified ? '#10b981' : '#ef4444', fontWeight: '600' }}>
                              {provider.identity_verified ? 'Yes' : 'No'}
                            </span>
                          </p>
                        </div>
                      </div>
                      <span style={{
                        padding: '6px 12px',
                        background: '#fef3c7',
                        color: '#92400e',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '600',
                        textTransform: 'capitalize'
                      }}>
                        {provider.onboarding_status}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button
                        onClick={() => handleApproveProvider(provider.id)}
                        disabled={processingAction === provider.id}
                        style={{
                          flex: 1,
                          padding: '10px',
                          background: processingAction === provider.id ? '#94a3b8' : '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontWeight: '500',
                          cursor: processingAction === provider.id ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {processingAction === provider.id ? 'Processing...' : 'Approve'}
                      </button>
                      <button
                        onClick={() => handleRejectProvider(provider.id)}
                        disabled={processingAction === provider.id}
                        style={{
                          flex: 1,
                          padding: '10px',
                          background: processingAction === provider.id ? '#94a3b8' : '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontWeight: '500',
                          cursor: processingAction === provider.id ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {processingAction === provider.id ? 'Processing...' : 'Reject'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'tickets' && (
          <div>
            {tickets.length === 0 ? (
              <div style={{
                background: 'white',
                padding: '60px 40px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                textAlign: 'center'
              }}>
                <p style={{ fontSize: '1.125rem', color: '#64748b' }}>
                  No open support tickets
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '16px' }}>
                {tickets.map(ticket => {
                  const priorityColor = ticket.priority === 'urgent' ? '#ef4444' :
                                       ticket.priority === 'high' ? '#f97316' :
                                       ticket.priority === 'medium' ? '#f59e0b' : '#0ea5e9';

                  return (
                    <div
                      key={ticket.id}
                      style={{
                        background: 'white',
                        padding: '24px',
                        borderRadius: '12px',
                        border: `2px solid ${ticket.priority === 'urgent' ? '#ef4444' : '#e2e8f0'}`
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600' }}>
                              #{ticket.ticket_number}
                            </span>
                            <span style={{
                              padding: '2px 8px',
                              background: priorityColor,
                              color: 'white',
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
                          <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>
                            <p style={{ marginBottom: '4px' }}>User: {ticket.pet_masters?.profiles?.full_name}</p>
                            <p style={{ marginBottom: '4px' }}>Email: {ticket.pet_masters?.profiles?.email}</p>
                            <p style={{ marginBottom: '4px' }}>Category: {ticket.category.replace('_', ' ')}</p>
                            <p>Created: {new Date(ticket.created_at).toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        {ticket.status === 'open' && (
                          <button
                            onClick={() => handleAssignTicket(ticket.id)}
                            disabled={processingAction === ticket.id}
                            style={{
                              flex: 1,
                              padding: '10px',
                              background: processingAction === ticket.id ? '#94a3b8' : '#0ea5e9',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '14px',
                              fontWeight: '500',
                              cursor: processingAction === ticket.id ? 'not-allowed' : 'pointer'
                            }}
                          >
                            {processingAction === ticket.id ? 'Processing...' : 'Assign to Me'}
                          </button>
                        )}
                        {ticket.status === 'in_progress' && (
                          <button
                            onClick={() => handleResolveTicket(ticket.id)}
                            disabled={processingAction === ticket.id}
                            style={{
                              flex: 1,
                              padding: '10px',
                              background: processingAction === ticket.id ? '#94a3b8' : '#10b981',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '14px',
                              fontWeight: '500',
                              cursor: processingAction === ticket.id ? 'not-allowed' : 'pointer'
                            }}
                          >
                            {processingAction === ticket.id ? 'Processing...' : 'Mark as Resolved'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}

function MetricCard({ title, value, color }: { title: string; value: string | number; color: string }) {
  return (
    <div style={{
      background: 'white',
      padding: '24px',
      borderRadius: '12px',
      border: '1px solid #e2e8f0'
    }}>
      <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px', fontWeight: '500' }}>
        {title}
      </p>
      <p style={{ fontSize: '2rem', fontWeight: 'bold', color }}>
        {value}
      </p>
    </div>
  );
}
