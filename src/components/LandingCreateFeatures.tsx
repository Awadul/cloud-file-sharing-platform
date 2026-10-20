"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Pause, Play } from "lucide-react";
const features = [
  { title: "Give your next document a head start", copy: "Start with meeting notes, a project brief, or a weekly update. A useful structure keeps the focus on what you want to say." },
  { title: "Make the important parts easy to find", copy: "Use headings, emphasis, and lists to bring structure to your thinking. Format as you write, with familiar keyboard shortcuts." },
  { title: "Pick up where the work left off", copy: "Keep your documents and shared work in one workspace. Search by title and switch between grid and list views." },
];
export default function LandingCreateFeatures() {
  const [selected, setSelected] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.25 });
    if (root.current) observer.observe(root.current);
    const visibility = () => setPageVisible(!document.hidden);
    document.addEventListener("visibilitychange", visibility);
    return () => { observer.disconnect(); document.removeEventListener("visibilitychange", visibility); };
  }, []);
  const running = inView && pageVisible && !hovered && !focused && !paused;
  return <div className="pp-docs-create-layout" ref={root} data-tour-running={running} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onFocusCapture={() => setFocused(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false); }}>
    <div className="pp-docs-feature-choices" aria-label="Writing features">
      {features.map((feature, index) => <details key={feature.title} open={selected === index} name="plainpage-writing-features" onToggle={event => { if (event.currentTarget.open) setSelected(index); }}><summary>{feature.title}</summary><p>{feature.copy}</p>{selected === index && <span key={selected} className="pp-feature-progress" aria-hidden="true" onAnimationEnd={event => { if (event.target === event.currentTarget) setSelected(current => (current + 1) % features.length); }} />}</details>)}
    </div>
    <div className="pp-docs-feature-example">
      <div key={selected} className="pp-feature-example-content">
      {selected === 0 && <div><p className="pp-docs-example-label">Start a new document</p><div className="pp-docs-starter-examples">{["Meeting notes", "Project brief", "Weekly update"].map(title => <Link href="/documents" key={title}><strong>{title}</strong><span>Open your workspace<ArrowUpRight size={14} aria-hidden="true" /></span></Link>)}</div></div>}
      {selected === 1 && <article className="pp-docs-formatted-example"><p className="pp-docs-example-label">Example document</p><h3>A clear plan for the next release.</h3><p>Give the work a shared direction.</p><h4>What matters</h4><ul><li><strong>One goal.</strong> Make the next step easy to understand.</li><li><strong>Clear ownership.</strong> Know who is moving it forward.</li><li><strong>A useful handoff.</strong> Keep the context with the work.</li></ul></article>}
      {selected === 2 && <div><p className="pp-docs-example-label">Example workspace</p><h3>Your next step is already here.</h3><div className="pp-docs-document-examples">{["Product launch brief", "Weekly team notes", "Project handoff"].map(title => <Link key={title} href="/documents"><span>{title}</span><ArrowUpRight size={16} aria-hidden="true" /></Link>)}</div><Link href="/documents" className="pp-landing-text-link">Return to your documents</Link></div>}
      </div>
      <div className="pp-feature-tour-controls"><button type="button" className="btn btn-ghost" onClick={() => setPaused(current => !current)} aria-pressed={paused}>{paused ? <Play size={14} aria-hidden="true" /> : <Pause size={14} aria-hidden="true" />}{paused ? "Resume tour" : "Pause tour"}</button></div>
    </div>
  </div>;
}
