import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useTranslation } from "react-i18next";

const Privacy = () => {
  const { t } = useTranslation(["legal", "common"]);

  // Define list items statically to avoid i18n type errors
  const collectionItems = [
    t("legal:privacy.sections.collection.items.1"),
    t("legal:privacy.sections.collection.items.2"),
    t("legal:privacy.sections.collection.items.3"),
    t("legal:privacy.sections.collection.items.4"),
  ];

  const usageItems = [
    t("legal:privacy.sections.usage.items.1"),
    t("legal:privacy.sections.usage.items.2"),
    t("legal:privacy.sections.usage.items.3"),
  ];

  const sharingItems = [
    t("legal:privacy.sections.sharing.items.1"),
    t("legal:privacy.sections.sharing.items.2"),
    t("legal:privacy.sections.sharing.items.3"),
  ];

  const rightsItems = [
    t("legal:privacy.sections.rights.items.1"),
    t("legal:privacy.sections.rights.items.2"),
    t("legal:privacy.sections.rights.items.3"),
    t("legal:privacy.sections.rights.items.4"),
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 py-12">
        <div className="container max-w-4xl">
          <div className="mb-10">
            <h1 className="text-3xl font-bold">{t("legal:privacy.title")}</h1>
            <p className="text-muted-foreground mt-2">
              {t("legal:privacy.lastUpdated", {
                date: t("legal:privacy.date"),
              })}
            </p>
          </div>

          <div className="prose prose-slate max-w-none">
            <h2>{t("legal:privacy.sections.introduction.title")}</h2>
            <p>{t("legal:privacy.sections.introduction.content")}</p>

            <h2>{t("legal:privacy.sections.collection.title")}</h2>
            <p>{t("legal:privacy.sections.collection.content")}</p>
            <ul>
              {collectionItems.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>

            <h2>{t("legal:privacy.sections.usage.title")}</h2>
            <p>{t("legal:privacy.sections.usage.content")}</p>
            <ul>
              {usageItems.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>

            <h2>{t("legal:privacy.sections.sharing.title")}</h2>
            <p>{t("legal:privacy.sections.sharing.content")}</p>
            <ul>
              {sharingItems.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>

            <h2>{t("legal:privacy.sections.security.title")}</h2>
            <p>{t("legal:privacy.sections.security.content")}</p>

            <h2>{t("legal:privacy.sections.rights.title")}</h2>
            <p>{t("legal:privacy.sections.rights.content")}</p>
            <ul>
              {rightsItems.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>

            <h2>{t("legal:privacy.sections.cookies.title")}</h2>
            <p>{t("legal:privacy.sections.cookies.content")}</p>

            <h2>{t("legal:privacy.sections.changes.title")}</h2>
            <p>{t("legal:privacy.sections.changes.content")}</p>

            <h2>{t("legal:privacy.sections.contact.title")}</h2>
            <p>
              {t("legal:privacy.sections.contact.content")}{" "}
              <a
                href="mailto:privacy@carelink.com"
                className="text-primary hover:underline"
              >
                privacy@carelink.com
              </a>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Privacy;
