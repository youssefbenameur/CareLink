import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, Camera, X, FileText } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { AnimatedSection } from '@/components/ui/animated-section';
import { useToast } from '@/hooks/use-toast';

// Task 3.1 — Typed document slot interface
interface DoctorDocumentSlot {
  key: 'doctorLicense' | 'diploma' | 'certification';
  label: string;
  required: boolean;
  file: File | null;
  error: string | null;
}

const INITIAL_SLOTS: DoctorDocumentSlot[] = [
  { key: 'doctorLicense', label: 'Medical License', required: true, file: null, error: null },
  { key: 'diploma', label: 'Diploma / Degree', required: true, file: null, error: null },
  { key: 'certification', label: 'Additional Certification', required: false, file: null, error: null },
];

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];

const RegisterForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'patient',
    agreeTerms: false
  });

  // Task 3.1 — Replace old doctorFiles state with typed slots
  const [documentSlots, setDocumentSlots] = useState<DoctorDocumentSlot[]>(INITIAL_SLOTS);

  // Task 3.2 — Array of refs, one per slot
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([null, null, null]);

  const { register, loading } = useAuth();
  const { toast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (role: string) => {
    setFormData((prev) => ({ ...prev, role }));
    // Task 3.6 — Reset all slots when switching to patient
    if (role === 'patient') {
      setDocumentSlots(INITIAL_SLOTS.map(s => ({ ...s, file: null, error: null })));
    }
  };

  const handleCheckboxChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, agreeTerms: checked }));
  };

  // Task 3.3 — Per-slot file type validation
  const handleFileChange = (slotIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;

    setDocumentSlots(prev => prev.map((slot, i) => {
      if (i !== slotIndex) return slot;
      if (!ALLOWED_TYPES.includes(file.type)) {
        return { ...slot, file: null, error: 'Only JPG or PNG photos are accepted.' };
      }
      return { ...slot, file, error: null };
    }));

    // Reset the input so the same file can be re-selected after removal
    if (fileInputRefs.current[slotIndex]) {
      fileInputRefs.current[slotIndex]!.value = '';
    }
  };

  const removeFile = (slotIndex: number) => {
    setDocumentSlots(prev => prev.map((slot, i) =>
      i === slotIndex ? { ...slot, file: null, error: null } : slot
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Task 3.6 — Submit-time validation for required slots
    if (formData.role === 'doctor') {
      let hasErrors = false;
      setDocumentSlots(prev => prev.map(slot => {
        if (slot.required && slot.file === null) {
          hasErrors = true;
          return { ...slot, error: 'This document is required.' };
        }
        return slot;
      }));
      if (hasErrors) return;
    }

    const userData: any = {
      name: formData.name,
      role: formData.role
    };

    // Task 3.6 — Build typed document map
    const doctorDocuments = formData.role === 'doctor' ? {
      doctorLicense: documentSlots.find(s => s.key === 'doctorLicense')?.file ?? undefined,
      diploma: documentSlots.find(s => s.key === 'diploma')?.file ?? undefined,
      certification: documentSlots.find(s => s.key === 'certification')?.file ?? undefined,
    } : undefined;

    await register(formData.email, formData.password, userData, doctorDocuments);
  };

  return (
    <AnimatedSection>
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Create an account</CardTitle>
          <CardDescription className="text-center">
            Enter your information to get started
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {/* Role selection */}
            <div className="space-y-2">
              <Label>I am registering as a</Label>
              <div className="flex gap-4">
                {(['patient', 'doctor'] as const).map((r) => (
                  <label
                    key={r}
                    className={`flex-1 flex items-center justify-center gap-2 border rounded-lg p-3 cursor-pointer transition-colors ${
                      formData.role === r
                        ? 'border-primary bg-primary/10 text-primary font-medium'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={r}
                      checked={formData.role === r}
                      onChange={() => handleRoleChange(r)}
                      className="sr-only"
                    />
                    <span className="capitalize">{r === 'doctor' ? 'Healthcare Provider' : 'Patient'}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {formData.role === 'doctor'
                  ? 'Your account will be reviewed by an admin before you can access the platform.'
                  : 'You will have immediate access after registration.'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  name="name"
                  placeholder="John Doe"
                  className="pl-10"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  className="pl-10"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  className="pl-10"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-10 w-10"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword
                    ? <EyeOff className="h-4 w-4 text-muted-foreground" />
                    : <Eye className="h-4 w-4 text-muted-foreground" />}
                </Button>
              </div>
            </div>

            {/* Doctor credential photo upload */}
            {formData.role === 'doctor' && (
              <div className="space-y-3 rounded-lg border border-dashed border-primary/50 bg-primary/5 p-4">
                <Label className="text-sm font-medium">Credential Documents</Label>
                <p className="text-xs text-muted-foreground">Upload each document as a JPG or PNG file.</p>

                {documentSlots.map((slot, index) => (
                  <div key={slot.key} className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium">{slot.label}</span>
                      {slot.required
                        ? <span className="text-xs text-destructive font-medium">* Required</span>
                        : <span className="text-xs text-muted-foreground">Optional</span>
                      }
                    </div>

                    {slot.file ? (
                      <div className="relative rounded-lg overflow-hidden border">
                        <img
                          src={URL.createObjectURL(slot.file)}
                          alt={slot.label}
                          className="w-full h-32 object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="absolute top-1 right-1 bg-black/60 hover:bg-destructive text-white rounded-full p-1 transition-colors"
                          aria-label={`Remove ${slot.label}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                        <div className="absolute bottom-0 left-0 right-0 bg-black/40 text-white text-xs px-2 py-1 truncate">
                          {slot.file.name}
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRefs.current[index]?.click()}
                        className="w-full h-20 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-1 hover:border-primary hover:bg-primary/5 transition-colors"
                      >
                        <Camera className="h-5 w-5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Click to add photo</span>
                      </button>
                    )}

                    <input
                      ref={el => { fileInputRefs.current[index] = el; }}
                      type="file"
                      accept=".jpg,.jpeg,.png"
                      className="hidden"
                      onChange={(e) => handleFileChange(index, e)}
                    />

                    {slot.error && (
                      <p className="text-xs text-destructive">{slot.error}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Checkbox
                id="terms"
                checked={formData.agreeTerms}
                onCheckedChange={handleCheckboxChange}
                required
              />
              <Label htmlFor="terms" className="text-sm font-normal">
                I agree to the{' '}
                <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link>
                {' '}and{' '}
                <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
              </Label>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full"
              disabled={loading || !formData.agreeTerms}
            >
              {loading ? 'Creating account...' : 'Sign up'}
            </Button>
            <div className="text-center text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:underline">Sign in</Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </AnimatedSection>
  );
};

export default RegisterForm;
