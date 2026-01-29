"use client";

import { useEffect } from "react";

const isProtectedTarget = (target: EventTarget | null) => {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest(
      "img, svg, picture, [data-media-protected], [data-icon]"
    )
  );
};

export default function MediaProtection() {
  useEffect(() => {
    const blockIfProtected = (event: Event) => {
      if (!isProtectedTarget(event.target)) return;
      event.preventDefault();
      event.stopPropagation();
    };

    document.addEventListener("contextmenu", blockIfProtected, true);
    document.addEventListener("dragstart", blockIfProtected, true);
    document.addEventListener("copy", blockIfProtected, true);

    return () => {
      document.removeEventListener("contextmenu", blockIfProtected, true);
      document.removeEventListener("dragstart", blockIfProtected, true);
      document.removeEventListener("copy", blockIfProtected, true);
    };
  }, []);

  return null;
}
