import { Link } from "@tanstack/react-router";
import { Page, AccountLink, DirectorToggle, btnSecondary } from "@/components/slams";
import { useOfficePreferences } from "@/lib/office-preferences";
import { LanguageSwitch, useLanguage } from "@/lib/i18n";
import { SectionTabs, Unavailable } from "./SectionTabs";
import { AccountDeletion } from "./AccountDeletion";
export function SettingsPage({
  tab,
  onTabChange,
}: {
  tab: string;
  onTabChange: (tab: string) => void;
}) {
  const { preferences, updatePreferences, reducedMotion } = useOfficePreferences();
  const { t, locale } = useLanguage();
  return (
    <Page title={t("Settings")} eyebrow={t("Your studio")} backTo="/">
      <SectionTabs page="settings" value={tab} onChange={onTabChange}>
        {(current) =>
          current === "account" ? (
            <section className="foundation-stack">
              <h2>{t("Account")}</h2>
              <Link to="/auth">Open account management</Link>
              <AccountLink />
              <p>Director, motion and sound preferences stay in this browser.</p>
              <AccountDeletion />
            </section>
          ) : current === "accessibility" ? (
            <section className="foundation-stack">
              <h2>{t("Your experience")}</h2>
              <DirectorToggle />
              <button
                className="preference-button"
                aria-pressed={preferences.motion}
                onClick={() => updatePreferences({ ...preferences, motion: !preferences.motion })}
              >
                Motion {preferences.motion ? "on" : "off"}
              </button>
              {reducedMotion && <p>Motion is reduced by your device preference.</p>}
              <button
                className="preference-button"
                aria-pressed={preferences.sound}
                onClick={() => updatePreferences({ ...preferences, sound: !preferences.sound })}
              >
                Office interaction sound {preferences.sound ? "on" : "off"}
              </button>
              <p>
                Sound is off by default. This controls office taps, not voice recording or spoken
                coaching.
              </p>
              <Unavailable title="Additional controls planned">
                Captions, coach audio and a mature-language filter are not implemented. Approved
                artwork includes mature language.
              </Unavailable>
            </section>
          ) : current === "language" ? (
            <section>
              <h2>{t("Language")}</h2>
              <LanguageSwitch />
              <p lang={locale}>
                {locale === "ar"
                  ? "الواجهة العربية نسخة تجريبية؛ قد تظل بعض الصفحات باللغة الإنجليزية حتى تكتمل المراجعة."
                  : "Arabic interface preview: some pages remain in English while translation and RTL review continue."}
              </p>
            </section>
          ) : (
            <section>
              <h2>{t("Privacy and recording")}</h2>
              <p>
                The current rehearsal is text-only. Camera and microphone capture, recording
                storage, notifications and account-data export are not available here.
              </p>
              <p>
                Passport supports deleting your own saved rehearsal entries. Signed-out records
                belong to this browser; signing in does not silently import them.
              </p>
              <Link to="/passport">Manage saved rehearsals</Link>
              <p>
                Account deletion is managed in the Account tab and requires your current password.
              </p>
            </section>
          )
        }
      </SectionTabs>
      <Link to="/help" className={`${btnSecondary} mt-4`}>
        Help &amp; Studio Guide
      </Link>
    </Page>
  );
}
