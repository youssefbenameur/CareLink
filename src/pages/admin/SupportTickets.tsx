import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { TicketCheck, Clock, AlertCircle, CheckCircle, XCircle, User } from 'lucide-react';
import { format } from 'date-fns';

const STATUS_OPTIONS = ['Open', 'In Progress', 'Resolved', 'Closed'];

const statusConfig: Record<string, { icon: any; className: string }> = {
  Open:        { icon: Clock,        className: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  'In Progress': { icon: AlertCircle, className: 'bg-blue-50 text-blue-700 border-blue-200' },
  Resolved:    { icon: CheckCircle,  className: 'bg-green-50 text-green-700 border-green-200' },
  Closed:      { icon: XCircle,      className: 'bg-gray-50 text-gray-600 border-gray-200' },
};

const roleColor: Record<string, string> = {
  doctor: 'bg-blue-100 text-blue-700',
  patient: 'bg-green-100 text-green-700',
};

const SupportTickets = () => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any | null>(null);
  const [updating, setUpdating] = useState(false);
  const { toast } = useToast();

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'supportTickets'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setTickets(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load tickets.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTickets(); }, []);

  const handleStatusChange = async (ticketId: string, status: string) => {
    setUpdating(true);
    try {
      await updateDoc(doc(db, 'supportTickets', ticketId), { status, updatedAt: new Date() });
      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status } : t));
      if (selected?.id === ticketId) setSelected((p: any) => ({ ...p, status }));
      toast({ title: 'Status updated', description: `Ticket marked as ${status}.` });
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update status.' });
    } finally {
      setUpdating(false);
    }
  };

  const open = tickets.filter(t => t.status === 'Open' || t.status === 'In Progress');
  const closed = tickets.filter(t => t.status === 'Resolved' || t.status === 'Closed');

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Support Tickets</h1>
          <p className="text-muted-foreground">Manage reclamations from patients and doctors.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Open', count: tickets.filter(t => t.status === 'Open').length, color: 'text-yellow-600' },
            { label: 'In Progress', count: tickets.filter(t => t.status === 'In Progress').length, color: 'text-blue-600' },
            { label: 'Resolved', count: tickets.filter(t => t.status === 'Resolved').length, color: 'text-green-600' },
            { label: 'Total', count: tickets.length, color: 'text-foreground' },
          ].map(s => (
            <Card key={s.label} className="text-center py-4">
              <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </Card>
          ))}
        </div>

        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
          </div>
        ) : (
          <>
            {/* Open tickets */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-yellow-500" />
                  Active Tickets ({open.length})
                </CardTitle>
                <CardDescription>Tickets requiring attention</CardDescription>
              </CardHeader>
              <CardContent>
                {open.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No active tickets.</p>
                ) : (
                  <div className="divide-y">
                    {open.map(ticket => <TicketRow key={ticket.id} ticket={ticket} onView={setSelected} onStatusChange={handleStatusChange} updating={updating} />)}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Closed tickets */}
            {closed.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Resolved / Closed ({closed.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="divide-y">
                    {closed.map(ticket => <TicketRow key={ticket.id} ticket={ticket} onView={setSelected} onStatusChange={handleStatusChange} updating={updating} />)}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>

      {/* Detail dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Ticket Details</DialogTitle>
            <DialogDescription>Review and update the support request</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">{selected.userName}</p>
                  <p className="text-sm text-muted-foreground">{selected.userEmail}</p>
                </div>
                <Badge className={`ml-auto capitalize ${roleColor[selected.userRole] ?? ''}`}>{selected.userRole}</Badge>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Subject</p>
                <p className="font-medium">{selected.subject}</p>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Category</p>
                <Badge variant="outline" className="capitalize">{selected.type}</Badge>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Description</p>
                <p className="text-sm bg-muted/40 rounded-lg p-3">{selected.description}</p>
              </div>

              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Update Status</p>
                <Select value={selected.status} onValueChange={v => handleStatusChange(selected.id, v)} disabled={updating}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

interface TicketRowProps {
  ticket: any;
  onView: (t: any) => void;
  onStatusChange: (id: string, status: string) => void;
  updating: boolean;
}

const TicketRow = ({ ticket, onView, onStatusChange, updating }: TicketRowProps) => {
  const cfg = statusConfig[ticket.status] ?? statusConfig['Open'];
  const StatusIcon = cfg.icon;
  const createdAt = ticket.createdAt?.toDate ? ticket.createdAt.toDate() : new Date(ticket.createdAt);

  return (
    <div className="flex items-center justify-between py-3 gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-medium text-sm truncate">{ticket.subject}</p>
          <Badge variant="outline" className={`text-[10px] capitalize ${roleColor[ticket.userRole] ?? ''}`}>{ticket.userRole}</Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{ticket.userName} · {format(createdAt, 'MMM d, yyyy')}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border flex items-center gap-1 ${cfg.className}`}>
          <StatusIcon className="h-3 w-3" />
          {ticket.status}
        </span>
        <Button size="sm" variant="outline" onClick={() => onView(ticket)}>View</Button>
      </div>
    </div>
  );
};

export default SupportTickets;
