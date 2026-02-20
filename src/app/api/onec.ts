// app/api/onec.ts

// Переключатель: true — всегда использовать mock-данные; false — пробовать ходить в API и падать на mock при ошибке
const USE_MOCK_ALWAYS = true;

// Базовая конфигурация API (заполнить при появлении доступа к 1С)
const BASE_URL = process.env.NEXT_PUBLIC_ONEC_URL || ""; // например: https://sandbox.1c.your-domain.ru
const API_TOKEN = process.env.NEXT_PUBLIC_ONEC_TOKEN || ""; // Bearer
const USE_MOCK = USE_MOCK_ALWAYS || !BASE_URL;

type OneCAction = {
  id?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  start?: string;
  end?: string;
  mainimage?: string;
  mainImage?: string;
  banner?: string;
  image?: string;
  images?: string[];
};

type OneCActionResponse = {
  error?: string;
  code?: string;
  details?: OneCAction[];
};

// Небольшая искусственная задержка для имитации сети
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const cloneWithDelay = async <T>(value: T, delayMs = 120): Promise<T> => {
  if (delayMs > 0) {
    await sleep(delayMs);
  }
  return structuredClone(value);
};

const isMockFallback = (error: unknown) =>
  error instanceof Error && error.message === "MOCK_FALLBACK";

// Общий фетчер. Если USE_MOCK=true — сразу кидает исключение, чтобы сработал мок.
async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  if (USE_MOCK) {
    throw new Error("MOCK_FALLBACK");
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      Authorization: API_TOKEN ? `Bearer ${API_TOKEN}` : "",
      ...(init?.headers || {}),
    },
    // Не кэшируем, чтобы видеть свежие изменения из 1С
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText}: ${text}`);
  }

  return res.json() as Promise<T>;
}

// ————————————————————————————————————————————————————————————————————————
// Типы, совместимые с текущими компонентами (сверены с page.tsx и компонентами)
// ————————————————————————————————————————————————————————————————————————

export type ContactInfo = {
  phone: string;
  siteLabel: string;
  siteUrl: string;
};

export type Promotion = {
  id?: string;
  title: string;
  subtitle?: string;
  description?: string;
  start?: string;
  end?: string;
  cardImage: string; // preview image for the main card
  banner?: string; // banner image inside the sheet
  bullets?: string[];
  ctaHref?: string;
  ctaText?: string;
};

export type UserPreview = {
  fullName: string;
  // Блок "Моя запись" — опционально (сейчас на странице заглушка)
  appointment?:
    | {
        dateLabel: string; // например: "Вт, 11 окт 2025"
        timeLabel: string; // например: "08:00 – 12:00"
        doctor?: { name: string; specialty?: string; photoUrl?: string };
      }
    | null;
};

// ————————————————————————————————————————————————————————————————————————
// MOCK-ДАННЫЕ (синхронизированы с актуальной разметкой в page.tsx)
// ————————————————————————————————————————————————————————————————————————

let actionsInFlight: Promise<Promotion[]> | null = null;

const MOCK_CONTACTS: ContactInfo = {
  phone: "+7 (3953) 21-64-22",
  siteLabel: "медграфт.рф",
  siteUrl: "https://медграфт.рф",
};




const MOCK_USER: UserPreview = {
  fullName: "Иванов Иван",
  appointment: {
    dateLabel: "Вт, 11 окт 2025",
    timeLabel: "08:00 – 12:00",
    doctor: { name: "Былим И. А.", specialty: "Офтальмолог", photoUrl: "/doc1.png" },
  },
};

// ————————————————————————————————————————————————————————————————————————
// Публичный клиент
// ————————————————————————————————————————————————————————————————————————

function pickField(obj: Record<string, unknown>, candidates: string[]): string | undefined {
  for (const key of candidates) {
    const found = Object.keys(obj).find((k) => k.toLowerCase() === key.toLowerCase());
    const value = found ? obj[found] : undefined;
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return undefined;
}

function normalizePromoLineBreaks(value?: string) {
  if (!value) return undefined;
  return value
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\/n/g, "\n")
    .trim();
}

function mapActionToPromotion(action: OneCAction): Promotion | null {
  const safeAction = action as Record<string, unknown>;
  const title = pickField(safeAction, ["title", "name", "header"]);
  const images =
    Array.isArray((safeAction as { images?: unknown }).images)
      ? ((safeAction as { images: unknown[] }).images
          .map((value) => (typeof value === "string" ? value.trim() : String(value ?? "")))
          .filter((value) => value.length > 0))
      : [];
  let image =
    images[0] ||
    pickField(safeAction, ["mainimg", "mainIMG", "mainimage", "mainImage", "image", "banner", "picture"]);
  let bannerImage =
    images[1] ||
    pickField(safeAction, ["banner", "mainimg", "mainIMG", "mainimage", "mainImage", "image", "picture"]);

  if (image) {
    try {
      image = new URL(image).toString();
    } catch {
      // keep as-is if URL parsing fails
    }
  } else {
    image = "/clinic.svg";
  }

  if (bannerImage) {
    try {
      bannerImage = new URL(bannerImage).toString();
    } catch {
      // keep as-is if URL parsing fails
    }
  }

  if (!title) {
    return null;
  }

  const subtitle = normalizePromoLineBreaks(pickField(safeAction, ["subtitle", "caption"]));
  const description = normalizePromoLineBreaks(pickField(safeAction, ["description", "text", "body"]));
  const start = pickField(safeAction, ["start", "dateStart", "date_from"]);
  const end = pickField(safeAction, ["end", "dateEnd", "date_to"]);
  return {
    id: action.id?.toString(),
    title,
    subtitle,
    description,
    start,
    end,
    cardImage: image,
    banner: bannerImage || image,
  };
}

async function fetchActionsFromOneC(): Promise<Promotion[]> {
  if (actionsInFlight) {
    return actionsInFlight;
  }

  actionsInFlight = (async () => {
  try {
    const endpoint = "/api/actions";
    const response = await fetch(endpoint, { cache: "no-store" });
    let payload: OneCActionResponse | null = null;

    try {
      payload = (await response.json()) as OneCActionResponse;
    } catch (parseError) {
      console.error("[actions] parse error", parseError);
    }

    if (!response.ok) {
      const message = `HTTP ${response.status} ${response.statusText}`;
      console.error("[actions] upstream not ok:", message);
      throw new Error(message);
    }

    const items = Array.isArray(payload?.details) ? payload.details : [];

    let mapped = items
      .map((action) => mapActionToPromotion(action))
      .filter((item): item is Promotion => Boolean(item));

    if (mapped.length === 0 && items.length > 0) {
      // fallback: minimal mapping to avoid empty UI if fields differ
      mapped = items.map((action, index) => ({
        id: (action.id ?? index).toString(),
        title: (action as Record<string, unknown>).title?.toString() || "Акция",
        subtitle: normalizePromoLineBreaks((action as Record<string, unknown>).subtitle?.toString()),
        description: normalizePromoLineBreaks((action as Record<string, unknown>).description?.toString()),
        start: (action as Record<string, unknown>).start?.toString(),
        end: (action as Record<string, unknown>).end?.toString(),
        cardImage:
          pickField(action as Record<string, unknown>, ["mainimage", "mainImage", "image", "banner", "picture"]) ||
          "/clinic.svg",
        banner:
          pickField(action as Record<string, unknown>, ["banner", "mainimage", "mainImage", "image"]) ||
          "/clinic.svg",
      }));
    }

    return mapped;
  } catch (error) {
    console.error("[actions] failed", error);
    return [];
  }
}
)();

  try {
    return await actionsInFlight;
  } finally {
    actionsInFlight = null;
  }
}

export const onec = {
  // Пациент (краткая сводка для главной)
  user: {
    async get(): Promise<UserPreview> {
      if (USE_MOCK) {
        return cloneWithDelay(MOCK_USER, 120);
      }
      try {
        const data = await fetchJson<UserPreview>("/v1/patients/me/preview");
        return data;
      } catch (error) {
        console.warn("onec.user.get fallback", error);
        return cloneWithDelay(MOCK_USER, 150);
      }
    },
  },

  // Акции — список
  promotions: {
    async list(): Promise<Promotion[]> {
      return fetchActionsFromOneC();
    },
  },

  // Контакты клиники
  contacts: {
    async get(): Promise<ContactInfo> {
      if (USE_MOCK) {
        return cloneWithDelay(MOCK_CONTACTS, 80);
      }
      try {
        const data = await fetchJson<ContactInfo>("/v1/contacts");
        return data;
      } catch (error) {
        if (!isMockFallback(error)) {
          console.warn("onec.contacts.get fallback", error);
        }
        return cloneWithDelay(MOCK_CONTACTS, 80);
      }
    },
  },
};

export default onec;
