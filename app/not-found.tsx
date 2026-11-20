import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 pb-28">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-green">Missing page</p>
      <h1 className="mt-2 font-serif text-5xl text-navy">That page is not part of this programme.</h1>
      <Link href="/" className="mt-6 inline-flex min-h-11 items-center font-semibold text-green">
        Back to the programme
      </Link>
    </div>
  );
}
