import { guard, fail } from "@/lib/auth";
import { saveWorkspace, changeState } from "@/lib/store.mjs";
export async function POST(request: Request) {
  try {
    await guard(request);
    const body = await request.json();
    return Response.json(
      saveWorkspace(body.workspace, body.revision, "Updated workspace"),
    );
  } catch (e) {
    return fail(e);
  }
}
export async function DELETE(request: Request) {
  try {
    await guard(request);
    const body = await request.json();
    return Response.json(
      changeState(
        body.revision,
        "Removed workspace",
        (s: { workspaces: { id: string }[] }) => ({
          ...s,
          workspaces: s.workspaces.filter((w) => w.id !== body.id),
        }),
      ),
    );
  } catch (e) {
    return fail(e);
  }
}
