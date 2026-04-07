import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/legal/LegalPageLayout";
import { legal } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description:
    "Terms and conditions governing the use of the Get Real Health website and services.",
};

export default function TermsPage() {
  return (
    <LegalPageLayout
      title="Terms & Conditions"
      intro="The terms that apply when you use this website or our services."
    >
      <p>
        These Terms &amp; Conditions (&ldquo;Terms&rdquo;) govern your use of
        the Get Real Health website and any of our services. By using the
        site or our services, you confirm that you accept these Terms.
      </p>

      <h2>1. Who we are</h2>
      <p>
        This website is operated by{" "}
        <strong>{legal.companyName}</strong>, a company registered in{" "}
        {legal.jurisdiction} (company number{" "}
        <a
          href={legal.companyHouseUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          {legal.companyNumber}
        </a>
        ), with registered office at {legal.registeredOffice}.
      </p>
      <p>
        We trade as &ldquo;{legal.tradingName}&rdquo;. You can contact us at{" "}
        <a href={`mailto:${legal.contactEmail}`}>{legal.contactEmail}</a>.
      </p>
      <p>
        Get Real Health is registered with the Care Quality Commission as an
        Independent Medical Agency (provider ID{" "}
        <a href={legal.cqcUrl} target="_blank" rel="noopener noreferrer">
          {legal.cqcProviderId}
        </a>
        ).
      </p>

      <h2>2. Use of this website</h2>
      <p>
        You may use this website for lawful purposes only. You must not use
        it in any way that breaches any applicable law or regulation, or in
        any way that could damage, disable, overburden, or impair the site
        or interfere with any other user&apos;s use of it.
      </p>
      <p>
        We reserve the right to withdraw, change or restrict access to all
        or any part of the site at any time, with or without notice. We will
        not be liable to you if for any reason the site is unavailable at
        any time.
      </p>

      <h2>3. Information on this site</h2>
      <p>
        The information on this website is provided in good faith and for
        general information about our services. It is not intended as
        clinical, legal, financial or other professional advice and should
        not be relied upon as such. While we make reasonable efforts to keep
        the information accurate and up to date, we do not warrant that the
        site will be free from errors or omissions.
      </p>

      <h2>4. Customer services</h2>
      <p>
        Where you sign up to use our clinical platform or any of our paid
        services, that use is governed by a separate Service Agreement
        between you (or your pharmacy) and Get Real Health. In the event of
        any conflict between these website Terms and your Service Agreement,
        the Service Agreement prevails in respect of those services.
      </p>

      <h2>5. Intellectual property</h2>
      <p>
        All content on this site, including text, graphics, logos, icons,
        images, page layouts and software, is owned by{" "}
        {legal.companyName} or used under licence, and is protected by UK
        and international intellectual property laws. You may view, print
        and download extracts of the site for your personal, non-commercial
        use. You may not otherwise reproduce, distribute, modify, transmit,
        or use any content from this site without our prior written consent.
      </p>

      <h2>6. Third-party links</h2>
      <p>
        This site may contain links to third-party websites. These are
        provided for your convenience. We have no control over the content
        of those sites and accept no responsibility for them or for any loss
        or damage that may arise from your use of them.
      </p>

      <h2>7. Limitation of liability</h2>
      <p>
        Nothing in these Terms excludes or limits our liability for death or
        personal injury caused by negligence, fraud or fraudulent
        misrepresentation, or any other liability that cannot be excluded or
        limited under English law.
      </p>
      <p>
        Subject to that, we will not be liable for any indirect, special, or
        consequential loss, or for any loss of profit, revenue, business,
        goodwill, anticipated savings, or data, arising out of or in
        connection with your use of this website.
      </p>

      <h2>8. Privacy and cookies</h2>
      <p>
        Use of this website is also governed by our{" "}
        <a href="/legal/privacy">Privacy Policy</a> and{" "}
        <a href="/legal/cookies">Cookie Policy</a>, which form part of these
        Terms.
      </p>

      <h2>9. Changes to these Terms</h2>
      <p>
        We may revise these Terms from time to time. The version in force is
        the one published on this page. By continuing to use the site after
        any changes, you agree to be bound by the revised Terms.
      </p>

      <h2>10. Governing law</h2>
      <p>
        These Terms, and any dispute or claim arising out of or in connection
        with them, are governed by the laws of {legal.jurisdiction}. You and
        we agree to the exclusive jurisdiction of the courts of{" "}
        {legal.jurisdiction}.
      </p>

      <h2>11. Contact</h2>
      <p>
        If you have any questions about these Terms, please contact us at{" "}
        <a href={`mailto:${legal.contactEmail}`}>{legal.contactEmail}</a>.
      </p>
    </LegalPageLayout>
  );
}
