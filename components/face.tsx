import { Portrait } from "@/components/portrait";

/** Round portrait with a gold ring, as on the poster. */
export function Face({
  name,
  initials,
  photo,
  accent = 1,
  className = "h-28 w-28",
}: {
  name: string;
  initials: string;
  photo: string | null;
  accent?: number;
  className?: string;
}) {
  return (
    <span className={`face accent-${((accent - 1) % 4) + 1} ${className}`}>
      <span className="face-ring">
        <Portrait name={name} initials={initials} photo={photo} className="rounded-full" />
      </span>
    </span>
  );
}
