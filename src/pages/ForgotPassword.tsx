
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { sendPasswordResetEmail } from '@/lib/firebase';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useTranslation } from 'react-i18next';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation(['auth', 'common']);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await sendPasswordResetEmail(email);
      setIsSuccess(true);
      toast({
        title: t('auth:resetEmailSent'),
        description: t('auth:checkInboxReset'),
      });
    } catch (error: any) {
      console.error("Password reset error:", error);
      toast({
        variant: "destructive",
        title: t('common:error'),
        description: t('auth:failedSendResetEmail'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">{t('auth:resetYourPassword')}</CardTitle>
            <CardDescription>
              {t('auth:enterEmailReset')}
            </CardDescription>
          </CardHeader>
          
          {isSuccess ? (
            <CardContent className="space-y-4">
              <div className="bg-green-50 p-4 rounded-md border border-green-200">
                <h3 className="font-medium text-green-800">{t('auth:resetEmailSent')}!</h3>
                <p className="text-green-700 text-sm mt-1">
                  {t('auth:resetEmailSentTo')} <span className="font-medium">{email}</span> {t('auth:withResetInstructions')}
                </p>
              </div>
              
              <div className="text-sm text-muted-foreground">
                <p>{t('auth:didntReceiveEmail')}</p>
              </div>
              
              <Button 
                variant="outline" 
                type="button" 
                className="w-full"
                onClick={() => setIsSuccess(false)}
              >
                {t('auth:sendAgain')}
              </Button>
            </CardContent>
          ) : (
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t('auth:email')}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder={t('auth:emailPlaceholder')}
                      className="pl-10"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="flex flex-col space-y-4">
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? t('common:sending') : t('auth:sendResetLink')}
                </Button>
                
                <div className="text-center text-sm">
                  <Link 
                    to="/login" 
                    className="inline-flex items-center text-primary hover:underline"
                  >
                    <ArrowLeft className="mr-1 h-4 w-4" />
                    {t('auth:backToLogin')}
                  </Link>
                </div>
              </CardFooter>
            </form>
          )}
        </Card>
      </main>
      
      <Footer />
    </div>
  );
};

export default ForgotPassword;
