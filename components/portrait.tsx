import Image from "next/image";

export function Portrait({
  name,
  initials,
  photo,
  className = "",
}: {
  name: string;
  initials: string;
  photo: string | null;
  className?: string;
}) {
  return (
    <span className={`relative block overflow-hidden ${className}`}>
      {photo ? (
        <Image src={photo} alt="" width={400} height={400} className="absolute inset-0 h-full w-full object-cover object-top" />
      ) : (
        <span
          className="absolute inset-0 grid place-items-center bg-navy font-display text-mint"
          role="img"
          aria-label={`Photograph of ${name} to follow`}
        >
          {initials}
        </span>
      )}
    </span>
  );
}
