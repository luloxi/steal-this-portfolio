import { ReferralsView } from "@/components/views/referrals-view";
import { getDb } from "@/lib/db";
import { shareLinks } from "@/lib/referrals";
import { getMyReferral, type MyReferral } from "@/lib/referrals-db";
import { getSiteSettings } from "@/lib/site-settings-db";
import { getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

/**
 * /referidos (/en/referrals). Anyone can read how it works; creating a code
 * needs Google sign-in, and a signed-in user only ever gets their own data
 * (looked up by the session's user id on the server).
 */
export default async function ReferralsPage() {
  const [viewer, settings] = await Promise.all([getViewer(), getSiteSettings()]);
  let mine: MyReferral | null = null;
  if (viewer) {
    try {
      const db = await getDb();
      mine = db ? await getMyReferral(db, viewer.id) : null;
    } catch (err) {
      console.error("[referidos] own referral", err);
    }
  }
  return (
    <ReferralsView
      viewer={viewer ? { name: viewer.name, email: viewer.email } : null}
      mine={mine}
      links={mine ? shareLinks(mine.referrer.code, settings.url) : null}
    />
  );
}
