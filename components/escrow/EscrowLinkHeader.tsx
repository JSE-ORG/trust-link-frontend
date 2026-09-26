import OptimizedImage from "@/components/ui/OptimizedImage";

interface EscrowLinkHeaderProps {
  title: string;
  status: string;
  imageUrl?: string;
}

export default function EscrowLinkHeader({
  title,
  status,
  imageUrl,
}: EscrowLinkHeaderProps) {
  return (
    <>
      {imageUrl && (
        <div className="mb-4 overflow-hidden rounded-2xl">
          <OptimizedImage
            src={imageUrl}
            alt={`Image of ${title}`}
            width={600}
            height={400}
            className="h-48 w-full object-cover"
            sizes="(max-width: 768px) 100vw, 600px"
          />
        </div>
      )}
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-100">
          {title}
        </h2>
        <span className="rounded-full bg-zinc-100 px-3 py-1 text-sm text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
          {status}
        </span>
      </div>
    </>
  );
}
