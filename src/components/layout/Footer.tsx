import { Link } from "react-router-dom";
import { Heart } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t bg-background py-6">
      <div className="container flex flex-col md:flex-row items-center justify-between">
        <div className="mb-4 md:mb-0">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-serene-500 to-calm-500"></div>
            <span className="font-semibold">CareLink</span>
          </Link>
          <p className="text-sm text-muted-foreground mt-1">
            Making mental health support accessible to everyone
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-8 text-sm">
          <div className="space-y-2">
            <h4 className="font-medium">Platform</h4>
            <ul className="space-y-1">
              <li>
                <Link
                  to="/about"
                  className="text-muted-foreground hover:text-foreground transition"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  to="/faq"
                  className="text-muted-foreground hover:text-foreground transition"
                >
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Legal</h4>
            <ul className="space-y-1">
              <li>
                <Link
                  to="/privacy"
                  className="text-muted-foreground hover:text-foreground transition"
                >
                  Privacy
                </Link>
              </li>
              <li>
                <Link
                  to="/terms"
                  className="text-muted-foreground hover:text-foreground transition"
                >
                  Terms
                </Link>
              </li>
              <li>
                <Link
                  to="/accessibility"
                  className="text-muted-foreground hover:text-foreground transition"
                >
                  Accessibility
                </Link>
              </li>
            </ul>
          </div>

          <div className="col-span-2 md:col-span-1 space-y-2">
            <h4 className="font-medium">Contact</h4>
            <ul className="space-y-1">
              <li>
                <a
                  href="mailto:support@carelink.com"
                  className="text-muted-foreground hover:text-foreground transition"
                >
                  support@carelink.com
                </a>
              </li>
              <li>
                <a
                  href="tel:+11234567890"
                  className="text-muted-foreground hover:text-foreground transition"
                >
                  +1 (123) 456-7890
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="container mt-6 pt-6 border-t">
        <div className="flex flex-col md:flex-row items-center justify-between text-sm text-muted-foreground">
          <p>&copy; {currentYear} CareLink. All rights reserved.</p>
          <p className="mt-2 md:mt-0 flex items-center">
            Made with <Heart size={14} className="mx-1 text-destructive" /> for
            better mental health
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
