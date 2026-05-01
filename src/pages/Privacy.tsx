import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const Privacy = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 py-12">
        <div className="container max-w-4xl">
          <div className="mb-10">
            <h1 className="text-3xl font-bold">Privacy Policy</h1>
            <p className="text-muted-foreground mt-2">Last updated: January 1, 2024</p>
          </div>
          <div className="prose prose-slate max-w-none">
            <h2>Introduction</h2>
            <p>CareLink is committed to protecting your privacy. This policy explains how we collect, use, and safeguard your information.</p>
            <h2>Information We Collect</h2>
            <p>We collect information you provide directly to us, including:</p>
            <ul>
              <li>Name, email address, and contact information</li>
              <li>Health and medical information you choose to share</li>
              <li>Usage data and platform interactions</li>
              <li>Device and browser information</li>
            </ul>
            <h2>How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul>
              <li>Provide and improve our services</li>
              <li>Connect you with healthcare professionals</li>
              <li>Send you important notifications and updates</li>
            </ul>
            <h2>Information Sharing</h2>
            <p>We do not sell your personal information. We may share information with:</p>
            <ul>
              <li>Healthcare providers you connect with on our platform</li>
              <li>Service providers who assist in our operations</li>
              <li>Law enforcement when required by law</li>
            </ul>
            <h2>Security</h2>
            <p>We implement industry-standard security measures to protect your information from unauthorized access, disclosure, or misuse.</p>
            <h2>Your Rights</h2>
            <p>You have the right to:</p>
            <ul>
              <li>Access your personal information</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Opt out of certain data uses</li>
            </ul>
            <h2>Cookies</h2>
            <p>We use cookies and similar technologies to enhance your experience and analyze platform usage.</p>
            <h2>Changes to This Policy</h2>
            <p>We may update this privacy policy periodically. We will notify you of significant changes via email or platform notification.</p>
            <h2>Contact</h2>
            <p>For privacy-related questions, contact us at{" "}<a href="mailto:privacy@carelink.com" className="text-primary hover:underline">privacy@carelink.com</a></p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Privacy;
