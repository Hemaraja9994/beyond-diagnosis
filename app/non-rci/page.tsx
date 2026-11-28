import { redirect } from "next/navigation";
import { onlineProgramme } from "@/lib/programme";

/** Short, easy-to-say address for the non-RCI CRE registration (regular online programme). */
export default function NonRciRedirect() {
  redirect(onlineProgramme.path);
}
