import type { Metadata } from "next";
import { ContactForm } from "@/components/contact/contact-form";
import { PageTitle } from "@/components/sections/page-title";
import { getT } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t("footer.contact"), description: t("page.contact.subtitle") };
}

export default async function ContactPage() {
  const { t } = await getT();
  return (
    <>
      <PageTitle kicker={t("contact.kicker")} title={t("footer.contact")} line={t("page.contact.subtitle")} />
      <div className="page-width pb-16 md:pb-24">
        <ContactForm />
      </div>
    </>
  );
}
