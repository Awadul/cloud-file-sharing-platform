import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import PlainpageLogo from "@/components/PlainpageLogo";
import LandingMotion from "./LandingMotion";
const examples = [
  ["Meeting notes", "Agenda, decisions and next steps."],
  ["Project briefs", "Goals, scope and owners."],
  ["Handoffs", "Everything the next person needs."],
  ["Weekly updates", "A short note the whole team reads."],
];
export default function MarketingLanding() {
  return (
    <div className="pp-marketing"><LandingMotion/>
      <header className="pp-marketing-header">
        <div className="pp-marketing-container">
          <Link href="/" aria-label="Plainpage">
            <PlainpageLogo size="md" />
          </Link>
          <nav aria-label="Product navigation">
            <a href="#features">Features</a>
            <a href="#how-it-works">How it works</a>

          </nav>
          <div>
            <Link href="/login">Log in</Link>
            <Link href="/login" className="btn btn-primary pp-marketing-btn">
              Get started
            </Link>
          </div>
        </div>
      </header>
      <main>
        <section className="pp-marketing-hero pp-marketing-container" data-animate>
          <div>
            <p className="pp-product-eyebrow">A little more clarity. A lot less friction.</p>
            <h1>
              Write clearly.
              <br />
              <span className="pp-gradient-text">Share simply.</span>
            </h1>
            <p>
              Plainpage is a lightweight document editor for teams. Write rich
              text, import the files you already have, and share each document
              as editor or viewer.
            </p>
            <div className="pp-marketing-actions">
              <Link href="/login" className="btn btn-primary pp-marketing-btn">
                <ArrowRight size={16} />
                Get started
              </Link>
              <a href="#how-it-works" className="btn pp-marketing-btn">
                See how it works
              </a>
            </div>
          </div>
          <div
            className="card pp-product-preview pp-floating-document"
            aria-label="Example document"
          >
            <div className="pp-preview-title">
              <strong>Product launch brief</strong>
              <span>
                <Check size={13} />
                Saved
              </span>
            </div>
            <div className="pp-preview-toolbar" aria-hidden="true">
              <b>B</b>
              <i>I</i>
              <u>U</u>
              <span>H1</span>
              <span>H2</span>
            </div>
            <div className="pp-preview-writing">
              <h2>Launch plan</h2>
              <p>Three goals for the quarter, and who owns each one.</p>
              <ul>
                <li>Announce to existing customers</li>
                <li>Publish the new landing page</li>
                <li className="pp-typing-line">Collect feedback after one week<span className="pp-typing-caret" aria-hidden="true"/></li>
              </ul>
            </div>
          </div>
        </section>
        <section className="pp-marketing-container pp-marketing-templates" data-animate>
          <div className="pp-marketing-section-title">
            <h2>Start from the document you need</h2>
            <p>Plainpage fits the writing teams do every week.</p>
          </div>
          <div>
            {examples.map(([title, copy]) => (
              <Link href="/documents" className="card pp-marketing-template" key={title}>
                
                <section>
                  <h3>{title}</h3>
                  <p>{copy}</p>
                </section>
              </Link>
            ))}
          </div>
        </section>
        <section
          id="features"
          className="pp-marketing-container pp-marketing-features" data-animate
        >
          <div className="pp-marketing-section-title">
            <h2>Everything you need. Nothing you do not.</h2>
          </div>
          <div>
            {[
              [
                "Rich text editing",
                "Bold, italic, underline, headings and lists. Your work saves itself as you type.",
              ],
              [
                "Bring your files",
                "Import .txt, .md or .docx files up to 2 MB and keep them as editable documents.",
              ],
              [
                "Share with control",
                "Give each person editor or viewer access. Owned and shared documents stay clearly apart.",
              ],
            ].map(([title, copy]) => {
              return (
                <article className="card" key={String(title)}>
                  <h3>{String(title)}</h3>
                  <p>{String(copy)}</p>
                </article>
              );
            })}
          </div>
        </section>
        <section id="how-it-works" className="pp-marketing-container">
          <div className="pp-marketing-steps">
            {[
              ["Create a document", "Start in a clean, focused editor."],
              ["Bring your files", "Import .txt, .md or .docx."],
              ["Share with control", "Invite people as editors or viewers."],
            ].map(([title, copy], i) => (
              <div key={title}>
                <span>{i + 1}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{copy}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="pp-marketing-container pp-faq" data-animate>
          <div className="pp-marketing-section-title">
            <h2>Questions, answered</h2>
          </div>
          <div>
            {[
              [
                "Which files can I import?",
                "Plain text (.txt), Markdown (.md) and Word (.docx) files up to 2 MB. Each file becomes a new editable document.",
              ],
              [
                "Who can see my documents?",
                "Every document has one owner. People you add can open it as editors or viewers, depending on the access you grant.",
              ],
              [
                "Can two people edit at once?",
                "The last save wins, so it works best when people take turns. Real-time collaboration is not included in this version.",
              ],
              [
                "Do I need to install anything?",
                "No. Plainpage runs in your browser.",
              ],
            ].map(([q, a], i) => (
              <details open={i === 0} key={q}>
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </section>
        <section className="pp-marketing-cta">
          <div className="pp-marketing-container">
            <div>
              <h2>Start writing in a minute.</h2>
              <p>
                Sign in, create a document, share it. That is the whole setup.
              </p>
            </div>
            <Link href="/login" className="btn pp-marketing-btn">
              Get started
              <ArrowRight size={15} />
            </Link>
          </div>
        </section>
      </main>
      <footer className="pp-marketing-container pp-marketing-footer">
        <Link href="/" aria-label="Plainpage">
          <PlainpageLogo size="sm" />
        </Link>
        <div>
          <a href="#features">Features</a>
          <Link href="/login">Log in</Link>
          <Link href="/login">Get started</Link>
        </div>
        <p>© 2026 Plainpage</p>
      </footer>
    </div>
  );
}
