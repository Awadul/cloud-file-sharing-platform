import Link from "next/link";
import { Suspense } from "react";
import { Plus, ChevronDown } from "lucide-react";
import PlainpageLogo from "@/components/PlainpageLogo";
import LandingMotion from "./LandingMotion";
import LandingPreview from "./LandingPreview";
import LandingReviews from "./LandingReviews";
import LandingSectionNav from "./LandingSectionNav";
import LandingCreateFeatures from "./LandingCreateFeatures";

const questions = [
  ["Can I bring my existing documents?", "Import plain text (.txt), Markdown (.md), or Word (.docx) files up to 2 MB. Each file becomes an editable document in your workspace."],
  ["Who can open and edit my documents?", "You choose who gets access to each document. Invite people as editors or viewers, and keep your own documents and shared work organized in your workspace."],
  ["How does saving work?", "Your workspace saves edits automatically. When people edit the same document, the last save wins, so it works best to take turns. The landing-page example is saved only in this browser when device storage is available, separately from your workspace."],
];

export default function MarketingLanding() {
  return <div className="pp-landing pp-docs-layout">
    <Suspense fallback={null}><LandingMotion /></Suspense>
    <a className="pp-landing-skip" href="#landing-main">Skip to content</a>
    <header className="pp-landing-header pp-landing-width"><Link href="/" aria-label="Plainpage home"><PlainpageLogo size="md" /></Link><nav aria-label="Account"><Link href="/login">Sign in</Link><Link href="/documents" className="btn pp-landing-button">Open Plainpage</Link></nav></header>
    <main id="landing-main">
      <section className="pp-docs-hero pp-landing-width" aria-labelledby="landing-heading">
        <div className="pp-landing-intro"><h1 id="landing-heading">Write clearly.<br />Share simply.</h1><p>Online documents to help you and your team turn ideas into clear, shared work.</p><div className="pp-docs-hero-actions"><Link href="/login" className="btn btn-primary pp-landing-button">Start writing</Link><a href="#create" className="btn pp-landing-button">Explore Plainpage</a></div></div>
        <div className="pp-docs-hero-product"><Suspense fallback={<div className="pp-landing-paper pp-landing-preview-loading" aria-busy="true"><h2>Product launch brief</h2><p>Opening the example editor…</p></div>}><LandingPreview /></Suspense></div>
      </section>
      <div className="pp-docs-explore"><a href="#create">Explore features<ChevronDown size={20} aria-hidden="true" /></a></div>
      <LandingSectionNav />
      <section id="create" className="pp-docs-section pp-landing-width" aria-labelledby="create-title"><div className="pp-docs-section-heading"><h2 id="create-title">Create documents.<br />Keep your thinking clear.</h2><p>From a quick note to a considered plan, give every idea the structure it needs.</p></div><LandingCreateFeatures /></section>
      <section id="import" className="pp-docs-section pp-docs-import pp-docs-text-section pp-landing-width" aria-labelledby="import-title"><h2 id="import-title">Bring your files.<br />Keep the momentum.</h2><div><p>Your work already has a starting point. Import a text, Markdown, or Word file and continue editing it in Plainpage.</p><p className="pp-docs-file-types">.txt, .md, .docx · up to 2 MB per file</p><Link href="/documents" className="pp-landing-text-link">Import in your workspace</Link></div></section>
      <section id="share" className="pp-docs-section pp-docs-share pp-docs-text-section pp-landing-width" aria-labelledby="share-title"><div><h2 id="share-title">Share the document.<br />Keep the context.</h2><p>A project brief to review. Meeting notes to revisit. A handoff to move forward. Choose who can view the document and who can help edit it.</p><Link href="/documents" className="pp-landing-text-link">Open your workspace</Link></div><dl><div><dt>Editor access</dt><dd>Let teammates contribute to the document.</dd></div><div><dt>Viewer access</dt><dd>Share the context while keeping editing with the right people.</dd></div></dl></section>
      <LandingReviews />
      <section id="faqs" className="pp-landing-questions" aria-labelledby="landing-faq-title"><h2 id="landing-faq-title">Find the answers you need.</h2>{questions.map(([question, answer]) => <details key={question}><summary>{question}<Plus size={18} aria-hidden="true" /></summary><p>{answer}</p></details>)}</section>
      <section className="pp-docs-final pp-landing-width"><PlainpageLogo size="lg" /><h2>Your next idea deserves a clear page.</h2><Link href="/login" className="btn btn-primary pp-landing-button">Start writing</Link></section>
    </main>
    <footer className="pp-landing-footer pp-landing-width"><Link href="/" aria-label="Plainpage home"><PlainpageLogo size="sm" /></Link><span>Write clearly. Share simply.</span><Link href="/documents">Return to your documents</Link></footer>
  </div>;
}
