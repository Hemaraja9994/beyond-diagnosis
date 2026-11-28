import { allProfessions, attendanceModes, states, titles } from "@/lib/programme";
import type { Registration } from "@/lib/store";

/** The full set of registration fields for the coordinator desk (edit and add). Plain HTML: no script needed. */
export function DeskFields({ row }: { row?: Registration }) {
  const field = (label: string, name: string, value = "", hint?: string, type = "text") => (
    <label className="grid gap-1 text-sm font-semibold text-navy">
      {label}
      <input className="field" name={name} type={type} defaultValue={value} />
      {hint ? <span className="font-normal text-muted">{hint}</span> : null}
    </label>
  );
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="grid gap-1 text-sm font-semibold text-navy">
        Title
        <select className="field" name="title" defaultValue={row?.title ?? ""}>
          <option value="">—</option>
          {titles.map((title) => (
            <option key={title} value={title}>
              {title}
            </option>
          ))}
        </select>
      </label>
      {field("Full name (as on certificate)", "fullName", row?.fullName)}
      {field("Email", "email", row?.email, undefined, "email")}
      {field("Mobile", "mobile", row?.mobile)}
      <label className="grid gap-1 text-sm font-semibold text-navy">
        Professional category
        <select className="field" name="profession" defaultValue={row?.profession ?? ""}>
          <option value="" disabled>
            Choose one
          </option>
          {allProfessions.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
      {field("Profession (if Other)", "professionDetail", row?.professionDetail)}
      <label className="grid gap-1 text-sm font-semibold text-navy">
        Claiming RCI CRE points?
        <select className="field" name="creClaim" defaultValue={row?.creClaim ?? ""}>
          <option value="">Not stated</option>
          <option value="yes">Yes — claiming (no limit check from the desk)</option>
          <option value="no">No — attending only</option>
        </select>
      </label>
      {field("CRR number", "crrNumber", row?.crrNumber, "A or B followed by digits; blank or “Not applicable” if not claiming")}
      {field("Designation", "designation", row?.designation)}
      {field("Workplace", "institution", row?.institution)}
      <label className="grid gap-1 text-sm font-semibold text-navy">
        State or Union Territory
        <select className="field" name="stateName" defaultValue={row?.stateName ?? ""}>
          <option value="" disabled>
            Choose one
          </option>
          {states.map((state) => (
            <option key={state} value={state}>
              {state}
            </option>
          ))}
        </select>
      </label>
      {field("Payment ID", "paymentReference", row?.paymentReference, "pay_… or UPI transaction number; may be blank")}
      <label className="grid gap-1 text-sm font-semibold text-navy">
        Attendance (Non-RCI CRE track)
        <select className="field" name="attendance" defaultValue={row?.attendance ?? ""}>
          <option value="">— (RCI track, online)</option>
          {attendanceModes.map((mode) => (
            <option key={mode.value} value={mode.value}>
              {mode.label}
            </option>
          ))}
        </select>
        <span className="font-normal text-muted">Offline hands-on is for Yenepoya colleges; the desk may admit others.</span>
      </label>
      <label className="grid gap-1 text-sm font-semibold text-navy sm:col-span-2">
        Access needs
        <textarea className="field min-h-20" name="accessNeeds" defaultValue={row?.accessNeeds ?? ""} maxLength={500} />
      </label>
      <label className="flex items-center gap-2 text-sm sm:col-span-2">
        <input type="checkbox" name="allowDuplicatePayment" className="h-4 w-4" /> Allow a repeated payment ID (bypass the duplicate check)
      </label>
    </div>
  );
}

export function DeskUploads() {
  const input = (label: string, name: string) => (
    <label className="grid gap-1 text-sm font-semibold text-navy">
      {label}
      <input className="field py-2 text-sm" type="file" name={name} accept="image/jpeg,image/png,image/webp,application/pdf" />
    </label>
  );
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {input("Payment receipt", "receipt")}
      {input("CRR certificate", "crrCertificate")}
      {input("RCI confirmation", "rciConfirmation")}
    </div>
  );
}
