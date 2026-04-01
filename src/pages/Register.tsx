
import { Link } from 'react-router-dom';
import RegisterForm from '@/components/auth/RegisterForm';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useTranslation } from 'react-i18next';

const Register = () => {
  const { t } = useTranslation();
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold">{t('auth:createAccount')}</h1>
            <p className="text-muted-foreground mt-2">
              {t('auth:joinPlatform')}
            </p>
          </div>
          
          <RegisterForm />
          
          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p>
              {t('auth:needAssistance')}{" "}
              <Link to="/contact" className="text-primary hover:underline">
                {t('auth:contactSupport')}
              </Link>
            </p>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Register;
