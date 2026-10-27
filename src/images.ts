import { getImage } from "astro:assets";

// Every WebP under public/, as build-time image metadata. The files stay where
// they are (their public URLs feed Stripe's product images, Open Graph and the
// lightbox), while astro:assets writes resized WebP variants at build, which
// is what next/image used to do on the fly at runtime.
const files = import.meta.glob<{ default: ImageMetadata }>("/public/**/*.webp", { eager: true });

export function meta(path: string): ImageMetadata {
  const m = files[`/public${path}`]?.default;
  if (!m) throw new Error(`No image at public${path}`);
  return m;
}

/** src + srcset (w descriptors) for a public image. q75 matches next/image. */
export async function img(path: string, widths: number[]) {
  const out = await getImage({ src: meta(path), widths, width: Math.max(...widths), format: "webp", quality: 75 });
  return { src: out.src, srcSet: out.srcSet.attribute };
}
