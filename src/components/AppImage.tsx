"use client";

import Image, { type ImageProps } from "next/image";
import { useEffect, useState } from "react";

type AppImageProps = Omit<ImageProps, "src" | "alt"> & {
  src: string;
  alt?: string;
  fallbackSrc?: string;
};

const isDataSrc = (value: string) => value.startsWith("data:");

export default function AppImage({
  src,
  alt = "",
  fallbackSrc,
  unoptimized,
  onError,
  style,
  ...props
}: AppImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src);

  useEffect(() => {
    setCurrentSrc(src);
  }, [src]);

  // Let Next.js optimize and cache remote images by default.
  // Keep unoptimized only for data URIs (or when explicitly requested).
  const shouldUnoptimize = unoptimized ?? isDataSrc(currentSrc);

  const classNameValue = props.className ?? "";
  const hasSizeClass = /\bsize-/.test(classNameValue);
  const hasWidthClass = /\bw-/.test(classNameValue);
  const hasHeightClass = /\bh-/.test(classNameValue);
  const shouldApplyAutoSize =
    !props.fill && !(hasSizeClass || (hasWidthClass && hasHeightClass));

  const imgStyle = props.fill
    ? style
    : shouldApplyAutoSize
      ? { width: "auto", height: "auto", ...style }
      : style;

  return (
    <Image
      {...props}
      src={currentSrc}
      alt={alt}
      unoptimized={shouldUnoptimize}
      style={imgStyle}
      onError={(event) => {
        if (fallbackSrc && currentSrc !== fallbackSrc) {
          setCurrentSrc(fallbackSrc);
        }
        onError?.(event);
      }}
    />
  );
}
