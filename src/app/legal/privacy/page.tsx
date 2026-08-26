import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/legal/LegalPageLayout";
import { legal } from "@/lib/legal";

export const metadata: Metadata = {
  // Self-referencing canonical. A site-wide canonical in the root
  // layout once pointed every page at the homepage, which told Google
  // they were all duplicates of it. Declaring each page's own URL is
  // what undoes that.
  alternates: { canonical: "https://getrealhealthpgd.co.uk/legal/privacy" },
  title: "Privacy Policy",
  description:
    "How Get Real Health collects, uses, stores and protects personal data, and your rights under UK GDPR.",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      intro="How we collect, use, and protect personal data — and the rights you have under UK GDPR and the Data Protection Act 2018."
    >
      <p>
        This Privacy Policy explains how <strong>{legal.companyName}</strong>{" "}
        (trading as &ldquo;{legal.tradingName}&rdquo;, &ldquo;we&rdquo;,
        &ldquo;us&rdquo;, &ldquo;our&rdquo;) collects, uses, shares and
        protects personal data when you visit our website, contact us, or
        use our services. We are committed to handling personal data in line
        with the UK General Data Protection Regulation (UK GDPR) and the Data
        Protection Act 2018.
      </p>

      <h2>1. Who we are</h2>
      <p>
        <strong>{legal.companyName}</strong> is a company registered in{" "}
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
        We are the data controller in respect of the personal data described
        in this policy. You can contact us at{" "}
        <a href={`mailto:${legal.privacyEmail}`}>{legal.privacyEmail}</a>.
      </p>
      {legal.icoRegistration && (
        <p>
          We are registered with the UK Information Commissioner&apos;s
          Office (ICO) under registration number{" "}
          <strong>{legal.icoRegistration}</strong>.
        </p>
      )}

      <h2>2. What personal data we collect</h2>
      <p>We may collect and process the following categories of personal data:</p>
      <ul>
        <li>
          <strong>Contact details</strong> &mdash; name, job title, pharmacy
          name, business email, business phone number &mdash; provided when
          you fill in a form, request a demo, or email us.
        </li>
        <li>
          <strong>Account data</strong> &mdash; if you become a customer, we
          hold the credentials, role, and pharmacy organisation linked to
          your account on our platform.
        </li>
        <li>
          <strong>Communications</strong> &mdash; the content of emails,
          chat, or call transcripts you exchange with us, including AI voice
          receptionist call recordings and transcripts where applicable.
        </li>
        <li>
          <strong>Technical / device data</strong> &mdash; IP address,
          browser type and version, device type, operating system, referring
          URL, pages visited, and timestamps. This data is collected
          automatically through our hosting infrastructure and analytics
          tools.
        </li>
        <li>
          <strong>Cookies and similar technologies</strong> &mdash; see our{" "}
          <a href="/legal/cookies">Cookie Policy</a> for details.
        </li>
      </ul>
      <p>
        We do not knowingly collect or process patient health data through
        this website. Patient consultations carried out via the Get Real
        Health clinical platform are governed by a separate processing
        agreement between us and the operating pharmacy.
      </p>

      <h2>3. Lawful bases for processing</h2>
      <p>We rely on the following lawful bases under Article 6 UK GDPR:</p>
      <ul>
        <li>
          <strong>Legitimate interests</strong> &mdash; to respond to your
          enquiries, manage our customer relationships, run our business,
          improve our products, and keep our website secure.
        </li>
        <li>
          <strong>Performance of a contract</strong> &mdash; where you are a
          customer, to provide and administer the services you have signed
          up to.
        </li>
        <li>
          <strong>Consent</strong> &mdash; for non-essential cookies and any
          marketing communications. You can withdraw consent at any time.
        </li>
        <li>
          <strong>Legal obligation</strong> &mdash; where we are required to
          process data to comply with a legal or regulatory requirement.
        </li>
      </ul>

      <h2>4. How we use your personal data</h2>
      <p>We use personal data to:</p>
      <ul>
        <li>respond to enquiries and demo requests;</li>
        <li>set up and administer customer accounts on our platform;</li>
        <li>
          send service-related communications (e.g. account updates, billing,
          security notices);
        </li>
        <li>
          send marketing communications about our services, where you have
          opted in, with an unsubscribe option in every email;
        </li>
        <li>
          monitor, secure, and improve our website and platform (including
          fraud prevention and abuse detection);
        </li>
        <li>
          comply with legal, regulatory and clinical governance obligations.
        </li>
      </ul>

      <h2>5. Sharing your personal data</h2>
      <p>
        We share personal data only with trusted third parties acting on our
        behalf or where required by law. Our key categories of recipients are:
      </p>
      <ul>
        <li>
          <strong>Hosting and infrastructure providers</strong> &mdash; for
          example our web hosting, database, email and analytics providers.
        </li>
        <li>
          <strong>Payment processors</strong> &mdash; for customer billing.
        </li>
        <li>
          <strong>Professional advisers</strong> &mdash; lawyers, accountants
          and auditors, where necessary.
        </li>
        <li>
          <strong>Regulators and authorities</strong> &mdash; where required
          by law (e.g. CQC, MHRA, ICO, HMRC, courts).
        </li>
      </ul>
      <p>
        We do not sell personal data. Where any third-party processor is
        located outside the UK, we put appropriate safeguards in place
        (typically the UK International Data Transfer Addendum).
      </p>

      <h2>6. How long we keep your personal data</h2>
      <p>
        We keep personal data only for as long as necessary for the purposes
        we collected it for, and to comply with our legal and regulatory
        obligations. As a guide:
      </p>
      <ul>
        <li>
          enquiry data: typically 24 months from your last interaction with us;
        </li>
        <li>
          customer account data: for the lifetime of the contract plus 7
          years (to meet HMRC and clinical governance retention rules);
        </li>
        <li>
          marketing contact data: until you unsubscribe or ask us to delete
          your record.
        </li>
      </ul>

      <h2>7. Your rights</h2>
      <p>Under UK GDPR you have the right to:</p>
      <ul>
        <li>request access to the personal data we hold about you;</li>
        <li>request correction of inaccurate or incomplete data;</li>
        <li>request erasure of your personal data in certain circumstances;</li>
        <li>request restriction or object to certain processing;</li>
        <li>request data portability in certain circumstances;</li>
        <li>withdraw consent at any time where consent is the lawful basis;</li>
        <li>
          lodge a complaint with the UK Information Commissioner&apos;s Office
          at{" "}
          <a
            href="https://ico.org.uk/make-a-complaint/"
            target="_blank"
            rel="noopener noreferrer"
          >
            ico.org.uk
          </a>{" "}
          if you are unhappy with how we have handled your data.
        </li>
      </ul>
      <p>
        To exercise any of these rights, please email us at{" "}
        <a href={`mailto:${legal.privacyEmail}`}>{legal.privacyEmail}</a>.
      </p>

      <h2>8. Security</h2>
      <p>
        We use technical and organisational measures designed to protect
        personal data against unauthorised access, loss, alteration or
        disclosure. These include encryption in transit, role-based access
        controls, audit logging, and regular review of our security posture.
      </p>

      <h2>9. Changes to this policy</h2>
      <p>
        We may update this Privacy Policy from time to time. The
        &ldquo;Last updated&rdquo; date at the top of the page shows when it
        was most recently revised. Significant changes will be communicated
        directly to customers where appropriate.
      </p>

      <h2>10. Contact</h2>
      <p>
        Questions about this Privacy Policy or how we handle your data?
        Email <a href={`mailto:${legal.privacyEmail}`}>{legal.privacyEmail}</a>.
      </p>
    </LegalPageLayout>
  );
}
