import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import AdminLayout from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, FileText, ExternalLink, User, Clock } from 'lucide-react';

// Task 9.1 — updated interface
interface DoctorRecord {
  id: string;
  name: string;
  email: string;
  doctorVerificationStatus: 'pending' | 'approved' | 'rejected';
  credentialDocuments?: {
    doctorLicense?: string;
    diploma?: string;
    certification?: string;
  };
  createdAt?: any;
}

// Task 9.4 — labeled document types
const DOCUMENT_TYPES = [
  { key: 'doctorLicense', label: 'Medical License' },
  { key: 'diploma',       label: 'Diploma / Degree' },
  { key: 'certification', label: 'Additional Certification' },
] as const;

const DoctorApprovals = () => {
  const [doctors, setDoctors] = useState<DoctorRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorRecord | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const { toast } = useToast();

  const fetchPendingDoctors = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'users'), where('role', '==', 'doctor'));
      const snapshot = await getDocs(q);
      const list: DoctorRecord[] = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as DoctorRecord));
      setDoctors(list);
    } catch (err) {
      console.error(err);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load doctor applications.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPendingDoctors(); }, []);

  // Task 9.2 — updated field name in Firestore and local state
  const handleApproval = async (doctorId: string, status: 'approved' | 'rejected') => {
    setActionLoading(true);
    try {
      await updateDoc(doc(db, 'users', doctorId), { doctorVerificationStatus: status });
      setDoctors(prev => prev.map(d => d.id === doctorId ? { ...d, doctorVerificationStatus: status } : d));
      toast({
        title: status === 'approved' ? 'Doctor approved' : 'Doctor rejected',
        description: status === 'approved'
          ? 'The doctor can now log in and access the platform.'
          : 'The doctor application has been rejected.',
      });
      setSelectedDoctor(null);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update approval status.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Task 9.3 — comparisons use doctorVerificationStatus
  const statusBadge = (doctor: DoctorRecord) => {
    if (doctor.doctorVerificationStatus === 'pending') return <Badge className="bg-yellow-500">Pending</Badge>;
    if (doctor.doctorVerificationStatus === 'approved') return <Badge className="bg-green-600">Approved</Badge>;
    return <Badge variant="destructive">Rejected</Badge>;
  };

  // Task 9.3 — grouping uses doctorVerificationStatus
  const pending  = doctors.filter(d => d.doctorVerificationStatus === 'pending');
  const reviewed = doctors.filter(d => d.doctorVerificationStatus !== 'pending');

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Doctor Approvals</h1>
          <p className="text-muted-foreground">Review and approve doctor registration requests.</p>
        </div>

        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
          </div>
        ) : (
          <>
            {/* Pending */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-yellow-500" />
                  Pending Requests ({pending.length})
                </CardTitle>
                <CardDescription>These doctors are waiting for your approval.</CardDescription>
              </CardHeader>
              <CardContent>
                {pending.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">No pending requests.</p>
                ) : (
                  <div className="divide-y">
                    {pending.map(doctor => (
                      <div key={doctor.id} className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{doctor.name}</p>
                            <p className="text-xs text-muted-foreground">{doctor.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {/* Task 9.4 — count keys in credentialDocuments map */}
                          <span className="text-xs text-muted-foreground mr-1">
                            {Object.values(doctor.credentialDocuments ?? {}).filter(Boolean).length} doc(s)
                          </span>
                          <Button size="sm" variant="outline" onClick={() => setSelectedDoctor(doctor)}>
                            Review
                          </Button>
                          <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleApproval(doctor.id, 'approved')}>
                            <CheckCircle className="h-4 w-4 mr-1" /> Approve
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleApproval(doctor.id, 'rejected')}>
                            <XCircle className="h-4 w-4 mr-1" /> Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Reviewed */}
            {reviewed.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Reviewed Applications ({reviewed.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="divide-y">
                    {reviewed.map(doctor => (
                      <div key={doctor.id} className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                            <User className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{doctor.name}</p>
                            <p className="text-xs text-muted-foreground">{doctor.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {statusBadge(doctor)}
                          <Button size="sm" variant="outline" onClick={() => setSelectedDoctor(doctor)}>
                            View
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>

      {/* Doctor detail dialog */}
      <Dialog open={!!selectedDoctor} onOpenChange={() => setSelectedDoctor(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Doctor Application</DialogTitle>
            <DialogDescription>Review the submitted credentials before approving.</DialogDescription>
          </DialogHeader>

          {selectedDoctor && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">{selectedDoctor.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedDoctor.email}</p>
                </div>
                <div className="ml-auto">{statusBadge(selectedDoctor)}</div>
              </div>

              {/* Task 9.4 — labeled document rows */}
              <div>
                <p className="text-sm font-medium mb-3">Uploaded Documents</p>
                <div className="space-y-4">
                  {DOCUMENT_TYPES.map(({ key, label }) => {
                    const url = selectedDoctor.credentialDocuments?.[key];
                    return (
                      <div key={key} className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
                        {url ? (
                          <a href={url} target="_blank" rel="noopener noreferrer" className="block">
                            <img
                              src={url}
                              alt={label}
                              className="w-full rounded-lg border object-contain max-h-96 bg-muted cursor-zoom-in hover:opacity-90 transition-opacity"
                            />
                          </a>
                        ) : (
                          <div className="w-full h-16 rounded-lg border border-dashed flex items-center justify-center text-sm text-muted-foreground bg-muted/30">
                            Not provided
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {selectedDoctor?.doctorVerificationStatus === 'pending' && (
            <DialogFooter className="gap-2">
              <Button
                variant="destructive"
                disabled={actionLoading}
                onClick={() => handleApproval(selectedDoctor.id, 'rejected')}
              >
                <XCircle className="h-4 w-4 mr-1" /> Reject
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700"
                disabled={actionLoading}
                onClick={() => handleApproval(selectedDoctor.id, 'approved')}
              >
                <CheckCircle className="h-4 w-4 mr-1" /> Approve
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default DoctorApprovals;
