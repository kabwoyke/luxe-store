import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage, List, Section } from "@/components/content/content-page";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "How LUXESTORE collects, uses and protects your personal data under the Kenya Data Protection Act, 2019, and the rights you have.",
};

export default async function PrivacyPage() {
  const { supportEmail } = await getSettings();

  return (
    <ContentPage
      eyebrow="Privacy"
      title="Privacy policy"
      intro="We collect only what we need to take and deliver your order, and we handle it in line with the Kenya Data Protection Act, 2019."
      updated="October 2026"
    >
      <Section title="Who we are">
        <p>
          LUXESTORE is the data controller for the personal data described here. You can reach us about privacy
          questions {supportEmail ? <>at <a href={`mailto:${supportEmail}`} className="font-semibold text-mauve hover:text-mauve-dark">{supportEmail}</a> or </> : null}
          through our{" "}
          <Link href="/contact" className="font-semibold text-mauve hover:text-mauve-dark">
            contact page
          </Link>
          .
        </p>
      </Section>

      <Section title="What we collect">
        <List>
          <li>
            <strong className="text-ink">Account details:</strong> your name, email address and a password, which we
            store only in scrambled (hashed) form.
          </li>
          <li>
            <strong className="text-ink">Order and delivery details:</strong> what you ordered, the recipient name,
            phone number, county and delivery address, and any notes you add.
          </li>
          <li>
            <strong className="text-ink">Payment details:</strong> the M-Pesa phone number you pay from, the amount, and
            the M-Pesa receipt number. We never see or store your M-Pesa PIN.
          </li>
          <li>
            <strong className="text-ink">Messages and sign-ups:</strong> what you send through the contact form, and
            your email if you join our newsletter.
          </li>
          <li>
            <strong className="text-ink">Reviews:</strong> the name and comment you choose to publish with a review.
          </li>
        </List>
      </Section>

      <Section title="Why we use it">
        <List>
          <li>To process, pay for, deliver and support your orders, and to issue receipts.</li>
          <li>To keep your account secure and prevent fraud or misuse.</li>
          <li>To reply to your questions and to handle returns and refunds.</li>
          <li>To send newsletters, only if you joined the list. You can unsubscribe at any time.</li>
          <li>To meet our legal, tax and accounting duties.</li>
        </List>
      </Section>

      <Section title="Cookies and similar storage">
        <p>
          We use a secure session cookie to keep you logged in. Your cart and wishlist are saved in your own browser so
          they are still there when you come back. We do not use advertising or cross-site tracking cookies.
        </p>
      </Section>

      <Section title="Who we share it with">
        <p>We share data only where it is needed to serve you:</p>
        <List>
          <li>Safaricom, which processes M-Pesa payments.</li>
          <li>Delivery riders and couriers, who receive your name, phone number and address.</li>
          <li>Service providers that host our website, database and product images, under confidentiality terms.</li>
          <li>Authorities, where the law requires it.</li>
        </List>
        <p>We do not sell your personal data.</p>
      </Section>

      <Section title="How long we keep it">
        <p>
          We keep account and order records for as long as your account is open and for as long afterwards as accounting,
          tax and legal rules require. Newsletter details are kept until you unsubscribe. Messages from the contact form
          are kept only as long as needed to deal with your request.
        </p>
      </Section>

      <Section title="Your rights">
        <p>Under the Data Protection Act, 2019 you have the right to:</p>
        <List>
          <li>be told how your data is used, and ask for a copy of it;</li>
          <li>ask us to correct data that is wrong or out of date;</li>
          <li>ask us to delete your data, where we are not required to keep it;</li>
          <li>object to, or ask us to restrict, certain uses, including marketing;</li>
          <li>receive your data in a usable format.</li>
        </List>
        <p>
          To use any of these rights, contact us and we will reply within a reasonable time. If you are not satisfied,
          you can complain to the Office of the Data Protection Commissioner (ODPC) at{" "}
          <a href="https://www.odpc.go.ke" className="font-semibold text-mauve hover:text-mauve-dark" rel="noopener noreferrer">
            odpc.go.ke
          </a>
          .
        </p>
      </Section>

      <Section title="Keeping your data safe">
        <p>
          Our site uses encrypted connections, passwords are stored hashed, and access to customer data is limited to
          staff who need it. No system is perfect, so please choose a strong, unique password.
        </p>
      </Section>

      <Section title="Children">
        <p>Our shop is not meant for people under 18, and we do not knowingly collect their data.</p>
      </Section>

      <Section title="Changes to this policy">
        <p>When we change this policy we will update the date at the top of this page.</p>
      </Section>
    </ContentPage>
  );
}
