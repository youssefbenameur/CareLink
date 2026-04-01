import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useTranslation } from "react-i18next";

const Terms = () => {
  const { t } = useTranslation(["legal", "common"]);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 py-12">
        <div className="container max-w-4xl">
          <div className="mb-10">
            <h1 className="text-3xl font-bold">{t("legal:terms.title")}</h1>
            <p className="text-muted-foreground mt-2">
              {t("legal:terms.lastUpdated", { date: t("legal:terms.date") })}
            </p>
          </div>

          <div className="prose prose-slate max-w-none">
            <h2>{t("legal:terms.sections.introduction.title")}</h2>
            <p>{t("legal:terms.sections.introduction.content")}</p>

            <h2>{t("legal:terms.sections.acceptance.title")}</h2>
            <p>{t("legal:terms.sections.acceptance.content")}</p>

            <h2>{t("legal:terms.sections.services.title")}</h2>
            <p>{t("legal:terms.sections.services.content")}</p>

            <h2>{t("legal:terms.sections.privacy.title")}</h2>
            <p>
              {t("legal:terms.sections.privacy.content")}{" "}
              <Link to="/privacy" className="text-primary hover:underline">
                {t("legal:terms.sections.privacy.policyLink")}
              </Link>
            </p>

            <h2>{t("legal:terms.sections.content.title")}</h2>
            <p>{t("legal:terms.sections.content.content")}</p>
            <p>{t("legal:terms.sections.content.license")}</p>

            <h2>{t("legal:terms.sections.prohibited.title")}</h2>
            <p>{t("legal:terms.sections.prohibited.content")}</p>

            <h2>{t("legal:terms.sections.termination.title")}</h2>
            <p>{t("legal:terms.sections.termination.content")}</p>

            <h2>{t("legal:terms.sections.disclaimer.title")}</h2>
            <p>{t("legal:terms.sections.disclaimer.content")}</p>

            <h2>{t("legal:terms.sections.changes.title")}</h2>
            <p>{t("legal:terms.sections.changes.content")}</p>

            <h2>{t("legal:terms.sections.contact.title")}</h2>
            <p>
              {t("legal:terms.sections.contact.content")}{" "}
              <a
                href="mailto:legal@carelink.com"
                className="text-primary hover:underline"
              >
                legal@carelink.com
              </a>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Terms;
