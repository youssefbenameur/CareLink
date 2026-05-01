import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const Terms = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 py-12">
        <div className="container max-w-4xl">
          <div className="mb-10">
            <h1 className="text-3xl font-bold">Terms of Service</h1>
            <p className="text-muted-foreground mt-2">Last updated: January 1, 2024</p>
          </div>
          <div className="prose prose-slate max-w-none">
            <h2>Introduction</h2>
            <p>Welcome to CareLink. By using our platform, you agree to these terms of service.</p>
            <h2>Acceptance of Terms</h2>
            <p>By accessing or using CareLink, you agree to be bound by these Terms of Service and all applicable laws and regulations.</p>
            <h2>Services</h2>
            <p>CareLink provides a mental health support platform connecting patients with licensed healthcare professionals.</p>
            <h2>Privacy</h2>
            <p>Your use of CareLink is also governed by our{" "}<Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.</p>
            <h2>Content</h2>
            <p>You are responsible for the content you submit to CareLink.</p>
            <p>CareLink grants you a limited license to use the platform for personal, non-commercial purposes.</p>
            <h2>Prohibited Activities</h2>
            <p>You may not use CareLink for any unlawful purpose or in any way that could harm other users.</p>
            <h2>Termination</h2>
            <p>We reserve the right to terminate or suspend your account at any time for violations of these terms.</p>
            <h2>Disclaimer</h2>
            <p>CareLink is provided "as is" without warranties of any kind. We do not provide medical advice.</p>
            <h2>Changes to Terms</h2>
            <p>We may update these terms from time to time. Continued use of the platform constitutes acceptance of the new terms.</p>
            <h2>Contact</h2>
            <p>For questions about these terms, contact us at{" "}<a href="mailto:legal@carelink.com" className="text-primary hover:underline">legal@carelink.com</a></p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Terms;
