import { FacebookIcon, InstagramIcon } from "@/components/home/social-icons";
import { NewsletterForm } from "@/components/home/newsletter-form";
import { HomeImage } from "@/components/home/home-image";
import { getT } from "@/lib/i18n-server";
import { HOME_IMAGES, SITE } from "@/lib/site";

// Cores explícitas (mustard + ink): a faixa é de marca e não deve inverter no tema escuro.
export async function NewsletterBand() {
  const { t } = await getT();
  const socials = [
    { href: SITE.social.instagram, label: t("social.instagram"), Icon: InstagramIcon },
    { href: SITE.social.facebook, label: t("social.facebook"), Icon: FacebookIcon },
  ].filter((s): s is typeof s & { href: string } => !!s.href);

  return (
    <section className="bg-mustard text-ink">
      <div className="px-fluid flex w-full items-center gap-3 py-8 sm:gap-8 md:py-12 lg:py-14">
        <HomeImage slot={HOME_IMAGES.newsletterLeft} placeholder="side" sizes="112px" className="aspect-[3/4] w-10 shrink-0 sm:w-20 md:w-28" />
        <div className="mx-auto flex w-full max-w-xl min-w-0 flex-col items-center gap-3 text-center">
          <h2 className="text-2xl sm:text-4xl">{t("newsletter.title")}</h2>
          <NewsletterForm />
          {socials.length > 0 && (
            <ul className="flex gap-2">
              {socials.map(({ href, label, Icon }) => (
                <li key={href}>
                  <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="flex size-11 items-center justify-center">
                    <Icon className="size-6" />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
        <HomeImage slot={HOME_IMAGES.newsletterRight} placeholder="side" sizes="112px" className="aspect-[3/5] w-14 shrink-0 sm:w-20 md:w-28" />
      </div>
    </section>
  );
}
