import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/legal/LegalPageLayout";
import { legal } from "@/lib/legal";

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
        These cookies are required for the site to function. They include
        session cookies, security cookies, and the cookie that remembers your
        cookie consent choices. They do not require consent.
      </p>

      <h3>Analytics</h3>
      <p>
        We may use analytics cookies to understand how visitors use the site,
        which pages perform well, and where we can improve. We will only set
        these cookies if you accept analytics cookies in our consent banner.
      </p>

      <h3>Marketing</h3>
      <p>
        Marketing cookies may be used to measure the effectiveness of our
        advertising and to show relevant content. We will only set these
        cookies if you accept marketing cookies in our consent banner.
      </p>

      <h2>3. Managing your preferences</h2>
      <p>
        When you first visit the site you will see a consent banner where you
        can accept or reject non-essential cookies. You can change your
        choices at any time by clicking the &ldquo;Cookie preferences&rdquo;
        link in the footer of the site, or by clearing the consent cookie
        from your browser.
      </p>
      <p>
        You can also block or delete cookies through your browser settings.
        Most browsers let you refuse all cookies or accept only certain
        types. Please be aware that blocking strictly necessary cookies may
        stop parts of the site from working.
      </p>

      <h2>4. Third-party cookies</h2>
      <p>
        Some cookies on our site may be set by third parties acting as our
        processors (for example, an analytics provider). Where this is the
        case we will list them clearly in the consent banner. We do not
        permit third parties to track you across other sites for their own
        purposes through our website.
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
