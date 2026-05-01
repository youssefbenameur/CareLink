import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import AdminLayout from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, User, Clock, Mail, UploadCloud, Search, RefreshCw } from 'lucide-react';
import ImageLightbox from '@/components/ui/ImageLightbox';

interface DoctorRecord {
  id: string;
  name: string;
  email: string;
  doctorVerificationStatus: 'pending' | 'approved' | 'rejected' | 'resubmit';
  credentialDocuments?: {
    nationalId?: string;
    medicalDiploma?: string;
    cnomCard?: string;
  };
  createdAt?: any;
}

const DOCUMENT_TYPES = [
  { key: 'nationalId',    label: 'National ID' },
  { key: 'medicalDiploma', label: 'Medical Diploma' },
  { key: 'cnomCard',      label: 'Professional Card CNOM' },
] as const;

const buildEmailTemplate = (
  doctorName: string,
  status: 'approved' | 'rejected' | 'resubmit',
  resubmitNote?: string
) => {
  if (status === 'approved') {
    return {
      subject: 'Your CareLink application has been approved',
      body: `Hi ${doctorName},\n\nCongratulations! Your doctor account on CareLink has been approved.\n\nYou can now log in to your CareLink account and start providing care.\n\nWelcome to the CareLink team!`,
    };
  }
  if (status === 'resubmit') {
    return {
      subject: 'Action required: Please re-upload your documents on CareLink',
      body: `Hi ${doctorName},\n\nWe reviewed your application and need you to re-upload your credential documents.\n\n${resubmitNote ? `Note from the reviewer:\n${resubmitNote}\n\n` : ''}Please log in to your CareLink account and follow the instructions to resubmit your documents.\n\nThank you for your patience.`,
    };
  }
  return {
    subject: 'Update on your CareLink application',
    body: `Hi ${doctorName},\n\nThank you for applying to CareLink. Unfortunately, your application was not approved at this time.\n\nIf you have questions or would like to follow up, please contact us at support@carelink.com.\n\nBest regards,\nThe CareLink Team`,
  };
};

const DoctorApprovals = () => {
  const [doctors, setDoctors] = useState<DoctorRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorRecord | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Lightbox state
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null);

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'resubmit'>('all');

  // Email compose dialog state
  const [emailDialog, setEmailDialog] = useState<{
    open: boolean;
    to: string;
    subject: string;
    body: string;
  }>({ open: false, to: '', subject: '', body: '' });

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    doctorId: string;
    doctorName: string;
    status: 'approved' | 'rejected' | 'resubmit';
    resubmitNote?: string;
  } | null>(null);

  const { toast } = useToast();

  const requestConfirmation = (doctor: DoctorRecord, status: 'approved' | 'rejected' | 'resubmit') => {
    setConfirmDialog({ open: true, doctorId: doctor.id, doctorName: doctor.name, status, resubmitNote: '' });
  };

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
  const handleApproval = async (doctorId: string, status: 'approved' | 'rejected' | 'resubmit', resubmitNote?: string) => {
    setActionLoading(true);
    try {
      const { Timestamp } = await import('firebase/firestore');
      const currentAdmin = auth.currentUser;

      const updateData: any = {
        doctorVerificationStatus: status,
        verificationUpdatedAt: Timestamp.now(),
        verificationUpdatedBy: currentAdmin?.email || 'Unknown Admin'
      };

      if (status === 'approved') {
        updateData.approvedAt = Timestamp.now();
        updateData.approvedBy = currentAdmin?.email || 'Unknown Admin';
      } else if (status === 'rejected') {
        updateData.rejectedAt = Timestamp.now();
        updateData.rejectedBy = currentAdmin?.email || 'Unknown Admin';
      } else if (status === 'resubmit') {
        updateData.resubmitNote = resubmitNote || null;
        updateData.resubmitRequestedAt = Timestamp.now();
        updateData.resubmitRequestedBy = currentAdmin?.email || 'Unknown Admin';
      }

      await updateDoc(doc(db, 'users', doctorId), updateData);
      setDoctors(prev => prev.map(d => d.id === doctorId ? { ...d, doctorVerificationStatus: status } : d));

      toast({
        title: status === 'approved' ? 'Doctor approved' : status === 'resubmit' ? 'Re-upload requested' : 'Doctor rejected',
        description: 'You can now send the doctor an email notification.',
      });

      // Open email compose dialog pre-filled for this doctor
      const doctor = doctors.find(d => d.id === doctorId);
      if (doctor) {
        const { subject, body } = buildEmailTemplate(doctor.name, status, resubmitNote);
        setEmailDialog({ open: true, to: doctor.email, subject, body });
      }

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
    if (doctor.doctorVerificationStatus === 'resubmit') return <Badge className="bg-orange-500">Re-upload Requested</Badge>;
    return <Badge variant="destructive">Rejected</Badge>;
  };

  // Task 9.3 — grouping uses doctorVerificationStatus
  const filtered = doctors.filter(d => {
    const matchesSearch =
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || d.doctorVerificationStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pending  = filtered.filter(d => d.doctorVerificationStatus === 'pending');
  const reviewed = filtered.filter(d => d.doctorVerificationStatus !== 'pending');

  return (
    <>
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Doctor Approvals</h1>
          <p className="text-muted-foreground">Review and approve doctor registration requests.</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              className="pl-9"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={v => setStatusFilter(v as typeof statusFilter)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="resubmit">Re-upload Requested</SelectItem>
            </SelectContent>
          </Select>
          {(searchTerm || statusFilter !== 'all') && (
            <Button variant="outline" size="icon" onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
          </div>
        ) : (
          <>
            {/* Pending — hidden when filter excludes pending */}
            {(statusFilter === 'all' || statusFilter === 'pending') && (
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
                          <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => requestConfirmation(doctor, 'approved')}>
                            <CheckCircle className="h-4 w-4 mr-1" /> Approve
                          </Button>
                          <Button size="sm" variant="outline" className="border-orange-400 text-orange-600 hover:bg-orange-50" onClick={() => requestConfirmation(doctor, 'resubmit')}>
                            <UploadCloud className="h-4 w-4 mr-1" /> Re-upload
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => requestConfirmation(doctor, 'rejected')}>
                            <XCircle className="h-4 w-4 mr-1" /> Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            )}

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
                {(() => {
                  const allImages = DOCUMENT_TYPES
                    .map(({ key }) => selectedDoctor.credentialDocuments?.[key])
                    .filter(Boolean) as string[];
                  return (
                    <div className="space-y-4">
                      {DOCUMENT_TYPES.map(({ key, label }) => {
                        const url = selectedDoctor.credentialDocuments?.[key];
                        const imgIndex = allImages.indexOf(url!);
                        return (
                          <div key={key} className="space-y-2">
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
                            {url ? (
                              <button
                                type="button"
                                className="block w-full focus:outline-none focus:ring-2 focus:ring-primary rounded-lg"
                                onClick={() => setLightbox({ images: allImages, index: imgIndex })}
                              >
                                <img
                                  src={url}
                                  alt={label}
                                  className="w-full rounded-lg border object-contain max-h-64 bg-muted cursor-zoom-in hover:opacity-90 transition-opacity"
                                />
                                <p className="text-xs text-muted-foreground mt-1 text-center">Click to view full size</p>
                              </button>
                            ) : (
                              <div className="w-full h-16 rounded-lg border border-dashed flex items-center justify-center text-sm text-muted-foreground bg-muted/30">
                                Not provided
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {selectedDoctor?.doctorVerificationStatus === 'pending' && (
            <DialogFooter className="gap-2">
              <Button
                variant="destructive"
                disabled={actionLoading}
                onClick={() => requestConfirmation(selectedDoctor, 'rejected')}
              >
                <XCircle className="h-4 w-4 mr-1" /> Reject
              </Button>
              <Button
                variant="outline"
                className="border-orange-400 text-orange-600 hover:bg-orange-50"
                disabled={actionLoading}
                onClick={() => requestConfirmation(selectedDoctor, 'resubmit')}
              >
                <UploadCloud className="h-4 w-4 mr-1" /> Request Re-upload
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700"
                disabled={actionLoading}
                onClick={() => requestConfirmation(selectedDoctor, 'approved')}
              >
                <CheckCircle className="h-4 w-4 mr-1" /> Approve
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
      {/* Confirmation dialog */}
      <Dialog
        open={!!confirmDialog?.open}
        onOpenChange={(open) => !open && setConfirmDialog(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {confirmDialog?.status === 'approved'
                ? <CheckCircle className="h-5 w-5 text-green-600" />
                : confirmDialog?.status === 'resubmit'
                ? <UploadCloud className="h-5 w-5 text-orange-500" />
                : <XCircle className="h-5 w-5 text-destructive" />}
              {confirmDialog?.status === 'approved'
                ? 'Approve Doctor'
                : confirmDialog?.status === 'resubmit'
                ? 'Request Re-upload'
                : 'Reject Doctor'}
            </DialogTitle>
            <DialogDescription>
              {confirmDialog?.status === 'approved'
                ? `Are you sure you want to approve ${confirmDialog?.doctorName}? They will be able to log in and access the platform.`
                : confirmDialog?.status === 'resubmit'
                ? `This will ask ${confirmDialog?.doctorName} to re-upload their documents. You can add an optional note explaining what needs to be corrected.`
                : `Are you sure you want to reject ${confirmDialog?.doctorName}? This will deny them access to the platform.`}
            </DialogDescription>
          </DialogHeader>

          {confirmDialog?.status === 'resubmit' && (
            <div className="space-y-1">
              <Label htmlFor="resubmit-note">Note for the doctor (optional)</Label>
              <Textarea
                id="resubmit-note"
                placeholder="e.g. Your medical license image is blurry. Please upload a clearer photo."
                rows={3}
                value={confirmDialog.resubmitNote ?? ''}
                onChange={e => setConfirmDialog(prev => prev ? { ...prev, resubmitNote: e.target.value } : prev)}
              />
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmDialog(null)}>
              Cancel
            </Button>
            <Button
              variant={confirmDialog?.status === 'approved' ? 'default' : confirmDialog?.status === 'resubmit' ? 'outline' : 'destructive'}
              className={
                confirmDialog?.status === 'approved'
                  ? 'bg-green-600 hover:bg-green-700'
                  : confirmDialog?.status === 'resubmit'
                  ? 'border-orange-400 text-orange-600 hover:bg-orange-50'
                  : ''
              }
              disabled={actionLoading}
              onClick={() => {
                if (confirmDialog) {
                  handleApproval(confirmDialog.doctorId, confirmDialog.status, confirmDialog.resubmitNote);
                  setConfirmDialog(null);
                }
              }}
            >
              {actionLoading
                ? 'Processing...'
                : confirmDialog?.status === 'approved'
                ? 'Yes, Approve'
                : confirmDialog?.status === 'resubmit'
                ? 'Send Re-upload Request'
                : 'Yes, Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Email compose dialog */}
      <Dialog open={emailDialog.open} onOpenChange={(open) => setEmailDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" /> Send Email Notification
            </DialogTitle>
            <DialogDescription>
              Review and edit the email before sending. Clicking "Open in Email Client" will open your default email app with this message pre-filled.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="email-to">To</Label>
              <Input
                id="email-to"
                value={emailDialog.to}
                onChange={e => setEmailDialog(prev => ({ ...prev, to: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="email-subject">Subject</Label>
              <Input
                id="email-subject"
                value={emailDialog.subject}
                onChange={e => setEmailDialog(prev => ({ ...prev, subject: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="email-body">Message</Label>
              <Textarea
                id="email-body"
                rows={8}
                value={emailDialog.body}
                onChange={e => setEmailDialog(prev => ({ ...prev, body: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEmailDialog(prev => ({ ...prev, open: false }))}>
              Skip
            </Button>
            <Button
              onClick={() => {
                const mailto = `mailto:${encodeURIComponent(emailDialog.to)}?subject=${encodeURIComponent(emailDialog.subject)}&body=${encodeURIComponent(emailDialog.body)}`;
                window.open(mailto, '_blank');
                setEmailDialog(prev => ({ ...prev, open: false }));
              }}
            >
              <Mail className="h-4 w-4 mr-2" /> Open in Email Client
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
    {lightbox && (
      <ImageLightbox
        images={lightbox.images}
        startIndex={lightbox.index}
        onClose={() => setLightbox(null)}
      />
    )}
  </>
  );
};

export default DoctorApprovals;
