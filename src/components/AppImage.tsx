"use client";

import Image, { type ImageProps } from "next/image";
import { memo } from "react";
import { useEffect, useState } from "react";

type AppImageProps = Omit<ImageProps, "src" | "alt"> & {
  src: string;
  alt?: string;
  fallbackSrc?: string;
};

const isDataSrc = (value: string) => value.startsWith("data:");
const isLocalAssetSrc = (value: string) => value.startsWith("/") && !value.startsWith("//");

function AppImage({
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

  const isLocalAsset = isLocalAssetSrc(currentSrc);
  const isLikelyIcon =
    isLocalAsset &&
    !props.fill &&
    typeof props.width === "number" &&
    typeof props.height === "number" &&
    props.width <= 64 &&
    props.height <= 64;

  // For local static assets from /public, use direct file loading.
  // For remote URLs, keep Next optimization and cache pipeline.
  const shouldUnoptimize = unoptimized ?? (isDataSrc(currentSrc) || isLocalAsset);
  const loadingMode = props.loading ?? (isLikelyIcon ? "eager" : undefined);

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
      loading={loadingMode}
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

export default memo(AppImage);
