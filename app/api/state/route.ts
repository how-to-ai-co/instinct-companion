import { usageSummary } from "@/lib/usage.mjs";
import { guard, fail } from "@/lib/auth";
import { readState, history, deliveryReceipts } from "@/lib/store.mjs";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    await guard();
    return Response.json({
      ...readState(),
      history: history(),
      receipts: deliveryReceipts(),
      usage: usageSummary(),
    });
  } catch (e) {
    return fail(e);
  }
}
