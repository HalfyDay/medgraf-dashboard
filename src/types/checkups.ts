export type CheckupData = {
  id: string;
  title: string;
  sub?: string;
  description?: string;
  bullets?: string[];
  price?: number | string;
  oldPrice?: number | string;
  currency?: string;
  image?: string;
  bg: string;
  ctaHref?: string;
  ctaText?: string;
};
