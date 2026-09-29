import * as React from "react";
import NextImage, { type ImageProps as NextImageProps } from "next/image";

export interface FrameworkImageProps extends Omit<NextImageProps, "fill" | "width" | "height"> {
  /** e.g. "16/9", "1/1". Sizes the wrapper with aspect-ratio and lets the image fill it. */
  aspectRatio?: string;
  width?: NextImageProps["width"];
  height?: NextImageProps["height"];
}

/**
 * Thin next/image wrapper. With `aspectRatio`, renders `fill` inside a
 * ratio-boxed wrapper — set `object-fit` yourself via className / style.
 * Server-component safe (same as next/image).
 */
export const FrameworkImage = React.forwardRef<HTMLImageElement, FrameworkImageProps>(function FrameworkImage(
  { aspectRatio, style, width, height, ...props },
  ref
) {
  if (!aspectRatio) return <NextImage ref={ref} width={width} height={height} style={style} {...props} />;
  return (
    <span data-image-wrapper="" style={{ position: "relative", display: "block", aspectRatio }}>
      <NextImage ref={ref} fill style={{ objectFit: "cover", ...style }} {...props} />
    </span>
  );
});
