import type { Metadata } from "next";
import { PageBanner } from "@/components/page-banner";
import { Portrait } from "@/components/portrait";
import { clinicalServices, department, departmentStaff, departmentUrl, outreach } from "@/lib/department";

export const metadata: Metadata = { title: "Department" };

export default function DepartmentPage() {
  return (
    <div className="pb-24 md:pb-0">
      <PageBanner
        kicker="Organising department"
        title="Audiology and Speech Language Pathology"
        lede="Yenepoya Medical College hosts this CRE. The notes below follow the college department page, with the staff list brought up to date."
      />

      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-10 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-3xl bg-card p-6 ring-1 ring-line">
          <h2 className="font-serif text-3xl text-navy">About the department</h2>
          <p className="mt-4 leading-7 text-muted">{department.summary}</p>
          <p className="mt-4 leading-7 text-muted">{department.course}</p>
          <p className="mt-4 leading-7 text-muted">
            The department is empanelled under SAST for cochlear implantation, with a year of auditory verbal therapy under that scheme. It also works with Ullal Community Health Centre, Mangalore University, PRS Neuroscience, Chethana Special School, Vijetha Special School, and Vitla Lions Club.
          </p>
          <a
            className="mt-6 inline-flex min-h-12 items-center rounded-full bg-green px-5 font-semibold text-white"
            href={departmentUrl}
          >
            Open the college department page
          </a>
        </article>
        <aside className="rounded-3xl bg-navy p-6 text-white">
          <h2 className="font-serif text-3xl">Clinic desk</h2>
          <dl className="mt-4 grid gap-4 text-sm leading-6">
            <div>
              <dt className="text-mint">Phone</dt>
              <dd>
                <a href={`tel:${department.phone}`}>{department.phone}</a>
              </dd>
            </div>
            <div>
              <dt className="text-mint">Email</dt>
              <dd>
                <a className="underline" href={`mailto:${department.email}`}>
                  {department.email}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-mint">Hours</dt>
              <dd>{department.hours}</dd>
            </div>
            <div>
              <dt className="text-mint">Outreach day</dt>
              <dd>{department.outreachDay}</dd>
            </div>
          </dl>
        </aside>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-4 pb-4 lg:grid-cols-2">
        <article className="rounded-3xl bg-card p-6 ring-1 ring-line">
          <h2 className="font-serif text-2xl text-navy">Audiology</h2>
          <ul className="mt-3 grid gap-2">
            {clinicalServices.audiology.map((item) => (
              <li key={item} className="leading-7 text-muted">
                {item}
              </li>
            ))}
          </ul>
        </article>
        <article className="rounded-3xl bg-card p-6 ring-1 ring-line">
          <h2 className="font-serif text-2xl text-navy">Speech-language pathology</h2>
          <ul className="mt-3 grid gap-2">
            {clinicalServices.speech.map((item) => (
              <li key={item} className="leading-7 text-muted">
                {item}
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <h2 className="font-serif text-3xl text-navy">Staff</h2>
        <p className="mt-3 max-w-3xl leading-7 text-muted">
          Photographs are the ones published by Yenepoya Medical College. Ms. Merin Mathews and Ms. Shana Mariyam Basheer are shown with initials because that page uses a placeholder instead of a portrait. Ms. Ananya Shettigar has joined the department. Ms. Niha Kuraisha has left, and Ms. Praneetha is not on the staff. The college page has not yet caught up with those three changes, and it does not yet carry Ms. Ananya Shettigar’s photograph or designation.
        </p>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {departmentStaff.map((person) => (
            <li key={person.name} className="overflow-hidden rounded-3xl bg-card ring-1 ring-line">
              <Portrait name={person.name} initials={person.initials} photo={person.photo} className="aspect-square w-full text-3xl" />
              <div className="p-4">
                <h3 className="font-serif text-xl leading-snug text-navy">{person.name}</h3>
                <p className="mt-1 text-sm leading-6 text-muted">{person.role}</p>
                {person.email ? (
                  <a className="mt-2 block text-sm font-semibold text-green" href={`mailto:${person.email}`}>
                    {person.email}
                  </a>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-12">
        <h2 className="font-serif text-3xl text-navy">Community postings</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {outreach.map((post) => (
            <li key={post.centre} className="rounded-3xl bg-card px-5 py-4 ring-1 ring-line">
              <p className="font-serif text-xl text-navy">{post.centre}</p>
              <p className="mt-1 text-sm text-muted">{post.person}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
