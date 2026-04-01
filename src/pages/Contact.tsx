import { Mail, Phone, MapPin, Clock } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

const Contact = () => {
  const { toast } = useToast();
  const { t } = useTranslation(["contact", "common"]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement contact form submission
    toast({
      title: t("contact:form.success.title"),
      description: t("contact:form.success.message"),
    });
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 py-12">
        <div className="container max-w-6xl">
          <div className="mb-12 text-center">
            <h1 className="text-4xl font-bold">{t("contact:title")}</h1>
            <p className="text-xl text-muted-foreground mt-4 max-w-2xl mx-auto">
              {t("contact:subtitle")}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-1 space-y-6">
              <div className="rounded-lg border bg-card p-6">
                <h3 className="text-lg font-semibold mb-4">
                  {t("contact:contactInfo")}
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <Mail className="h-5 w-5 mr-3 text-primary" />
                    <div>
                      <p className="font-medium">{t("contact:email")}</p>
                      <a
                        href="mailto:support@carelink.com"
                        className="text-sm text-muted-foreground hover:text-primary"
                      >
                        support@carelink.com
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <Phone className="h-5 w-5 mr-3 text-primary" />
                    <div>
                      <p className="font-medium">{t("contact:phone")}</p>
                      <a
                        href="tel:+11234567890"
                        className="text-sm text-muted-foreground hover:text-primary"
                      >
                        +1 (123) 456-7890
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <MapPin className="h-5 w-5 mr-3 text-primary" />
                    <div>
                      <p className="font-medium">{t("contact:office")}</p>
                      <p className="text-sm text-muted-foreground">
                        {t("contact:address")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border bg-card p-6">
                <h3 className="text-lg font-semibold mb-4">
                  {t("contact:supportHours")}
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {t("contact:mondayFriday")}
                    </span>
                    <span>{t("contact:businessHours.weekday")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {t("contact:saturday")}
                    </span>
                    <span>{t("contact:businessHours.saturday")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {t("contact:sunday")}
                    </span>
                    <span>{t("contact:closed")}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-4">
                    {t("contact:timezonePlaceholder")}
                  </p>
                </div>
              </div>
            </div>

            <div className="md:col-span-2">
              <div className="rounded-lg border bg-card p-6">
                <h2 className="text-2xl font-semibold mb-6">
                  {t("contact:form.title")}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">{t("contact:form.name")}</Label>
                      <Input
                        id="name"
                        placeholder={t("contact:form.namePlaceholder")}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">{t("contact:form.email")}</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder={t("contact:form.emailPlaceholder")}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">{t("contact:form.subject")}</Label>
                    <Input
                      id="subject"
                      placeholder={t("contact:form.subjectPlaceholder")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">{t("contact:form.message")}</Label>
                    <Textarea
                      id="message"
                      placeholder={t("contact:form.messagePlaceholder")}
                      rows={6}
                    />
                  </div>

                  <Button type="submit" className="w-full sm:w-auto">
                    {t("contact:form.submit")}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Contact;
