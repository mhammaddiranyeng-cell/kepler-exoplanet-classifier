/**
 * OPTIONAL — Cloudflare Pages Function alternative to Formspree.
 *
 * Not deployed as-is. To use it:
 *   1. mv optional-functions/contact.js functions/api/contact.js
 *   2. Set the form endpoints in content/site.mjs to "/api/contact"
 *   3. In the Cloudflare Pages project, add these environment variables:
 *        RESEND_API_KEY   — API key from https://resend.com (free tier)
 *        MAIL_TO          — naba.beqaa@gmail.com
 *        MAIL_FROM        — a verified sender on a domain you control,
 *                           e.g. website@naba.ngo
 *   4. Redeploy.
 *
 * Which to pick: Formspree is fewer moving parts (no keys, no DNS records) and
 * is the default the site ships with. This Function keeps submissions inside
 * Cloudflare and avoids the free tier's 50-submissions/month cap, at the cost
 * of setting up a sender domain. Either works; neither needs a server.
 */

export async function onRequestPost({ request, env }) {
  try {
    const form = await request.formData();

    // Honeypot: the hidden _gotcha field is only ever filled by bots.
    if (form.get("_gotcha")) return json({ ok: true });

    const name = String(form.get("name") || "").slice(0, 200).trim();
    const email = String(form.get("email") || "").slice(0, 200).trim();
    const message = String(form.get("message") || "").slice(0, 5000).trim();

    if (!name || !email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return json({ ok: false, error: "invalid" }, 400);
    }

    // Optional volunteer-form fields.
    const extras = ["phone", "availability", "interest"]
      .map((k) => [k, String(form.get(k) || "").slice(0, 500).trim()])
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n");

    const body = [`Name: ${name}`, `Email: ${email}`, extras, "", message]
      .filter(Boolean)
      .join("\n");

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env.MAIL_FROM,
        to: [env.MAIL_TO],
        reply_to: email,
        subject: `naba.ngo — message from ${name}`,
        text: body,
      }),
    });

    if (!res.ok) return json({ ok: false, error: "send-failed" }, 502);
    return json({ ok: true });
  } catch {
    return json({ ok: false, error: "unexpected" }, 500);
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}
