// app/api/onec.ts
// Заготовка клиента для 1C API с подменными (mock) данными.
// Позволяет уже сейчас брать данные на странице из единого места,
// а позже — переключиться на реальный backend без правок страницы.

// Переключатель: true — всегда использовать mock-данные; false — пробовать ходить в API и падать на mock при ошибке
const USE_MOCK_ALWAYS = true;

// Базовая конфигурация API (заполните при появлении доступа к 1С)
const BASE_URL = process.env.NEXT_PUBLIC_ONEC_URL || ""; // например: https://sandbox.1c.your-domain.ru
const API_TOKEN = process.env.NEXT_PUBLIC_ONEC_TOKEN || ""; // Bearer

// Общий фетчер. Если USE_MOCK_ALWAYS=true — сразу кидает исключение, чтобы сработал мок.
async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  if (USE_MOCK_ALWAYS || !BASE_URL) {
    throw new Error("MOCK_FALLBACK");
  }

  const res = await fetch(`${BASE_URL}${path}`,
    {
      ...init,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Authorization: API_TOKEN ? `Bearer ${API_TOKEN}` : "",
        ...(init?.headers || {}),
      },
      // Не кэшируем, чтобы видеть свежие изменения из 1С
      cache: "no-store",
    }
  );

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
  whatsappUrl?: string;
  telegramUrl?: string;
};

export type Promotion = {
  title: string;
  subtitle?: string;
  cardImage: string; // превью на главной
  banner?: string;   // картинка внутри шита
  bullets?: string[];
  ctaHref?: string;
  ctaText?: string;
};

export type Checkup = {
  id: string;
  title: string;
  sub?: string;        // подзаголовок под названием
  bg: string;          // tailwind bg градиент, например "from-pink-400 to-fuchsia-500"
  icon: "mrt" | "stetho" | "eye" | "balloon" | "heart" | "leaf" | "ear" | "bone";
  bullets: string[];
  price?: number;
  ctaText?: string;
  ctaHref?: string;
};

export type UserPreview = {
  fullName: string;
  // Блок "Моя запись" — опционально (сейчас на странице заглушка)
  appointment?: {
    dateLabel: string;  // например: "Вт, 11 окт 2025"
    timeLabel: string;  // например: "08:00 – 12:00"
    doctor?: { name: string; specialty?: string; photoUrl?: string };
  } | null;
};

// ————————————————————————————————————————————————————————————————————————
// MOCK-ДАННЫЕ (синхронизированы с актуальной разметкой в page.tsx)
// ————————————————————————————————————————————————————————————————————————

const MOCK_CONTACTS: ContactInfo = {
  phone: "+7 (3953) 21-64-22",
  siteLabel: "медграфт.рф",
  siteUrl: "https://медграфт.рф",
  whatsappUrl: "https://wa.me/79990000000",
  telegramUrl: "https://t.me/medgraft",
};

const MOCK_PROMOTIONS: Promotion[] = [
  {
    title: "Скидка 15% на второй глаз",
    subtitle: "При операции катаракты на второй глаз в этом месяце действует спецпредложение",
    cardImage: "/promo-1.png",
    banner: "/banner_promo_1.svg",
    bullets: [
      "Скидку 15% на хирургию",
      "Скидку 15% на интраокулярную линзу (ИОЛ)",
      "Экономия около 10 000 ₽ при операции обоих глаз в течение месяца",
      // продублировано как в текущем макете, чтобы проверить скролл внутри шита
      "Скидку 15% на хирургию",
      "Скидку 15% на интраокулярную линзу (ИОЛ)",
      "Экономия около 10 000 ₽ при операции обоих глаз в течение месяца",
    ],
    ctaHref: "/booking",
    ctaText: "Записаться",
  },
  {
    title: "Пакет диагностики зрения",
    subtitle: "Комплексное обследование за 1 визит",
    cardImage: "/promo-2.png",
    banner: "/banner_promo_2.svg",
    bullets: ["Консультация офтальмолога", "Оптика и УЗИ-биометрия"],
    ctaHref: "/booking",
  },
  {
    title: "Скидка на лазерные процедуры",
    cardImage: "/promo-3.png",
    banner: "/banner_promo_3.svg",
    bullets: ["-10% на ЛК", "Бесплатная консультация перед процедурой"],
    ctaHref: "/booking",
  },
];

const MOCK_CHECKUPS: Checkup[] = [
  {
    id: "mri-full",
    title: "МРТ всего тела",
    sub: "12 Total Doctor",
    bg: "from-pink-400 to-fuchsia-500",
    icon: "mrt",
    bullets: [
      "Головной мозг",
      "Сосуды головы, вены и артерии",
      "Три отдела позвоночника",
      "Органы брюшной полости",
      "Забрюшинное пространство",
      "Органы малого таза",
    ],
    price: 32900,
    ctaText: "Оставить заявку",
    ctaHref: "/booking",
  },
  {
    id: "thyroid",
    title: "Щитовидка",
    sub: "12 Total Doctor",
    bg: "from-violet-400 to-purple-500",
    icon: "stetho",
    bullets: [
      "УЗИ щитовидной железы",
      "Гормоны: ТТГ, свободный Т4",
      "Антитела к ТПО (по показаниям)",
      "УЗИ шейных лимфоузлов",
      "Консультация эндокринолога",
    ],
    price: 6900,
    ctaText: "Оставить заявку",
    ctaHref: "/booking",
  },
  {
    id: "ophtha",
    title: "Офтальмология",
    sub: "12 Total Doctor",
    bg: "from-lime-400 to-emerald-500",
    icon: "eye",
    bullets: [
      "Визометрия (проверка остроты зрения)",
      "Авторефрактометрия",
      "Тонометрия (внутриглазное давление)",
      "Биомикроскопия (щелевая лампа)",
      "Осмотр глазного дна",
      "Подбор оптической коррекции",
    ],
    price: 4500,
    ctaText: "Оставить заявку",
    ctaHref: "/booking",
  },
  {
    id: "women",
    title: "Женское здоровье",
    sub: "12 Total Doctor",
    bg: "from-cyan-500 to-sky-600",
    icon: "balloon",
    bullets: [
      "УЗИ органов малого таза",
      "ПАП-тест (онкоцитология)",
      "Общий анализ крови",
      "Гинекологический осмотр",
      "ПЦР/ИППП (по показаниям)",
    ],
    price: 11900,
    ctaText: "Оставить заявку",
    ctaHref: "/booking",
  },
  {
    id: "cardio",
    title: "Сердечно-сосудистый",
    sub: "12 Total Doctor",
    bg: "from-amber-400 to-orange-500",
    icon: "heart",
    bullets: [
      "ЭКГ с расшифровкой",
      "ЭХО-КГ (УЗИ сердца)",
      "Суточный мониторинг АД (по показаниям)",
      "Липидный профиль",
      "Глюкоза крови",
      "Консультация кардиолога",
    ],
    price: 9900,
    ctaText: "Оставить заявку",
    ctaHref: "/booking",
  },
  {
    id: "onco",
    title: "Онкоскрининг",
    sub: "12 Total Doctor",
    bg: "from-slate-500 to-slate-700",
    icon: "mrt",
    bullets: [
      "Общий анализ крови",
      "Онкомаркеры (базовый профиль)",
      "Низкодозная КТ лёгких (по показаниям)",
      "УЗИ брюшной полости",
      "УЗИ щитовидной железы",
      "МРТ молочных желёз/простаты (по показаниям)",
      "Консультация врача",
    ],
    price: 24900,
    ctaText: "Оставить заявку",
    ctaHref: "/booking",
  },
  {
    id: "uro",
    title: "Почки и мочеполовая",
    sub: "12 Total Doctor",
    bg: "from-teal-400 to-teal-600",
    icon: "leaf",
    bullets: [
      "УЗИ почек и мочевого пузыря",
      "Общий анализ мочи",
      "Креатинин, мочевина, eGFR",
      "Анализы на инфекции (по показаниям)",
      "Консультация уролога/нефролога",
    ],
    price: 8400,
    ctaText: "Оставить заявку",
    ctaHref: "/booking",
  },
  {
    id: "liver",
    title: "Печень",
    sub: "12 Total Doctor",
    bg: "from-lime-500 to-green-600",
    icon: "leaf",
    bullets: [
      "УЗИ печени и желчных путей",
      "АЛТ, АСТ, билирубин, ГГТ, ЩФ",
      "Эластометрия печени (по показаниям)",
      "Вирусные гепатиты (по показаниям)",
      "Консультация гастроэнтеролога",
    ],
    price: 7900,
    ctaText: "Оставить заявку",
    ctaHref: "/booking",
  },
  {
    id: "ent",
    title: "ЛОР-скрининг",
    sub: "12 Total Doctor",
    bg: "from-sky-400 to-blue-500",
    icon: "ear",
    bullets: [
      "Отоскопия",
      "Риноскопия",
      "Фаринго-/ларингоскопия",
      "Аудиометрия",
      "Тимпанометрия",
      "Консультация ЛОР-врача",
    ],
    price: 5200,
    ctaText: "Оставить заявку",
    ctaHref: "/booking",
  },
  {
    id: "msk",
    title: "Опорно-двигательный",
    sub: "12 Total Doctor",
    bg: "from-rose-400 to-pink-500",
    icon: "bone",
    bullets: [
      "Рентген/МРТ проблемной зоны (по показаниям)",
      "УЗИ суставов",
      "Оценка осанки и объёма движений",
      "Консультация травматолога-ортопеда",
      "Рекомендации по реабилитации",
    ],
    price: 13900,
    ctaText: "Оставить заявку",
    ctaHref: "/booking",
  },
];

const MOCK_USER: UserPreview = {
  fullName: "Иванов Иван",
  appointment: {
    dateLabel: "Вт, 11 окт 2025",
    timeLabel: "08:00 – 12:00",
    doctor: { name: "Былим И. А.", specialty: "Офтальмолог", photoUrl: "/doc1.png" },
  },
};

// Небольшая искусственная задержка для имитации сети
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ————————————————————————————————————————————————————————————————————————
// Публичный клиент
// ————————————————————————————————————————————————————————————————————————

export const onec = {
  // Пациент (краткая сводка для главной)
  user: {
    async get(): Promise<UserPreview> {
      try {
        const data = await fetchJson<UserPreview>("/v1/patients/me/preview");
        return data;
      } catch (_) {
        console.warn("onec.user.get fallback", _);
        await sleep(150); // чтобы увидеть спиннеры
        return structuredClone(MOCK_USER);
      }
    },
  },

  // Акции — список
  promotions: {
    async list(): Promise<Promotion[]> {
      try {
        const data = await fetchJson<Promotion[]>("/v1/promotions?active=true");
        return data;
      } catch (_) {
        console.warn("onec.promotions.list fallback", _);
        await sleep(150);
        return structuredClone(MOCK_PROMOTIONS);
      }
    },
  },

  // Чекапы — список
  checkups: {
    async list(): Promise<Checkup[]> {
      try {
        // В идеале — получать из 1С: /v1/checkups
        const data = await fetchJson<Checkup[]>("/v1/checkups");
        return data;
      } catch (_) {
        console.warn("onec.checkups.list fallback", _);
        await sleep(150);
        return structuredClone(MOCK_CHECKUPS);
      }
    },
  },

  // Контакты клиники
  contacts: {
    async get(): Promise<ContactInfo> {
      try {
        const data = await fetchJson<ContactInfo>("/v1/contacts");
        return data;
      } catch (_) {
        console.warn("onec.contacts.get fallback", _);
        await sleep(80);
        return structuredClone(MOCK_CONTACTS);
      }
    },
  },
};

export default onec;
