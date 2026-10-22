import { ProductPage } from "@/components/ProductPage";
export default function TermsPage() {
  return (
    <ProductPage
      title="Terms of service"
      description="Effective 21 October 2026"
    >
      <section className="pp-policy">
        <p>
          These terms cover your use of Plainpage, operated by Muhammad Awais
          Abdullah. Questions can be sent to awaisabdullahm79@gmail.com.
        </p>
        <h2>Your account and content</h2>
        <p>
          You are responsible for your account security and for having the
          rights to content you upload. You retain ownership of your content and
          permit us to process, store and transmit it only as needed to provide
          the service and features you request.
        </p>
        <h2>Collaboration</h2>
        <p>
          Owners control document access. People you authorize may view or
          change content within their permissions. A review approval records a
          response to a specific revision; it is not a legal signature or
          certification of accuracy.
        </p>
        <h2>Acceptable use</h2>
        <p>
          Do not use Plainpage for unlawful activity, infringement, abuse,
          malware, unauthorized access, or attempts to evade service limits. We
          may restrict access when necessary to protect the service or comply
          with applicable requirements.
        </p>
        <h2>AI suggestions</h2>
        <p>
          AI output may be inaccurate or omit context. You decide whether to
          accept it and remain responsible for your documents. Usage limits may
          apply, and availability depends on service configuration.
        </p>
        <h2>Availability and recovery</h2>
        <p>
          We work to keep your documents available, but do not guarantee
          uninterrupted service or that every failure can be recovered. Use
          export and keep copies of important work. Features may change as the
          service develops. Nothing in these terms limits rights that applicable
          law does not allow us to limit.
        </p>
        <h2>Leaving Plainpage</h2>
        <p>
          You can export owned documents and delete your account from Account
          and data. Account deletion permanently removes owned documents from
          active storage; shared documents owned by others remain. Privacy and
          retention details are described in the Privacy policy.
        </p>
      </section>
    </ProductPage>
  );
}
