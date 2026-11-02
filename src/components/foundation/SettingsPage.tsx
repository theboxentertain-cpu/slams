import { Link } from "@tanstack/react-router";
import { Page, AccountLink, DirectorToggle } from "@/components/slams";
import { useOfficePreferences } from "@/lib/office-preferences";
import { SectionTabs, Unavailable } from "./SectionTabs";
export function SettingsPage({
  tab,
  onTabChange,
}: {
  tab: string;
  onTabChange: (tab: string) => void;
}) {
  const { preferences, updatePreferences, reducedMotion } = useOfficePreferences();
  return (
    <Page title="Settings" eyebrow="Your studio" backTo="/">
      <SectionTabs page="settings" value={tab} onChange={onTabChange}>
        {(current) =>
          current === "account" ? (
            <section className="foundation-stack">
              <h2>Account</h2>
              <Link to="/auth">Open account management</Link>
              <AccountLink />
              <p>Director, motion and sound preferences stay in this browser.</p>
            </section>
          ) : current === "accessibility" ? (
            <section className="foundation-stack">
              <h2>Your experience</h2>
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
              <h2>Language</h2>
              <p>English is currently available.</p>
              <Unavailable>
                Arabic interface translation and RTL verification are planned. Selecting an
                unsupported language is not offered.
              </Unavailable>
            </section>
          ) : (
            <section>
              <h2>Privacy and recording</h2>
              <p>
                The current rehearsal is text-only. Camera and microphone capture, recording
                storage, notifications, account-data export and account deletion are not available
                here.
              </p>
              <p>
                Passport supports deleting your own saved rehearsal entries. Signed-out records
                belong to this browser; signing in does not silently import them.
              </p>
              <Link to="/passport">Manage saved rehearsals</Link>
            </section>
          )
        }
      </SectionTabs>
    </Page>
  );
}
