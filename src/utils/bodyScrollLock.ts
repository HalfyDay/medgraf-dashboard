let scrollLockCount = 0;
let previousOverflow: string | null = null;
let previousPaddingRight: string | null = null;

const isBrowser = typeof window !== "undefined";

export const lockBodyScroll = () => {
  if (!isBrowser) return;

  scrollLockCount += 1;
  if (scrollLockCount > 1) return;

  const { body, documentElement } = document;
  previousOverflow = body.style.overflow;
  previousPaddingRight = body.style.paddingRight;

  const scrollbarWidth = window.innerWidth - documentElement.clientWidth;
  const computedPadding =
    parseFloat(window.getComputedStyle(body).paddingRight || "0") || 0;

  if (scrollbarWidth > 0) {
    body.style.paddingRight = `${computedPadding + scrollbarWidth}px`;
  }

  body.style.overflow = "hidden";
};

export const unlockBodyScroll = () => {
  if (!isBrowser) return;
  if (scrollLockCount === 0) return;

  scrollLockCount -= 1;
  if (scrollLockCount > 0) return;

  const { body } = document;
  body.style.overflow = previousOverflow ?? "";
  body.style.paddingRight = previousPaddingRight ?? "";
  previousOverflow = null;
  previousPaddingRight = null;
};
