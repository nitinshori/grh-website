import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/legal/LegalPageLayout";
import { legal } from "@/lib/legal";
import { CookiePreferencesButton } from "@/components/legal/CookiePreferencesButton";

export const metadata: Metadata = {
  // Self-referencing canonical. A site-wide canonical in the root
  // layout once pointed every page at the homepage, which told Google
  // they were all duplicates of it. Declaring each page's own URL is
  // what undoes that.
  alternates: { canonical: "https://getrealhealthpgd.co.uk/legal/cookies" },
  title: "Cookie Policy",
  description:
    "How Get Real Health uses cookies and similar technologies, and how you can control them.",
};

export default function CookiePolicyPage() {
  return (
    <LegalPageLayout
      title="Cookie Policy"
      intro="The cookies we use, why we use them, and how you can control them."
    >
      <p>
        This Cookie Policy explains how{" "}
        <strong>{legal.companyName}</strong> uses cookies and similar
        technologies on our website. It should be read together with our{" "}
        <a href="/legal/privacy">Privacy Policy</a>.
      </p>

      <h2>1. What are cookies?</h2>
      <p>
        Cookies are small text files placed on your device by websites you
        visit. They are widely used to make websites work, or work more
        efficiently, and to provide information to the site owner. Similar
        technologies (such as local storage, pixel tags, and SDKs) work in
        comparable ways.
      </p>

      <h2>2. Categories of cookies we use</h2>
      <p>
        Under the Privacy and Electronic Communications Regulations (PECR) we
        only set non-essential cookies after you have given consent. The
        cookies we use fall into the following categories:
      </p>

      <h3>Strictly necessary</h3>
      <p>
        These cookies are required for the site to work. They include the
        sign-in session cookie, the security check on our sign-up form, and
        the cookie that remembers your cookie choice. They do not require
        consent.
      </p>

      <h3>Analytics and marketing</h3>
      <p>
        With your consent we use Google Analytics to measure visits to the
        site, and Google Ads cookies to measure how our advertising performs.
        These are covered by one choice in our consent banner: &ldquo;Accept
        all&rdquo; allows them, &ldquo;Essential only&rdquo; does not. We
        never set them unless you choose &ldquo;Accept all&rdquo;.
      </p>

      <h3>The cookies we use</h3>
      <table>
        <thead>
          <tr>
            <th>Cookie</th>
            <th>What it is for</th>
            <th>Type</th>
            <th>How long it lasts</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>grh_cookie_consent</td>
            <td>Remembers your cookie choice</td>
            <td>Necessary</td>
            <td>1 year</td>
          </tr>
          <tr>
            <td>Sign-in session cookie (authjs.session-token)</td>
            <td>Keeps pharmacy users signed in to the platform</td>
            <td>Necessary</td>
            <td>Until you sign out, and no more than 12 hours</td>
          </tr>
          <tr>
            <td>Cloudflare Turnstile</td>
            <td>Security check on the sign-up form, to stop automated sign-ups (only when the check is shown)</td>
            <td>Necessary</td>
            <td>Set by Cloudflare for the check only</td>
          </tr>
          <tr>
            <td>Google Analytics (_ga, _ga_*)</td>
            <td>Measures visits to the site and which pages are used</td>
            <td>Analytics, only with your consent</td>
            <td>Up to 2 years</td>
          </tr>
          <tr>
            <td>Google Ads (_gcl_*)</td>
            <td>Measures whether our adverts lead to sign-ups</td>
            <td>Marketing, only with your consent</td>
            <td>Up to 90 days</td>
          </tr>
        </tbody>
      </table>
      <p>
        Pharmacy booking pages (addresses starting /book/) do not load Google
        Analytics or Google Ads.
      </p>

      <h2>3. Managing your preferences</h2>
      <p>
        When you first visit the site you will see a consent banner where you
        can choose &ldquo;Accept all&rdquo; or &ldquo;Essential only&rdquo;.
        You can change your choice at any time using the button below or the
        &ldquo;Cookie preferences&rdquo; link in the footer of the site, or by
        clearing the consent cookie from your browser.
      </p>
      <p>
        <CookiePreferencesButton className="inline-flex items-center px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-lg transition-colors" />
      </p>
      <p>
        You can also block or delete cookies through your browser settings.
        Most browsers let you refuse all cookies or accept only certain
        types. Please be aware that blocking strictly necessary cookies may
        stop parts of the site from working.
      </p>

      <h2>4. Third-party cookies</h2>
      <p>
        The Google Analytics and Google Ads cookies are set by Google, and the
        security check cookie by Cloudflare. Google processes the information
        under its own privacy policy, which you can read at{" "}
        <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
          policies.google.com/privacy
        </a>
        . If you choose &ldquo;Essential only&rdquo;, the Google cookies are
        not set.
      </p>

      <h2>5. Changes to this Cookie Policy</h2>
      <p>
        We may update this Cookie Policy from time to time. The
        &ldquo;Last updated&rdquo; date at the top of the page shows when it
        was most recently revised.
      </p>

      <h2>6. Contact</h2>
      <p>
        Questions about cookies or this policy? Email{" "}
        <a href={`mailto:${legal.privacyEmail}`}>{legal.privacyEmail}</a>.
      </p>
    </LegalPageLayout>
  );
}
