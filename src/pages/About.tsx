
import { Link } from 'react-router-dom';
import { Shield, Brain, HeartPulse, Lightbulb, Users, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useTranslation } from 'react-i18next';

const About = () => {
  const { t } = useTranslation(['about', 'common']);

  const features = [
    {
      icon: <Brain className="h-10 w-10 text-primary" />,
      title: t('about:features.aiSupport.title'),
      description: t('about:features.aiSupport.description')
    },
    {
      icon: <HeartPulse className="h-10 w-10 text-primary" />,
      title: t('about:features.moodTracking.title'),
      description: t('about:features.moodTracking.description')
    },
    {
      icon: <Users className="h-10 w-10 text-primary" />,
      title: t('about:features.professionalCare.title'),
      description: t('about:features.professionalCare.description')
    },
    {
      icon: <Lightbulb className="h-10 w-10 text-primary" />,
      title: t('about:features.resources.title'),
      description: t('about:features.resources.description')
    },
    {
      icon: <Shield className="h-10 w-10 text-primary" />,
      title: t('about:features.security.title'),
      description: t('about:features.security.description')
    },
    {
      icon: <Sparkles className="h-10 w-10 text-primary" />,
      title: t('about:features.insights.title'),
      description: t('about:features.insights.description')
    }
  ];

  const team = [
    {
      name: t('about:team.sarah.name'),
      role: t('about:team.sarah.role'),
      bio: t('about:team.sarah.bio')
    },
    {
      name: t('about:team.michael.name'),
      role: t('about:team.michael.role'),
      bio: t('about:team.michael.bio')
    },
    {
      name: t('about:team.elena.name'),
      role: t('about:team.elena.role'),
      bio: t('about:team.elena.bio')
    }
  ];

  // Define philosophy values statically to avoid i18n type errors
  const philosophyValues = [
    t('about:philosophy.values.1'),
    t('about:philosophy.values.2'),
    t('about:philosophy.values.3'),
    t('about:philosophy.values.4')
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 bg-slate-50">
          <div className="container max-w-5xl">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold">{t('about:title')}</h1>
              <p className="text-xl text-muted-foreground mt-4 max-w-3xl mx-auto">
                {t('about:subtitle')}
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-8 md:p-12">
              <div className="prose prose-slate max-w-none">
                <p className="lead">{t('about:intro')}</p>
                <p>{t('about:story')}</p>
                <p>{t('about:impact')}</p>
                
                <h2>{t('about:philosophy.title')}</h2>
                <p>{t('about:philosophy.subtitle')}</p>
                
                <ul>
                  {philosophyValues.map((value, index) => (
                    <li key={index}>{value}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>
        
        {/* Features Section */}
        <section className="py-20">
          <div className="container">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold">{t('about:howItWorks.title')}</h2>
              <p className="text-lg text-muted-foreground mt-3 max-w-2xl mx-auto">
                {t('about:howItWorks.subtitle')}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <div key={index} className="bg-card border rounded-lg p-6 transition-all hover:shadow-md">
                  <div className="h-14 w-14 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        
        {/* Team Section */}
        <section className="py-20 bg-slate-50">
          <div className="container">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold">{t('about:team.title')}</h2>
              <p className="text-lg text-muted-foreground mt-3 max-w-2xl mx-auto">
                {t('about:team.subtitle')}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {team.map((member, index) => (
                <div key={index} className="bg-white border rounded-lg overflow-hidden">
                  <div className="bg-primary/10 h-40 flex items-center justify-center">
                    <Users className="h-20 w-20 text-primary/30" />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold">{member.name}</h3>
                    <p className="text-sm text-primary font-medium mb-3">{member.role}</p>
                    <p className="text-muted-foreground text-sm">{member.bio}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="py-20 bg-primary text-white">
          <div className="container text-center max-w-3xl">
            <h2 className="text-3xl font-bold">{t('about:cta.title')}</h2>
            <p className="text-xl mt-4 opacity-90">
              {t('about:cta.subtitle')}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90">
                <Link to="/register">{t('about:cta.createAccount')}</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white/20">
                <Link to="/contact">{t('about:cta.contactUs')}</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default About;
