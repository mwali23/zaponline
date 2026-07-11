"use client";

import { useState } from "react";
import { CheckCircle2, MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const districts = ["Kitwe", "Ndola", "Chingola", "Mufulira", "Luanshya", "Kalulushi", "Lufwanyama", "Masaiti", "Mpongwe", "Chililabombwe"];

export function ReportForm() {
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const form = new FormData(event.currentTarget);
    const supabase = createClient();

    if (!supabase) {
      setLoading(false);
      setDone(true);
      setMessage("Demo report captured locally. Connect Supabase to persist community reports.");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      setMessage("Please sign in before submitting so reports can build a trusted reputation.");
      return;
    }

    const districtName = String(form.get("district") ?? "");
    const { data: district, error: districtError } = await supabase
      .from("districts")
      .select("id")
      .eq("name", districtName)
      .single();

    if (districtError || !district) {
      setLoading(false);
      setMessage("That district is not configured yet.");
      return;
    }

    const durationHours = Number(form.get("durationHours") ?? 12);
    const expiresAt = new Date(Date.now() + durationHours * 60 * 60 * 1000).toISOString();

    const { error } = await supabase.from("outage_reports").insert({
      reporter_id: user.id,
      district_id: district.id,
      area_label: form.get("area"),
      status: form.get("status"),
      description: form.get("description"),
      expires_at: expiresAt,
    });

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setDone(true);
    setMessage("Thanks—your report is live until it expires or is archived.");
  }

  if (done) {
    return (
      <form className="form-card" onSubmit={submit}>
        <div style={{ textAlign: "center" }}>
          <div className="step-icon">
            <CheckCircle2 />
          </div>
          <h2>Report received</h2>
          <p>{message}</p>
        </div>
      </form>
    );
  }

  return (
    <form className="form-card" onSubmit={submit}>
      <div className="step-icon" style={{ width: 58, height: 58, margin: "0 0 20px" }}>
        <MapPin />
      </div>
      <h2>What&apos;s the power status?</h2>
      <p>Your report is approximate, expires automatically, and never publishes your exact address.</p>
      <div className="form-grid">
        <div className="field">
          <label htmlFor="district">District</label>
          <select id="district" name="district" className="select" required>
            <option value="">Choose district</option>
            {districts.map((district) => (
              <option key={district}>{district}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="status">Current status</label>
          <select id="status" name="status" className="select" required>
            <option value="outage">Power is out</option>
            <option value="powered">Power is on</option>
            <option value="unstable">Power is unstable</option>
          </select>
        </div>

        <div className="field">
          <label htmlFor="durationHours">Keep report visible for</label>
          <select id="durationHours" name="durationHours" className="select" defaultValue="12">
            <option value="2">2 hours</option>
            <option value="6">6 hours</option>
            <option value="12">12 hours</option>
            <option value="24">24 hours</option>
          </select>
        </div>

        <div className="field">
          <label htmlFor="area">Neighbourhood / landmark</label>
          <input id="area" name="area" className="input" placeholder="e.g. Riverside near the clinic" />
        </div>

        <div className="field full-span">
          <label htmlFor="description">Anything else? (optional)</label>
          <textarea id="description" name="description" className="textarea" rows={4} placeholder="Flickering, restoration time, affected streets..." />
        </div>
      </div>
      <div className="notice">
        Reports are scored using account history, recency, location precision and independent confirmations. Expired
        reports are hidden from the public map but preserved for history.
      </div>
      <button className="button button-primary full" disabled={loading}>
        {loading ? "Submitting..." : "Submit community report"}
      </button>
      {message && (
        <div className="notice" role="status">
          {message}
        </div>
      )}
    </form>
  );
}
