import { isDemo } from "@/lib/mode";
import { authenticated } from "@/lib/auth";
import Companion from "@/components/companion";
import PublicCompanion from "@/components/public-companion";
import Login from "@/components/login";
export const dynamic = "force-dynamic";
export default async function Page() {
  if (isDemo || process.env.VERCEL) return <PublicCompanion />;
  return (await authenticated()) ? <Companion /> : <Login />;
}
