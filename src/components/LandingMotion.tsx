"use client";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export default function LandingMotion() {
  useGSAP(() => {
    const media = gsap.matchMedia();
    const root = document.querySelector<HTMLElement>(".pp-docs-layout");
    if (!root) return;
    media.add("(prefers-reduced-motion: no-preference)", () => {
      const distance = window.matchMedia("(max-width: 700px)").matches ? 8 : 14;
      const entrance = gsap.timeline({ defaults: { ease: "power3.out", clearProps: "transform,opacity" } });
      entrance.from(".pp-landing-header > *", { y: -6, opacity: 0, duration: 0.28, stagger: 0.05 })
        .from(".pp-landing-intro h1", { y: distance, opacity: 0, duration: 0.48 }, 0.1)
        .from(".pp-landing-intro > p", { y: distance * 0.6, opacity: 0, duration: 0.36 }, 0.2)
        .from(".pp-docs-hero-actions > *", { y: 6, opacity: 0, duration: 0.28, stagger: 0.06 }, 0.28)
        .from(".pp-docs-hero-product", { x: distance, opacity: 0, duration: 0.5 }, 0.18);

      const reveal = (selector: string, targets: string, direction: "x" | "y" = "y") => {
        const section = root.querySelector(selector);
        if (!section) return;
        const items = section.querySelectorAll(targets);
        if (!items.length) return;
        gsap.from(items, {
          [direction]: distance * 0.7,
          opacity: 0.35,
          duration: 0.36,
          stagger: 0.07,
          ease: "power3.out",
          clearProps: "transform,opacity",
          scrollTrigger: { trigger: section, start: "top 88%", once: true },
        });
      };
      reveal("#create", ".pp-docs-section-heading > *");
      reveal("#import", ":scope > h2, :scope > div", "x");
      reveal("#share", ":scope > div, :scope > dl > div");
      reveal("#customers", ":scope > div, :scope > details");
      reveal("#faqs", ":scope > h2, :scope > details");
      reveal(".pp-docs-final", "h2, .btn");
      gsap.from(".pp-docs-section-nav", { y: -8, opacity: 0.5, duration: 0.3, ease: "power3.out", clearProps: "transform,opacity", scrollTrigger: { trigger: ".pp-docs-explore", start: "top 85%", once: true } });
    });

    let live = true;
    let frame = 0;
    const refresh = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(() => { if (live) ScrollTrigger.refresh(); }); };
    const resize = new ResizeObserver(refresh);
    const main = root.querySelector("main");
    if (main) resize.observe(main);
    void document.fonts.ready.then(() => { if (live) refresh(); });
    return () => { live = false; cancelAnimationFrame(frame); resize.disconnect(); media.revert(); };
  }, []);
  return null;
}
