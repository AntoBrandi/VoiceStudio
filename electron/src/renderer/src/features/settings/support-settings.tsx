import { runRendererTask } from '@/lib/global-error-recovery';
import {
  ArrowUpRightIcon,
  Globe2Icon,
  LightbulbIcon,
  MailIcon,
  MessagesSquareIcon,
  RadioIcon,
  ShieldCheckIcon,
  StarIcon,
} from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { brandIcon } from '@/lib/brand';
import { ReportBug } from '@/components/report-bug';
import { ExternalLink } from '@/components/external-link';
import {
  ISSUES_URL,
  DISCORD_URL,
  SECURITY_URL,
  EMAIL,
  WEBSITE_URL,
  X_URL,
} from '@shared/utils/contactLinks';
import './support-settings.css';

export function SupportSettings() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const channels = [
    ['contact.feature_cta', ISSUES_URL, LightbulbIcon],
    ['contact.community_cta', DISCORD_URL, MessagesSquareIcon],
    ['contact.follow_cta', X_URL, RadioIcon],
    ['contact.security_cta', SECURITY_URL, ShieldCheckIcon],
    ['contact.email', 'mailto:' + EMAIL, MailIcon],
    ['contact.website', WEBSITE_URL, Globe2Icon],
  ] as const;

  return (
    <div className="support-studio">
      <header className="support-intro">
        <div className="support-emblem" aria-hidden="true">
          <img src={brandIcon} alt="" width={100} height={100} />
        </div>
        <h1>{t('support.tab_support')}</h1>
      </header>

      <div className="support-community" role="group" aria-label={t('support.other_ways')}>
        <span>{t('support.other_ways')}</span>
        <ExternalLink href="https://github.com/debpalash/VoiceStudio">
          <StarIcon aria-hidden="true" />
          {t('support.star_github')}
        </ExternalLink>
        <ExternalLink href={DISCORD_URL}>
          <MessagesSquareIcon aria-hidden="true" />
          {t('support.join_discord')}
        </ExternalLink>
      </div>

      <section className="support-tile support-license" aria-labelledby="support-pro-heading">
        <span className="mb-4 w-fit rounded-md bg-primary/10 px-2 py-1 text-xs font-semibold tracking-wider text-primary">
          {t('supportPlans.pro')}
        </span>
        <h2 id="support-pro-heading">{t('proPage.title')}</h2>
        <p>{t('proPage.hero_body')}</p>
        <p>{t('proPage.billing_note')}</p>
        <button
          type="button"
          onClick={() => runRendererTask('Open Pro', () => navigate({ to: '/pro' }))}
          className="mt-4 flex min-h-11 items-center gap-2 text-sm font-medium text-primary hover:underline focus-visible:outline-2 focus-visible:outline-primary"
        >
          {t('supportPlans.get_pro')}
          <ArrowUpRightIcon aria-hidden="true" className="size-3" />
        </button>
      </section>

      <section className="support-contact" aria-labelledby="support-contact-heading">
        <div className="support-contact-heading">
          <h2 id="support-contact-heading">{t('contact.channels_label')}</h2>
          <ReportBug />
        </div>
        <div className="support-channel-grid">
          {channels.map(([label, href, Icon]) => (
            <ExternalLink key={href} href={href}>
              <Icon aria-hidden="true" />
              <span>{t(label)}</span>
            </ExternalLink>
          ))}
        </div>
      </section>
    </div>
  );
}
