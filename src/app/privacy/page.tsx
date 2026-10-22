import { ProductPage } from "@/components/ProductPage";
export default function PrivacyPage() {
  return (
    <ProductPage title="Privacy policy" description="Effective 21 October 2026">
      <section className="pp-policy">
        <p>
          Plainpage is operated by Muhammad Awais Abdullah. Contact
          awaisabdullahm79@gmail.com about privacy or your account.
        </p>
        <h2>Information we use</h2>
        <p>
          We process your account email and name, documents, uploaded images,
          sharing invitations, review feedback, and the authentication
          information needed to provide the service. Supabase provides
          authentication, database storage, and image storage. Your password is
          handled by Supabase Auth.
        </p>
        <h2>Sharing and optional services</h2>
        <p>
          Document owners choose who can view or edit their work. Sharing and
          review notifications may send the recipient email and notification
          text to our configured email provider. Optional error monitoring
          excludes document bodies and account identifiers through application
          filtering. Optional analytics count named actions by day without
          visitor identifiers.
        </p>
        <p>
          Clarity checks run locally. When you explicitly request an AI rewrite
          or summary and allow it, the selected text or document text is sent to
          OpenAI. AI requests are configured not to be stored as Responses API
          objects; provider data handling and retention still apply. AI
          suggestions are optional and should be reviewed before use.
        </p>
        <h2>Retention and deletion</h2>
        <p>
          Documents, revision history and Trash remain until you delete your
          account. Account deletion removes your owned documents and associated
          records from the active database. It does not remove documents owned
          by other people. Backups, provider logs and previously delivered
          emails may retain copies according to their configured retention. We
          cannot promise immediate removal from those copies.
        </p>
        <h2>Your choices</h2>
        <p>
          Use Account and data to export owned documents and history, reset your
          password, or delete your account after password verification. Contact
          us to request correction, access, or help with deletion. Do not upload
          sensitive information unless the service meets your requirements.
        </p>
        <h2>Cookies</h2>
        <p>
          Authentication cookies keep you signed in. The public editor example
          may store its draft in your browser. We do not use advertising
          cookies.
        </p>
        <h2>Policy changes</h2>
        <p>
          We will update this page when practices change. Contact us for the
          current configuration or retention details of any optional provider.
        </p>
      </section>
    </ProductPage>
  );
}
