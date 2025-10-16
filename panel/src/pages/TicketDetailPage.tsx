import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { formatJalaliDateTime } from '../utils/date';
import { ticketService } from '../services/ticket.service';
import type { Ticket, TicketPriority, TicketStatus } from '../types/ticket';

const TicketDetailPage = () => {
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [updating, setUpdating] = useState(false);

  const lastUpdated = useMemo(() => {
    if (!ticket) return '';
    return formatJalaliDateTime(ticket.updatedAt || ticket.lastMessageAt);
  }, [ticket]);

  useEffect(() => {
    let active = true;
    const fetchTicket = async () => {
      if (!ticketId) return;
      setLoading(true);
      try {
        const res = await ticketService.getById(ticketId);
        if (!active) return;
        if (res.success && res.data?.ticket) {
          setTicket(res.data.ticket);
        } else {
          alert('Ticket not found');
          navigate('/tickets');
        }
      } catch (e) {
        console.error('Failed to load ticket', e);
        alert('Failed to load ticket');
        navigate('/tickets');
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchTicket();
    return () => {
      active = false;
    };
  }, [ticketId, navigate]);

  const handleSendMessage = async () => {
    if (!ticket || !newMessage.trim()) return;
    setSending(true);
    try {
      const res = await ticketService.addMessage(ticket._id, newMessage.trim());
      if (res.success && res.data?.ticket) {
        setTicket(res.data.ticket);
        setNewMessage('');
      } else {
        alert(res.message || 'Failed to send message');
      }
    } catch (e) {
      console.error('Send message error', e);
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleUpdateStatus = async (status: TicketStatus) => {
    if (!ticket) return;
    setUpdating(true);
    try {
      const res = await ticketService.updateStatus(ticket._id, status);
      if (res.success && res.data?.ticket) {
        setTicket(res.data.ticket);
      } else {
        alert(res.message || 'Failed to update status');
      }
    } catch (e) {
      console.error('Update status error', e);
      alert('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdatePriority = async (priority: TicketPriority) => {
    if (!ticket) return;
    setUpdating(true);
    try {
      const res = await ticketService.updatePriority(ticket._id, priority);
      if (res.success && res.data?.ticket) {
        setTicket(res.data.ticket);
      } else {
        alert(res.message || 'Failed to update priority');
      }
    } catch (e) {
      console.error('Update priority error', e);
      alert('Failed to update priority');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="mx-auto max-w-5xl px-8 py-12">
          <div className="flex items-center justify-center py-16">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-purple-600"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!ticket) return null;

  return (
    <Layout>
      <div className="mx-auto max-w-5xl px-8 py-12">
        <button
          onClick={() => navigate('/tickets')}
          className="mb-6 flex items-center space-x-2 text-gray-600 transition-colors hover:text-gray-900"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="font-medium">Back to Tickets</span>
        </button>

        <div className="mb-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-6 text-white">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold break-all">{ticket.subject}</h1>
                <p className="mt-1 text-sm text-purple-100">Ticket ID: {ticket._id}</p>
              </div>
              <div className="text-right">
                <p className="text-sm">Last updated</p>
                <p className="font-semibold">{lastUpdated}</p>
              </div>
            </div>
          </div>
          <div className="grid gap-6 p-6 md:grid-cols-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Status</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(['open','in_progress','resolved','closed'] as TicketStatus[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => handleUpdateStatus(s)}
                    disabled={updating || ticket.status === s}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold ring-1 transition-colors ${
                      ticket.status === s
                        ? 'bg-purple-600 text-white ring-purple-600'
                        : 'bg-white text-gray-700 ring-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {s.replace('_',' ').toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Priority</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(['low','medium','high','urgent'] as TicketPriority[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => handleUpdatePriority(p)}
                    disabled={updating || ticket.priority === p}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold ring-1 transition-colors ${
                      ticket.priority === p
                        ? 'bg-pink-600 text-white ring-pink-600'
                        : 'bg-white text-gray-700 ring-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {p.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500">User</p>
              <div className="mt-2 text-sm text-gray-700">
                <p className="font-semibold">{ticket.userName}</p>
                <p className="font-mono text-xs text-gray-500">{ticket.userPhone}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg">
          <div className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white px-6 py-4">
            <h3 className="text-lg font-bold text-black">Conversation</h3>
          </div>
          <div className="max-h-[60vh] space-y-4 overflow-y-auto p-6">
            {ticket.messages.length === 0 ? (
              <div className="flex items-center justify-center py-10 text-sm text-gray-500">No messages yet</div>
            ) : (
              ticket.messages.map((m) => (
                <div key={m._id || m.createdAt} className={`flex ${m.senderRole === 'admin' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] rounded-2xl p-3 text-sm shadow ${
                    m.senderRole === 'admin' ? 'bg-purple-50 text-purple-900' : 'bg-gray-50 text-gray-900'
                  }`}>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="font-semibold">{m.senderName}</span>
                      <span className="text-xs text-gray-500">{formatJalaliDateTime(m.createdAt)}</span>
                    </div>
                    <div className="whitespace-pre-wrap break-words">{m.message}</div>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="border-t border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center space-x-3">
              <input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a reply..."
                className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm transition-colors focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
              <button
                onClick={handleSendMessage}
                disabled={sending || !newMessage.trim()}
                className="inline-flex items-center space-x-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-purple-500/30 transition-all hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sending ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Send</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TicketDetailPage;
