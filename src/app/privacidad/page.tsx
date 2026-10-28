import { PageShell } from "@/components/page-shell";

import { pageMetadata } from "@/lib/page-metadata";
import { getRequestLocale } from "@/lib/prefs";
import { getSiteSettings } from "@/lib/site-settings-db";

export function generateMetadata() {
  return pageMetadata("/privacidad", {
    es: { title: "Privacidad", description: "Cómo maneja los datos este sitio: sin tracking, login con Google para el programa de referidos." },
    en: { title: "Privacy", description: "How this site handles data: no tracking, Google sign-in for the referral program." },
  });
}

const TEXT = {
  es: {
    title: "Privacidad",
    intro: (host: string, name: string) => `${host} es el sitio personal de ${name}. Esta página explica qué datos usa el sitio. Última actualización: 23 de octubre de 2026.`,
    blocks: [
      ["Visitantes.", "Podés leer todo el sitio sin cuenta. No hay publicidad, trackers de analítica ni cookies de terceros, y no vendemos ni compartimos datos personales con nadie."],
      ["Ingreso con Google.", "Cualquiera puede \u201cIngresar con Google\u201d para sumarse al programa de referidos. El sitio recibe el nombre, el email y la foto de perfil de tu cuenta de Google y los guarda para tu sesión. Ingresar no da acceso a nada más: editar el sitio queda reservado al dueño."],
      ["Referidos.", "Si creás un código de referido, guardamos tu nombre, tu email, tu WhatsApp (si lo dejás), el código y la cuenta de Google a la que queda atado, junto con los clientes que llegan con tu código y lo que te corresponde. Solo vos ves tu panel, y el dueño del sitio los usa para contactarte por tus referidos."],
      ["Formulario de Contratar.", "Cuando mandás un mensaje desde Contratar, guardamos tu nombre, tu email, el mensaje, el presupuesto calculado y el código de referido, si hay uno, para poder responderte y llevar la cuenta de los referidos."],
      ["Cookies.", "El sitio usa unas pocas cookies propias, sin seguimiento: lulox-locale y lulox-theme recuerdan el idioma y el tema que elegiste. Si entrás con un link que tiene ?ref=, la cookie lulox-ref recuerda ese código de referido durante 90 días, así el presupuesto le suma a quien te recomendó. Si ingresás, se suma la cookie de sesión de Better Auth, necesaria para que sigas logueado, y el admin tiene además lulox-edit-mode, que recuerda si el modo edición está activado. No se guarda nada más sobre los visitantes."],
      ["Hosting.", "El sitio corre en Cloudflare, que procesa datos estándar de cada pedido (como la dirección IP) para servir y proteger el sitio, bajo su propia política de privacidad."],
      ["Contacto.", "Preguntas o pedidos de borrado:"],
    ],
  },
  en: {
    title: "Privacy",
    intro: (host: string, name: string) => `${host} is the personal site of ${name}. This page explains what data the site uses. Last updated: October 23, 2026.`,
    blocks: [
      ["Visitors.", "You can read everything on this site without an account. We don't run ads, analytics trackers or third-party cookies, and we don't sell or share personal data with anyone."],
      ["Google sign-in.", "Anyone can \u201cSign in with Google\u201d to join the referral program. The site receives your Google account's name, email address and profile picture and stores them for your session. Signing in gives access to nothing else: editing the site is reserved to its owner."],
      ["Referrals.", "If you create a referral code, we store your name, email, WhatsApp (if you add it), the code and the Google account it is tied to, along with the clients who come with your code and what you've earned. Only you see your panel, and the site owner uses this data to reach you about your referrals."],
      ["Hire form.", "When you send a message from Hire me, we store your name, email, message, the calculated quote and the referral code, if any, so we can reply and keep track of referrals."],
      ["Cookies.", "The site uses a few first-party cookies, no tracking: lulox-locale and lulox-theme remember the language and theme you picked. If you arrive through a link with ?ref=, the lulox-ref cookie remembers that referral code for 90 days, so the quote credits whoever recommended you. When you sign in, the Better Auth session cookie (needed to stay logged in) is added, and the admin also gets lulox-edit-mode (whether edit mode is on). Nothing else is stored about visitors."],
      ["Hosting.", "The site runs on Cloudflare, which processes standard request data (such as IP address) to deliver and protect the site, under its own privacy policy."],
      ["Contact.", "Questions or deletion requests:"],
    ],
  },
} as const;

/** Body in the URL's language: /privacidad (es), /en/privacy (en). */
export default async function PrivacyPage() {
  const [locale, settings] = await Promise.all([getRequestLocale(), getSiteSettings()]);
  const T = TEXT[locale];
  let host = settings.url;
  try { host = new URL(settings.url).host; } catch { /* keep the raw value */ }
  const last = T.blocks.length - 1;
  const contact = settings.contactEmail;
  return (
    <PageShell title={T.title}>
      <div
        className="cp-panel"
        style={{ ["--cp-accent" as string]: "var(--section-about)" }}
      >
        <span className="cp-nav-frame" aria-hidden>
          <span className="cp-nav-corner cp-nav-corner-tl" />
          <span className="cp-nav-corner cp-nav-corner-br" />
        </span>
        <div className="cp-panel-inner space-y-4">
          <p className="cp-prose">{T.intro(host, settings.legalName)}</p>
          {T.blocks.map(([b, text], i) => (
            <p key={b} className="cp-prose">
              <strong>{b}</strong> {text}
              {i === last && contact ? (
                <>
                  {" "}
                  <a href={`mailto:${contact}`} className="cp-prose-link">
                    {contact}
                  </a>
                  .
                </>
              ) : null}
            </p>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
