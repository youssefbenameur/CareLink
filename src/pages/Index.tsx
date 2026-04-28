import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Users, Brain, Heart, Shield, Leaf } from "lucide-react";

// Define interfaces for our translation objects
interface Testimonial {
  text: string;
  author: string;
}

interface PricingPlan {
  title: string;
  price: string;
  features: string[];
}

const Index = () => {
  const { t } = useTranslation(["landing", "auth"]);
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate("/signup");
  };

  const features = [
    {
      icon: <Users className="h-10 w-10 text-primary" />,
      title: t("landing:features.expertTherapists.title"),
      description: t("landing:features.expertTherapists.description"),
    },
    {
      icon: <Brain className="h-10 w-10 text-primary" />,
      title: t("landing:features.personalizedSupport.title"),
      description: t("landing:features.personalizedSupport.description"),
    },
    {
      icon: <Heart className="h-10 w-10 text-primary" />,
      title: t("landing:features.moodTracking.title"),
      description: t("landing:features.moodTracking.description"),
    },
    {
      icon: <Shield className="h-10 w-10 text-primary" />,
      title: t("landing:features.security.title"),
      description: t("landing:features.security.description"),
    },
  ];

  const testimonials = t("landing:testimonials.items", {
    returnObjects: true,
  }) as Testimonial[];
  const pricingPlans = t("landing:pricing.plans", { returnObjects: true }) as {
    basic: PricingPlan;
    standard: PricingPlan;
    premium: PricingPlan;
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 md:py-28 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-background to-muted/50 -z-10"></div>
          <div className="absolute inset-0 bg-grid-pattern opacity-30 -z-10"></div>

          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col md:flex-row items-center gap-10 md:gap-16">
              <div className="flex-1 space-y-6 text-left">
                <motion.h1
                  className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  {t("landing:heroTitle")}
                </motion.h1>

                <motion.p
                  className="text-lg md:text-xl text-muted-foreground max-w-[700px]"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  {t("landing:heroSubtitle")}
                </motion.p>

                <motion.div
                  className="flex flex-col sm:flex-row gap-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <Button
                    size="lg"
                    onClick={handleGetStarted}
                    className="text-lg"
                  >
                    {t("landing:getStarted")}
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    asChild
                    className="text-lg"
                  >
                    <Link to="/login">{t("auth:login")}</Link>
                  </Button>
                </motion.div>

                <motion.div
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                >
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>Certified mental health professionals</span>
                </motion.div>
              </div>

              <motion.div
                className="flex-1 relative"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7 }}
              >
                <div className="absolute -inset-4 rounded-xl bg-gradient-to-r from-primary/20 to-secondary/20 blur-xl -z-10"></div>
                <img
                  src="https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?ixlib=rb-4.0.3&auto=format&fit=crop&w=1800&q=80"
                  alt="Mental health support"
                  className="rounded-xl shadow-2xl w-full object-cover h-[400px] md:h-[500px]"
                />
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-card">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-3">
                Our Features
              </Badge>
              <h2 className="text-3xl font-bold mb-4">
                Everything you need for better mental health support
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Comprehensive tools designed by professionals to help you on
                your journey to improved mental well-being.
              </p>
            </div>

            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  className="flex flex-col items-center text-center p-6 rounded-lg bg-card border shadow-sm hover:shadow-md transition-shadow"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 * index }}
                >
                  <div className="p-3 rounded-full bg-primary/10 mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-3">
                Our Process
              </Badge>
              <h2 className="text-3xl font-bold mb-4">How CareLink Works</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                A simple and effective approach to mental health care, designed
                with you in mind.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <motion.div
                className="flex flex-col items-center text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mb-4">
                  1
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  Create Your Account
                </h3>
                <p className="text-muted-foreground">
                  Sign up in minutes and complete a brief assessment to help us
                  understand your needs.
                </p>
              </motion.div>

              <motion.div
                className="flex flex-col items-center text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mb-4">
                  2
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  Match With a Therapist
                </h3>
                <p className="text-muted-foreground">
                  We'll connect you with a licensed therapist who specializes in
                  your area of concern.
                </p>
              </motion.div>

              <motion.div
                className="flex flex-col items-center text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mb-4">
                  3
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  Start Your Journey
                </h3>
                <p className="text-muted-foreground">
                  Schedule sessions, track your progress, and access resources
                  all in one place.
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-20 bg-muted">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col md:flex-row items-center gap-12">
              <div className="flex-1">
                <img
                  src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80"
                  alt="Therapy session"
                  className="rounded-lg shadow-xl w-full object-cover h-[400px] md:h-[500px]"
                />
              </div>

              <div className="flex-1 space-y-6">
                <Badge variant="outline" className="mb-2">
                  {t("landing:testimonials.title")}
                </Badge>
                <h2 className="text-3xl font-bold">What Our Clients Say</h2>
                <p className="text-muted-foreground">
                  {t("landing:testimonials.subtitle")}
                </p>

                <div className="space-y-6">
                  {testimonials.map((item, index) => (
                    <Card key={index} className="overflow-hidden">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                            {item.author.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium">{item.author}</div>
                            <div className="text-xs text-muted-foreground">
                              CareLink Client
                            </div>
                          </div>
                        </div>
                        <p className="italic">"{item.text}"</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-primary/5 relative">
          <div className="absolute inset-0 bg-grid-pattern opacity-20"></div>
          <div className="container px-4 md:px-6 mx-auto relative">
            <div className="max-w-3xl mx-auto text-center space-y-8">
              <h2 className="text-3xl md:text-4xl font-bold">
                Ready to start your mental health journey?
              </h2>
              <p className="text-lg text-muted-foreground">
                Join thousands of people who have found support and growth
                through our platform.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button
                  size="lg"
                  onClick={handleGetStarted}
                  className="text-lg"
                >
                  {t("landing:getStarted")}
                </Button>
                <Button size="lg" variant="outline" asChild className="text-lg">
                  <Link to="/contact">Contact Us</Link>
                </Button>
              </div>
              <div className="pt-4 flex items-center justify-center gap-3">
                <Leaf className="h-5 w-5 text-primary" />
                <span className="text-sm text-muted-foreground">
                  Your journey to healing starts here
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
