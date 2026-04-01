
import { Link } from 'react-router-dom';
import LoginForm from '@/components/auth/LoginForm';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useTranslation } from 'react-i18next';

const Login = () => {
  const { t } = useTranslation(['auth', 'common']);
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold">{t('auth:welcomeBack')}</h1>
            <p className="text-muted-foreground mt-2">
              {t('auth:signInToAccess')}
            </p>
          </div>
          
          <LoginForm />
          
          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p>
              {t('auth:termsAgreement')}{" "}
              <Link to="/terms" className="text-primary hover:underline">
                {t('auth:termsOfService')}
              </Link>
              {" "}{t('common:and')}{" "}
              <Link to="/privacy" className="text-primary hover:underline">
                {t('auth:privacyPolicy')}
              </Link>
            </p>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Login;
