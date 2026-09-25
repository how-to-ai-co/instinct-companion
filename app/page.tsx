import { isDemo } from "@/lib/mode";
import { authenticated } from "@/lib/auth";
import Companion from "@/components/companion";
import Login from "@/components/login";
export const dynamic = "force-dynamic";
export default async function Page() {
  return isDemo || (await authenticated()) ? <Companion /> : <Login />;
}
