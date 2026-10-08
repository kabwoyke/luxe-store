"use client";

import Image from "next/image";
import { cloudinaryDeliveryUrl } from "@/lib/cloudinary";

const isCloudinary = (src: string) => /^https:\/\/res\.cloudinary\.com\//.test(src);

/** SVGs and pasted external image links are shown as-is instead of going through the image optimiser. */
const skipOptimiser = (src: string) => src.endsWith(".svg") || (/^https?:\/\//i.test(src) && !isCloudinary(src));

/** Cloudinary photos are resized and re-encoded by Cloudinary itself, at the width each screen needs. */
const cloudinaryLoader = ({ src, width }: { src: string; width: number }) => cloudinaryDeliveryUrl(src, width);

export function ProductImage({
  src,
  alt,
  sizes,
  className,
  priority,
}: {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      loader={isCloudinary(src) ? cloudinaryLoader : undefined}
      unoptimized={skipOptimiser(src)}
      fetchPriority={priority ? "high" : undefined}
      draggable={false}
      className={className}
    />
  );
}
