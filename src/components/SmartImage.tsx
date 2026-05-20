import Image from "next/image";

type SmartImageProps = {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  fill?: boolean;
  priority?: boolean;
};

function isDirectBrowserImage(src: string) {
  return /^(https?:)?\/\//i.test(src) || src.startsWith("data:");
}

export function SmartImage({
  src,
  alt,
  className,
  sizes,
  fill,
  priority
}: SmartImageProps) {
  if (isDirectBrowserImage(src)) {
    // Remote NFT/media URLs are intentionally fetched directly by the browser to avoid
    // routing arbitrary origins through Vercel image optimization.
    // eslint-disable-next-line @next/next/no-img-element
    return <img
      src={src}
      alt={alt}
      className={className}
      sizes={sizes}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      referrerPolicy="no-referrer"
    />;
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      className={className}
      sizes={sizes}
      priority={priority}
    />
  );
}
