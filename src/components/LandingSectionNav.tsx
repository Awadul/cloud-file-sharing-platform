"use client";
import { useEffect, useState } from "react";
const links = [["create", "Create"], ["import", "Import"], ["share", "Share"], ["customers", "Customers"], ["faqs", "FAQs"]];
export default function LandingSectionNav() {
  const [active, setActive] = useState("create");
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible[0]) setActive(visible[0].target.id);
    }, { rootMargin: "-15% 0px -50% 0px", threshold: 0 });
    links.forEach(([id]) => { const section = document.getElementById(id); if (section) observer.observe(section); });
    return () => observer.disconnect();
  }, []);
  return <nav className="pp-docs-section-nav" aria-label="Explore Plainpage features">{links.map(([id, label]) => <a key={id} href={`#${id}`} aria-current={active === id ? "location" : undefined} onClick={() => setActive(id)}>{label}</a>)}</nav>;
}
