
import { Link } from 'react-router-dom';
import { Shield, Brain, HeartPulse, Lightbulb, Users, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
const About = () => {
  const features = [
    {
      icon: <Brain className="h-10 w-10 text-primary" />,
      title: "AI-Powered Support",
      description: "24/7 AI assistant to help you navigate mental health resources"
    },
    {
      icon: <HeartPulse className="h-10 w-10 text-primary" />,
      title: "Mood Tracking",
      description: "Monitor your emotional wellbeing and identify patterns over time"
    },
    {
      icon: <Users className="h-10 w-10 text-primary" />,
      title: "Professional Care",
      description: "Connect with licensed therapists and mental health professionals"
    },
    {
      icon: <Lightbulb className="h-10 w-10 text-primary" />,
      title: "Curated Resources",
      description: "Access a library of articles, exercises, and tools"
    },
    {
      icon: <Shield className="h-10 w-10 text-primary" />,
      title: "Privacy & Security",
      description: "Your data is encrypted and protected at all times"
    },
    {
      icon: <Sparkles className="h-10 w-10 text-primary" />,
      title: "Personalized Insights",
      description: "Get tailored recommendations based on your progress"
    }
  ];

  const team = [
    {
      name: "Dr. Sarah Johnson",
      role: "Chief Medical Officer",
      bio: "Licensed psychiatrist with 15 years of experience in mental health care."
    },
    {
      name: "Michael Chen",
      role: "CEO & Co-Founder",
      bio: "Tech entrepreneur passionate about making mental healthcare accessible to everyone."
    },
    {
      name: "Elena Rodriguez",
      role: "Head of Patient Experience",
      bio: "Dedicated to ensuring every user has a positive and supportive experience on CareLink."
    }
  ];

  const philosophyValues = [
    "Accessibility: Mental health support should be available to everyone",
    "Privacy: Your personal information is always protected",
    "Evidence-based: All our approaches are grounded in clinical research",
    "Compassion: We treat every user with empathy and respect"
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 bg-slate-50">
          <div className="container max-w-5xl">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold">About CareLink</h1>
              <p className="text-xl text-muted-foreground mt-4 max-w-3xl mx-auto">
                Our mission is to make mental health support accessible, affordable, and effective for everyone.
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-8 md:p-12">
              <div className="prose prose-slate max-w-none">
                <p className="lead">CareLink was founded with a simple but powerful belief: everyone deserves access to quality mental health care.</p>
                <p>Our platform connects patients with licensed therapists, provides mood tracking tools, and offers a library of mental health resources — all in one place.</p>
                <p>Since our launch, we've helped thousands of people take meaningful steps toward better mental health.</p>
                
                <h2>Our Philosophy</h2>
                <p>Everything we do is guided by these core principles:</p>
                
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
              <h2 className="text-3xl font-bold">What We Offer</h2>
              <p className="text-lg text-muted-foreground mt-3 max-w-2xl mx-auto">
                A comprehensive suite of tools and services designed to support your mental health journey.
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
              <h2 className="text-3xl font-bold">Meet Our Team</h2>
              <p className="text-lg text-muted-foreground mt-3 max-w-2xl mx-auto">
                The dedicated professionals behind CareLink.
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
            <h2 className="text-3xl font-bold">Ready to Start Your Journey?</h2>
            <p className="text-xl mt-4 opacity-90">
              Join thousands of people who have found support and growth through CareLink.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90">
                <Link to="/register">Create Free Account</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white/20">
                <Link to="/contact">Contact Us</Link>
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
