import { adminFromRequest, deskUser } from "@/lib/admin";
import { json } from "@/lib/http";
import { programme } from "@/lib/programme";
import { applyFilter, registerDocx, registerPdf, type RegisterFilter } from "@/lib/register-export";
import { listRegistrations } from "@/lib/store";

export const runtime = "nodejs";
export const maxDuration = 60;

const filters: RegisterFilter[] = ["all", "confirmed", "cre", "pending"];

/** Printable participant register: ?format=pdf|docx&filter=all|confirmed|cre|pending */
export async function GET(request: Request) {
  const user = deskUser(adminFromRequest(request));
  if (!user) return json({ error: "Sign in at the coordinator desk." }, 401);
  const params = new URL(request.url).searchParams;
  const format = params.get("format") === "docx" ? "docx" : "pdf";
  const filter = filters.find((item) => item === params.get("filter")) ?? "all";
  const rows = applyFilter(await listRegistrations(), filter);
  const name = `participant-register-${programme.acknowledgement}-${filter}`;
  if (format === "docx") {
    const bytes = await registerDocx(rows, filter, user.name);
    return new Response(new Uint8Array(bytes), {
      headers: {
        "content-type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "content-disposition": `attachment; filename="${name}.docx"`,
        "cache-control": "private, no-store",
      },
    });
  }
  const bytes = await registerPdf(rows, filter, user.name);
  return new Response(new Uint8Array(bytes), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `inline; filename="${name}.pdf"`,
      "cache-control": "private, no-store",
    },
  });
}
