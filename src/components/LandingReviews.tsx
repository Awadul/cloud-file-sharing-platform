"use client";
import { useState, type FormEvent } from "react";
import { Download, Plus } from "lucide-react";

export default function LandingReviews() {
  const [prepared, setPrepared] = useState(false);
  const [error, setError] = useState("");
  function downloadReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const role = String(data.get("role") ?? "").trim();
    const review = String(data.get("review") ?? "").trim();
    if (!name || review.length < 20) { setError("Enter your name and a review of at least 20 characters."); return; }
    setError("");
    const content = `Plainpage customer review\n\nName: ${name}\nRole or team: ${role || "Not provided"}\n\n${review}\n\nPrepared by the reviewer. Not submitted or published.\n`;
    const url = URL.createObjectURL(new Blob([content], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "plainpage-review.txt";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setPrepared(true);
  }
  return (
    <section id="customers" className="pp-landing-reviews pp-landing-width" aria-labelledby="landing-reviews-title">
      <div><h2 id="landing-reviews-title">Customer reviews.</h2><p>We’re collecting first-hand stories from people using Plainpage. Your experience can help shape what comes next.</p><p className="pp-reviews-note">No customer reviews have been published here yet.</p></div>
      <details className="pp-review-invitation"><summary>Used Plainpage? Share your experience.<Plus size={18} aria-hidden="true" /></summary><form onSubmit={downloadReview} onChange={() => { setPrepared(false); setError(""); }}>
        <p className="pp-review-explanation">Prepare a review file you can share with the Plainpage team. This form does not submit or publish your review.</p>
        <label htmlFor="review-name">Your name<input className="input" id="review-name" name="name" autoComplete="name" required maxLength={100} /></label>
        <label htmlFor="review-role">Role or team <span>(optional)</span><input className="input" id="review-role" name="role" maxLength={120} /></label>
        <label htmlFor="review-content">What has Plainpage helped you do?<textarea className="textarea" id="review-content" name="review" rows={4} required minLength={20} maxLength={2000} placeholder="Tell us about a real document or workflow." /></label>
        <button type="submit" className="btn pp-landing-button"><Download size={16} aria-hidden="true" />Download your review</button>
        {error && <p className="pp-review-error" role="alert">{error}</p>}
        {prepared && <p className="pp-review-confirmation" role="status">Your review file is ready. Nothing has been submitted or published.</p>}
      </form></details>
    </section>
  );
}
