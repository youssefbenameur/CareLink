import { useState } from 'react';
import { collection, addDoc, Timestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { TicketCheck, Plus, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';

const TICKET_TYPES = [
  { value: 'technical', label: 'Technical Issue' },
  { value: 'billing', label: 'Billing' },
  { value: 'appointment', label: 'Appointment Problem' },
  { value: 'access', label: 'Account Access' },
  { value: 'other', label: 'Other' },
];

const statusConfig: Record<string, { label: string; icon: any; className: string }> = {
  Open: { label: 'Open', icon: Clock, className: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  'In Progress': { label: 'In Progress', icon: AlertCircle, className: 'bg-blue-50 text-blue-700 border-blue-200' },
  Resolved: { label: 'Resolved', icon: CheckCircle, className: 'bg-green-50 text-green-700 border-green-200' },
  Closed: { label: 'Closed', icon: XCircle, className: 'bg-gray-50 text-gray-600 border-gray-200' },
};

export const SupportTicketForm = () => {
  const { currentUser, userData } = useAuth();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ subject: '', type: 'technical', description: '' });

  const { data: tickets, isLoading: ticketsLoading, refetch } = useQuery({
    queryKey: ['supportTickets', currentUser?.uid],
    queryFn: async () => {
      if (!currentUser) return [];
      try {
        // Simple query without orderBy to avoid composite index requirement
        const q = query(
          collection(db, 'supportTickets'),
          where('userId', '==', currentUser.uid)
        );
        const snap = await getDocs(q);
        const results = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
        // Sort client-side
        return results.sort((a, b) => {
          const aDate = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
          const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
          return bDate.getTime() - aDate.getTime();
        });
      } catch (err) {
        console.error('Error fetching tickets:', err);
        return [];
      }
    },
    enabled: !!currentUser,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !form.subject.trim() || !form.description.trim()) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'supportTickets'), {
        userId: currentUser.uid,
        userName: userData?.name || 'Unknown',
        userEmail: userData?.email || currentUser.email,
        userRole: userData?.role || 'patient',
        subject: form.subject,
        type: form.type,
        description: form.description,
        status: 'Open',
        priority: 'medium',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      toast({ title: 'Ticket submitted', description: 'Your support request has been sent to the admin.' });
      setForm({ subject: '', type: 'technical', description: '' });
      setShowForm(false);
      refetch();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to submit ticket.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Support Tickets</h2>
          <p className="text-sm text-muted-foreground">Submit a complaint or request to the admin</p>
        </div>
        <Button size="sm" onClick={() => setShowForm(v => !v)}>
          <Plus className="h-4 w-4 mr-1.5" />
          New Ticket
        </Button>
      </div>

      {/* New ticket form */}
      {showForm && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">New Support Request</CardTitle>
            <CardDescription>Describe your issue and we'll get back to you</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Subject</Label>
                <Input
                  placeholder="Brief description of your issue"
                  value={form.subject}
                  onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TICKET_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea
                  placeholder="Please describe your issue in detail..."
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  rows={4}
                  required
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Ticket'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Ticket list */}
      <div className="space-y-3">
        {!tickets || tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <TicketCheck className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="font-medium">No tickets yet</p>
            <p className="text-sm text-muted-foreground mt-1">Click "New Ticket" to submit a support request</p>
          </div>
        ) : (
          tickets.map((ticket: any) => {
            const cfg = statusConfig[ticket.status] ?? statusConfig['Open'];
            const StatusIcon = cfg.icon;
            const createdAt = ticket.createdAt?.toDate ? ticket.createdAt.toDate() : ticket.createdAt ? new Date(ticket.createdAt) : new Date();
            return (
              <Card key={ticket.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm">{ticket.subject}</span>
                        <Badge variant="outline" className="text-xs capitalize">{ticket.type}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{ticket.description}</p>
                      <p className="text-xs text-muted-foreground mt-1.5">{format(createdAt, 'PPP')}</p>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border flex items-center gap-1 shrink-0 ${cfg.className}`}>
                      <StatusIcon className="h-3 w-3" />
                      {cfg.label}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};
