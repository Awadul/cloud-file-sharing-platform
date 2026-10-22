import Link from "next/link";
import PlainpageLogo from "./PlainpageLogo";
export function ProductPage({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="pp-product-page">
      <header>
        <Link href="/" aria-label="Plainpage home">
          <PlainpageLogo size="md" />
        </Link>
        <nav aria-label="Workspace">
          <Link href="/documents">Documents</Link>
          <Link href="/reviews">Reviews</Link>
          <Link href="/trash">Trash</Link>
          <Link href="/account">Account</Link>
        </nav>
      </header>
      <section>
        <h1>{title}</h1>
        {description && <p className="pp-product-description">{description}</p>}
        {children}
      </section>
      <footer>
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
        <a href="mailto:awaisabdullahm79@gmail.com">Contact support</a>
      </footer>
    </main>
  );
}
