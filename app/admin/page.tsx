import type { Metadata } from "next";
import { LoginForm } from "@/components/login-form";
import { MeetingForm } from "@/components/meeting-form";
import { PageBanner } from "@/components/page-banner";
import { adminReady, currentAdmin } from "@/lib/admin";
import { professionLabel, programme, sourceLabel, type ArrivalSource, type Profession } from "@/lib/programme";
import { getMeetingUrl, listQueries, listRegistrations, storageMode } from "@/lib/store";

export const metadata: Metadata = { title: "Coordinator desk", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const email = await currentAdmin();
  if (!email) {
    return (
      <div className="pb-10">
        <PageBanner
          kicker="Coordinator desk"
          title={`For ${programme.coordinator}`}
          lede={`Sign in with ${programme.email} and the access code for this deployment. From here you can export registrations and queries, and publish the Webex link.`}
        />
        <div className="mx-auto max-w-6xl px-4 py-10">
          <LoginForm ready={adminReady()} />
        </div>
      </div>
    );
  }

  const [registrations, queries, meeting] = await Promise.all([listRegistrations(), listQueries(), getMeetingUrl()]);
  const mode = storageMode();

  return (
    <div className="pb-10">
      <PageBanner
        kicker="Coordinator desk"
        title="Registrations and queries"
        lede={`Signed in as ${email}. Export a spreadsheet, or publish the Cisco Webex link participants will open from Join.`}
      />
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8">
        {mode === "local" ? (
          <p className="rounded-2xl bg-navy/5 px-4 py-3 text-sm leading-6 text-green-dark">
            This copy is using a temporary database on the machine that is running it. A published deployment stores registrations in its own database or in the connected file store.
          </p>
        ) : null}
        <div className="flex flex-wrap items-center gap-3">
          <a className="inline-flex min-h-11 items-center rounded-full bg-green px-4 font-semibold text-white" href="/api/admin/export/registrations">
            Export registrations CSV
          </a>
          <a className="inline-flex min-h-11 items-center rounded-full bg-navy px-4 font-semibold text-white" href="/api/admin/export/queries">
            Export queries CSV
          </a>
          <form action="/api/admin/logout" method="post">
            <button className="min-h-11 rounded-full border border-line px-4 font-semibold" type="submit">
              Sign out
            </button>
          </form>
        </div>
        <section className="rounded-3xl bg-card p-5 ring-1 ring-line">
          <h2 className="font-serif text-2xl text-navy">Webex link</h2>
          <p className="mt-2 text-sm leading-6 text-muted">Only an https address on webex.com is accepted. Join and the RCI attend page use it immediately.</p>
          <div className="mt-4 max-w-xl">
            <MeetingForm current={meeting} />
          </div>
        </section>
        <section>
          <h2 className="font-serif text-2xl text-navy">Registrations ({registrations.length})</h2>
          {registrations.length === 0 ? (
            <p className="mt-3 text-muted">No one has registered yet.</p>
          ) : (
            <div className="mt-3 overflow-x-auto rounded-3xl ring-1 ring-line">
              <table className="min-w-[720px] w-full text-left text-sm">
                <caption className="sr-only">Registrations</caption>
                <thead className="bg-paper text-muted">
                  <tr>
                    <th className="px-3 py-3 font-semibold">Reference</th>
                    <th className="px-3 py-3 font-semibold">Name</th>
                    <th className="px-3 py-3 font-semibold">Email</th>
                    <th className="px-3 py-3 font-semibold">CRR</th>
                    <th className="px-3 py-3 font-semibold">Category</th>
                    <th className="px-3 py-3 font-semibold">Payment</th>
                    <th className="px-3 py-3 font-semibold">From</th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.map((row) => (
                    <tr key={row.id} className="border-t border-line bg-card">
                      <td className="px-3 py-3 font-semibold">{row.reference}</td>
                      <td className="px-3 py-3">{row.fullName}</td>
                      <td className="px-3 py-3">{row.email}</td>
                      <td className="px-3 py-3">{row.crrNumber}</td>
                      <td className="px-3 py-3">
                        {professionLabel(row.profession as Profession)}
                        {row.professionDetail ? <span className="block text-muted">{row.professionDetail}</span> : null}
                      </td>
                      <td className="px-3 py-3">
                        <p>{row.paymentReference || "—"}</p>
                        {row.paymentProof ? (
                          <a
                            className="font-semibold text-green"
                            href={`/api/admin/payment-proof/${row.reference}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Screenshot
                          </a>
                        ) : (
                          <p className="text-muted">No screenshot</p>
                        )}
                      </td>
                      <td className="px-3 py-3">{sourceLabel(row.source as ArrivalSource)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
        <section>
          <h2 className="font-serif text-2xl text-navy">Queries ({queries.length})</h2>
          {queries.length === 0 ? (
            <p className="mt-3 text-muted">No queries yet.</p>
          ) : (
            <ul className="mt-3 grid gap-3">
              {queries.map((query) => (
                <li key={query.id} className="rounded-3xl bg-card p-4 ring-1 ring-line">
                  <p className="font-semibold text-navy">{query.topic}</p>
                  <p className="text-sm text-muted">
                    {query.fullName} · {query.email}
                  </p>
                  <p className="mt-2 leading-7">{query.message}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
