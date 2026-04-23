import { useState, useRef } from 'react';
import { UploadCloud, X, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

interface DocumentSlot {
  key: 'doctorLicense' | 'diploma' | 'certification';
  label: string;
  required: boolean;
  file: File | null;
  error: string | null;
}

const INITIAL_SLOTS: DocumentSlot[] = [
  { key: 'doctorLicense', label: 'Medical License', required: true, file: null, error: null },
  { key: 'diploma', label: 'Diploma / Degree', required: true, file: null, error: null },
  { key: 'certification', label: 'Additional Certification', required: false, file: null, error: null },
];

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];

const ResubmitDocuments = () => {
  const { userData, logout, resubmitDocuments, loading } = useAuth();
  const [slots, setSlots] = useState<DocumentSlot[]>(INITIAL_SLOTS);
  const fileRefs = useRef<(HTMLInputElement | null)[]>([null, null, null]);

  const adminNote = userData?.resubmitNote as string | undefined;

  const handleFileChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    setSlots(prev => prev.map((slot, i) => {
      if (i !== index) return slot;
      if (!ALLOWED_TYPES.includes(file.type)) {
        return { ...slot, file: null, error: 'Only JPG or PNG photos are accepted.' };
      }
      return { ...slot, file, error: null };
    }));
    if (fileRefs.current[index]) fileRefs.current[index]!.value = '';
  };

  const removeFile = (index: number) => {
    setSlots(prev => prev.map((slot, i) =>
      i === index ? { ...slot, file: null, error: null } : slot
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let hasErrors = false;
    setSlots(prev => prev.map(slot => {
      if (slot.required && !slot.file) {
        hasErrors = true;
        return { ...slot, error: 'This document is required.' };
      }
      return slot;
    }));
    if (hasErrors) return;

    await resubmitDocuments({
      doctorLicense: slots.find(s => s.key === 'doctorLicense')?.file ?? undefined,
      diploma: slots.find(s => s.key === 'diploma')?.file ?? undefined,
      certification: slots.find(s => s.key === 'certification')?.file ?? undefined,
    });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-lg w-full space-y-4">
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-400">
              <AlertTriangle className="h-5 w-5" />
              Documents Need Re-upload
            </CardTitle>
            <CardDescription className="text-amber-700 dark:text-amber-500">
              {adminNote
                ? adminNote
                : 'The admin has requested that you re-upload your credential documents. Please provide correct files below.'}
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upload Your Documents</CardTitle>
            <CardDescription>
              Upload clear, legible photos. Accepted formats: JPG, PNG.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {slots.map((slot, index) => (
                <div key={slot.key} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium">{slot.label}</Label>
                    {slot.required
                      ? <span className="text-xs text-destructive font-medium">* Required</span>
                      : <span className="text-xs text-muted-foreground">Optional</span>}
                  </div>

                  {slot.file ? (
                    <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2">
                      <span className="text-sm truncate">{slot.file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="ml-2 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileRefs.current[index]?.click()}
                      className="w-full h-20 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-1 hover:border-primary hover:bg-primary/5 transition-colors"
                    >
                      <UploadCloud className="h-5 w-5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Click to upload</span>
                    </button>
                  )}

                  <input
                    ref={el => { fileRefs.current[index] = el; }}
                    type="file"
                    accept=".jpg,.jpeg,.png"
                    className="hidden"
                    onChange={e => handleFileChange(index, e)}
                  />

                  {slot.error && (
                    <p className="text-xs text-destructive">{slot.error}</p>
                  )}
                </div>
              ))}

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={logout}>
                  Sign out
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? 'Submitting...' : 'Resubmit for Review'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResubmitDocuments;
