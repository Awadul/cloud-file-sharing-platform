"use client";
import { useEffect, useRef, useState } from "react";
import { activeLandingSection } from "@/lib/landing-section";

const links = [["create", "Create"], ["import", "Import"], ["share", "Share"], ["customers", "Customers"], ["faqs", "FAQs"]];

export default function LandingSectionNav() {
  const [active, setActive] = useState("create");
  const navigation = useRef<HTMLElement>(null);
  const destination = useRef<string | null>(null);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let frame = 0;
    const sections = links.flatMap(([id]) => {
      const element = document.getElementById(id);
      return element ? [element] : [];
    });
    const update = () => {
      frame = 0;
      if (destination.current) return;
      // Anchor destinations sit 100px below the viewport top. Read just below
      // that offset so a short preceding section cannot steal the highlight.
      const readingLine = Math.max(120, (navigation.current?.getBoundingClientRect().bottom ?? 0) + 16);
      const current = activeLandingSection(sections.map(section => ({ id: section.id, top: section.getBoundingClientRect().top })), readingLine);
      if (current) setActive(current);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    const settle = () => {
      destination.current = null;
      schedule();
    };
    const onScroll = () => {
      schedule();
      if (settleTimer.current) clearTimeout(settleTimer.current);
      settleTimer.current = setTimeout(settle, 180);
    };
    const interrupt = () => { destination.current = null; schedule(); };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("wheel", interrupt, { passive: true });
    window.addEventListener("touchstart", interrupt, { passive: true });
    window.addEventListener("keydown", interrupt);
    const resize = new ResizeObserver(schedule);
    sections.forEach(section => resize.observe(section));
    schedule();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("wheel", interrupt);
      window.removeEventListener("touchstart", interrupt);
      window.removeEventListener("keydown", interrupt);
      resize.disconnect();
      cancelAnimationFrame(frame);
      if (settleTimer.current) clearTimeout(settleTimer.current);
    };
  }, []);

  return <nav ref={navigation} className="pp-docs-section-nav" aria-label="Explore Plainpage features">{links.map(([id, label]) => <a key={id} href={`#${id}`} aria-current={active === id ? "location" : undefined} onClick={(event) => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    destination.current = id;
    setActive(id);
    // Also release the selection when clicking an anchor already in position.
    if (settleTimer.current) clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => { destination.current = null; window.dispatchEvent(new Event("scroll")); }, 900);
  }}>{label}</a>)}</nav>;
}
