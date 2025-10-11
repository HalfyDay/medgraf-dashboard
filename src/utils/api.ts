// src/utils/api.ts
export interface Appointment {
  id: string;
  date: string;       // ISO 8601, например "2025-07-20T14:30:00+03:00"
  serviceName: string;
  doctorName: string;
  specialty: string;
  clinic: {
    name: string;
    city?: string;
    address?: string;
    room?: string;
  };
  status: "planned" | "cancelled" | "completed";
  doctorAvatar?: string;
  patients?: string[];
  recommendations?: string;
  conclusion?: string;
}

export async function fetchAppointments(): Promise<Appointment[]> {
  // Эмуляция задержки
  await new Promise((res) => setTimeout(res, 400));

  return [
    {
      id: "a-001",
      date: "2025-08-31T13:00:00+03:00",
      serviceName: "Контрольный осмотр",
      doctorName: "Былим И. А.",
      specialty: "Офтальмолог",
      clinic: {
        name: "Медграфт",
        city: "Иркутск",
        address: "ул. Декабрьских Событий, 90",
        room: "Кабинет 204",
      },
      status: "planned",
      doctorAvatar: "/doc1.png",
      patients: ["Иванов Иван Иванович"],
      recommendations: "Принести предыдущие выписки и результаты обследований.",
      conclusion: "Проверка динамики после операции.",
    },
    {
      id: "a-002",
      date: "2025-09-21T16:30:00+03:00",
      serviceName: "Первичный приём",
      doctorName: "Хохлова М. А.",
      specialty: "Гинеколог",
      clinic: {
        name: "Медграфт",
        city: "Иркутск",
        address: "ул. Декабрьских Событий, 90",
        room: "Кабинет 307",
      },
      status: "planned",
      doctorAvatar: "/doc2.png",
      patients: ["Иванов Иван Иванович"],
      recommendations: "Заполнить анкету здоровья заранее в личном кабинете.",
      conclusion: "Обследование и составление плана лечения.",
    },
    {
      id: "a-003",
      date: "2025-06-10T10:00:00+03:00",
      serviceName: "УЗИ органов малого таза",
      doctorName: "Сидорова Е. К.",
      specialty: "УЗИ-специалист",
      clinic: {
        name: "Медграфт",
        city: "Иркутск",
        address: "ул. Декабрьских Событий, 90",
        room: "Кабинет 112",
      },
      status: "completed",
      doctorAvatar: "/doc3.png",
      patients: ["Иванов Иван Иванович"],
      recommendations: "Повторное обследование при появлении жалоб.",
      conclusion: "Патологий не выявлено.",
    },
    {
      id: "a-004",
      date: "2025-05-24T09:30:00+03:00",
      serviceName: "Консультация офтальмолога",
      doctorName: "Былим И. А.",
      specialty: "Офтальмолог",
      clinic: {
        name: "Медграфт",
        city: "Иркутск",
        address: "ул. Декабрьских Событий, 90",
        room: "Кабинет 204",
      },
      status: "cancelled",
      doctorAvatar: "/doc1.png",
      patients: ["Иванов Иван Иванович"],
      recommendations: "Перенести визит при заболевании ОРВИ.",
      conclusion: "Отменено пациентом.",
    },
  ];
}

export interface Profile {
  fullName: string;
  birthDate: string;        // "YYYY-MM-DD"
  email: string;
  phone: string;
  notifySms: boolean;
  notifyEmail: boolean;
}

// Получить профиль
export async function fetchProfile(): Promise<Profile> {
  await new Promise(res => setTimeout(res, 300));
  return {
    fullName: "Иванов Иван Иванович",
    birthDate: "1985-04-12",
    email: "ivanov@example.com",
    phone: "+7 900 123‑45‑67",
    medCard: "1234567890",
    notifySms: true,
    notifyEmail: false,
  };
}

// Обновить профиль
export async function updateProfile(data: Profile): Promise<Profile> {
  await new Promise(res => setTimeout(res, 300));
  // — здесь в реале отправка в API
  return data;
}

// Сменить пароль
export async function changePassword(_oldPwd: string, _newPwd: string): Promise<void> {
  void _oldPwd;
  void _newPwd;
  await new Promise(res => setTimeout(res, 300));
  // на проде проверка старого и сохранение нового
}

// src/utils/api.ts

export interface DocumentItem {
  id: string;
  date: string;       // ISO‑дата, например "2025-07-01"
  type: string;       // например "Общий анализ крови"
  url: string;        // ссылка на PDF
  description?: string;
}

// Мок‑данные документов
export async function fetchDocuments(): Promise<DocumentItem[]> {
  await new Promise(res => setTimeout(res, 400));
  return [
    {
      id: "doc-1",
      date: "2025-10-31",
      type: "УЗИ",
      description: "УЗИ почек",
      url: "/documents/doc-1.pdf",
    },
    {
      id: "doc-2",
      date: "2024-01-22",
      type: "МРТ",
      description: "МРТ поясничного отдела",
      url: "/documents/doc-2.pdf",
    },
    {
      id: "doc-3",
      date: "2023-01-06",
      type: "Анализы",
      description: "Общий анализ крови",
      url: "/documents/doc-3.pdf",
    },
    // …другие записи
  ];
}

export interface Doctor {
  id: string;
  fullName: string;
  specialty: string;
  category: string;
  rating: number;
  reviews: number;
  price: number;
  pricePeriod: string;
  durationMinutes: number;
  isAvailable: boolean;
  photoUrl: string;
}

export interface DoctorScheduleSlot {
  id: string;
  start: string; // ISO 8601 datetime
}

export interface DoctorScheduleDay {
  date: string; // YYYY-MM-DD
  slots: DoctorScheduleSlot[];
}

export interface BookAppointmentPayload {
  doctorId: string;
  slotId: string;
}

const MOCK_DOCTORS: Doctor[] = [
  {
    id: "doc-neuro-1",
    fullName: "Зырьянова Ольга Сергеевна",
    specialty: "Невролог",
    category: "Невролог",
    rating: 4.8,
    reviews: 125,
    price: 2400,
    pricePeriod: "30 минут",
    durationMinutes: 30,
    isAvailable: true,
    photoUrl: "/doc1.png",
  },
  {
    id: "doc-neuro-2",
    fullName: "Кузьмина Ирина Павловна",
    specialty: "Невролог",
    category: "Невролог",
    rating: 4.7,
    reviews: 88,
    price: 2600,
    pricePeriod: "45 минут",
    durationMinutes: 45,
    isAvailable: true,
    photoUrl: "/doc3.png",
  },
  {
    id: "doc-neuro-3",
    fullName: "Сорокин Дмитрий Олегович",
    specialty: "Невролог",
    category: "Невролог",
    rating: 4.6,
    reviews: 74,
    price: 2100,
    pricePeriod: "30 минут",
    durationMinutes: 30,
    isAvailable: false,
    photoUrl: "/doc2.png",
  },
  {
    id: "doc-thera-1",
    fullName: "Леонова Мария Павловна",
    specialty: "Терапевт",
    category: "Терапевт",
    rating: 4.7,
    reviews: 98,
    price: 2200,
    pricePeriod: "30 минут",
    durationMinutes: 30,
    isAvailable: true,
    photoUrl: "/doc2.png",
  },
  {
    id: "doc-thera-2",
    fullName: "Никитина Софья Викторовна",
    specialty: "Терапевт",
    category: "Терапевт",
    rating: 4.5,
    reviews: 65,
    price: 2100,
    pricePeriod: "30 минут",
    durationMinutes: 30,
    isAvailable: true,
    photoUrl: "/doc1.png",
  },
  {
    id: "doc-thera-3",
    fullName: "Гаврилов Алексей Сергеевич",
    specialty: "Терапевт",
    category: "Терапевт",
    rating: 4.8,
    reviews: 142,
    price: 2400,
    pricePeriod: "45 минут",
    durationMinutes: 45,
    isAvailable: false,
    photoUrl: "/doc3.png",
  },
  {
    id: "doc-ophtha-1",
    fullName: "Петров Андрей Сергеевич",
    specialty: "Офтальмолог",
    category: "Офтальмолог",
    rating: 4.9,
    reviews: 156,
    price: 2400,
    pricePeriod: "час",
    durationMinutes: 60,
    isAvailable: true,
    photoUrl: "/doc2.png",
  },
  {
    id: "doc-ophtha-2",
    fullName: "Савельева Ксения Юрьевна",
    specialty: "Офтальмолог",
    category: "Офтальмолог",
    rating: 4.7,
    reviews: 93,
    price: 2500,
    pricePeriod: "45 минут",
    durationMinutes: 45,
    isAvailable: true,
    photoUrl: "/doc1.png",
  },
  {
    id: "doc-ophtha-3",
    fullName: "Горюнов Максим Вадимович",
    specialty: "Офтальмолог",
    category: "Офтальмолог",
    rating: 4.5,
    reviews: 61,
    price: 2300,
    pricePeriod: "30 минут",
    durationMinutes: 30,
    isAvailable: false,
    photoUrl: "/doc3.png",
  },
  {
    id: "doc-gyno-1",
    fullName: "Калинина Светлана Игоревна",
    specialty: "Гинеколог",
    category: "Гинеколог",
    rating: 4.6,
    reviews: 87,
    price: 2600,
    pricePeriod: "30 минут",
    durationMinutes: 30,
    isAvailable: false,
    photoUrl: "/doc3.png",
  },
  {
    id: "doc-gyno-2",
    fullName: "Щербакова Анастасия Сергеевна",
    specialty: "Гинеколог",
    category: "Гинеколог",
    rating: 4.8,
    reviews: 112,
    price: 2800,
    pricePeriod: "45 минут",
    durationMinutes: 45,
    isAvailable: true,
    photoUrl: "/doc1.png",
  },
  {
    id: "doc-gyno-3",
    fullName: "Громов Артём Николаевич",
    specialty: "Гинеколог",
    category: "Гинеколог",
    rating: 4.4,
    reviews: 53,
    price: 2400,
    pricePeriod: "30 минут",
    durationMinutes: 30,
    isAvailable: true,
    photoUrl: "/doc2.png",
  },
];

const MOCK_DOCTOR_SCHEDULE: Record<string, DoctorScheduleDay[]> = {
  "doc-neuro-1": [
    {
      date: "2025-10-15",
      slots: [
        { id: "doc-neuro-1-2025-10-15-1030", start: "2025-10-15T10:30:00+03:00" },
        { id: "doc-neuro-1-2025-10-15-1230", start: "2025-10-15T12:30:00+03:00" },
        { id: "doc-neuro-1-2025-10-15-1430", start: "2025-10-15T14:30:00+03:00" },
        { id: "doc-neuro-1-2025-10-15-1730", start: "2025-10-15T17:30:00+03:00" },
      ],
    },
    {
      date: "2025-10-16",
      slots: [
        { id: "doc-neuro-1-2025-10-16-1030", start: "2025-10-16T10:30:00+03:00" },
        { id: "doc-neuro-1-2025-10-16-1130", start: "2025-10-16T11:30:00+03:00" },
        { id: "doc-neuro-1-2025-10-16-1630", start: "2025-10-16T16:30:00+03:00" },
        { id: "doc-neuro-1-2025-10-16-1830", start: "2025-10-16T18:30:00+03:00" },
      ],
    },
    {
      date: "2025-10-18",
      slots: [
        { id: "doc-neuro-1-2025-10-18-0930", start: "2025-10-18T09:30:00+03:00" },
        { id: "doc-neuro-1-2025-10-18-1130", start: "2025-10-18T11:30:00+03:00" },
      ],
    },
  ],
  "doc-neuro-2": [
    {
      date: "2025-10-20",
      slots: [
        { id: "doc-neuro-2-2025-10-20-1000", start: "2025-10-20T10:00:00+03:00" },
        { id: "doc-neuro-2-2025-10-20-1200", start: "2025-10-20T12:00:00+03:00" },
        { id: "doc-neuro-2-2025-10-20-1500", start: "2025-10-20T15:00:00+03:00" },
      ],
    },
    {
      date: "2025-11-02",
      slots: [
        { id: "doc-neuro-2-2025-11-02-1030", start: "2025-11-02T10:30:00+03:00" },
        { id: "doc-neuro-2-2025-11-02-1300", start: "2025-11-02T13:00:00+03:00" },
      ],
    },
  ],
  "doc-neuro-3": [
    {
      date: "2025-10-22",
      slots: [
        { id: "doc-neuro-3-2025-10-22-0900", start: "2025-10-22T09:00:00+03:00" },
        { id: "doc-neuro-3-2025-10-22-1100", start: "2025-10-22T11:00:00+03:00" },
      ],
    },
    {
      date: "2025-11-10",
      slots: [
        { id: "doc-neuro-3-2025-11-10-1400", start: "2025-11-10T14:00:00+03:00" },
        { id: "doc-neuro-3-2025-11-10-1600", start: "2025-11-10T16:00:00+03:00" },
      ],
    },
  ],
  "doc-thera-1": [
    {
      date: "2025-10-12",
      slots: [
        { id: "doc-thera-1-2025-10-12-0930", start: "2025-10-12T09:30:00+03:00" },
        { id: "doc-thera-1-2025-10-12-1130", start: "2025-10-12T11:30:00+03:00" },
      ],
    },
    {
      date: "2025-10-19",
      slots: [
        { id: "doc-thera-1-2025-10-19-1030", start: "2025-10-19T10:30:00+03:00" },
        { id: "doc-thera-1-2025-10-19-1330", start: "2025-10-19T13:30:00+03:00" },
        { id: "doc-thera-1-2025-10-19-1530", start: "2025-10-19T15:30:00+03:00" },
      ],
    },
  ],
  "doc-thera-2": [
    {
      date: "2025-10-18",
      slots: [
        { id: "doc-thera-2-2025-10-18-1000", start: "2025-10-18T10:00:00+03:00" },
        { id: "doc-thera-2-2025-10-18-1200", start: "2025-10-18T12:00:00+03:00" },
      ],
    },
    {
      date: "2025-10-25",
      slots: [
        { id: "doc-thera-2-2025-10-25-0900", start: "2025-10-25T09:00:00+03:00" },
        { id: "doc-thera-2-2025-10-25-1100", start: "2025-10-25T11:00:00+03:00" },
        { id: "doc-thera-2-2025-10-25-1400", start: "2025-10-25T14:00:00+03:00" },
      ],
    },
  ],
  "doc-thera-3": [
    {
      date: "2025-11-01",
      slots: [
        { id: "doc-thera-3-2025-11-01-0930", start: "2025-11-01T09:30:00+03:00" },
        { id: "doc-thera-3-2025-11-01-1230", start: "2025-11-01T12:30:00+03:00" },
      ],
    },
    {
      date: "2025-11-08",
      slots: [
        { id: "doc-thera-3-2025-11-08-1000", start: "2025-11-08T10:00:00+03:00" },
        { id: "doc-thera-3-2025-11-08-1200", start: "2025-11-08T12:00:00+03:00" },
        { id: "doc-thera-3-2025-11-08-1500", start: "2025-11-08T15:00:00+03:00" },
      ],
    },
  ],
  "doc-ophtha-1": [
    {
      date: "2025-10-15",
      slots: [
        { id: "doc-ophtha-1-2025-10-15-1030", start: "2025-10-15T10:30:00+03:00" },
        { id: "doc-ophtha-1-2025-10-15-1430", start: "2025-10-15T14:30:00+03:00" },
        { id: "doc-ophtha-1-2025-10-15-1730", start: "2025-10-15T17:30:00+03:00" },
      ],
    },
    {
      date: "2025-10-25",
      slots: [
        { id: "doc-ophtha-1-2025-10-25-1030", start: "2025-10-25T10:30:00+03:00" },
        { id: "doc-ophtha-1-2025-10-25-1130", start: "2025-10-25T11:30:00+03:00" },
        { id: "doc-ophtha-1-2025-10-25-1230", start: "2025-10-25T12:30:00+03:00" },
      ],
    },
  ],
  "doc-ophtha-2": [
    {
      date: "2025-10-18",
      slots: [
        { id: "doc-ophtha-2-2025-10-18-0900", start: "2025-10-18T09:00:00+03:00" },
        { id: "doc-ophtha-2-2025-10-18-1100", start: "2025-10-18T11:00:00+03:00" },
        { id: "doc-ophtha-2-2025-10-18-1500", start: "2025-10-18T15:00:00+03:00" },
      ],
    },
    {
      date: "2025-11-05",
      slots: [
        { id: "doc-ophtha-2-2025-11-05-1030", start: "2025-11-05T10:30:00+03:00" },
        { id: "doc-ophtha-2-2025-11-05-1300", start: "2025-11-05T13:00:00+03:00" },
      ],
    },
  ],
  "doc-ophtha-3": [
    {
      date: "2025-11-12",
      slots: [
        { id: "doc-ophtha-3-2025-11-12-0930", start: "2025-11-12T09:30:00+03:00" },
        { id: "doc-ophtha-3-2025-11-12-1130", start: "2025-11-12T11:30:00+03:00" },
      ],
    },
    {
      date: "2025-11-20",
      slots: [
        { id: "doc-ophtha-3-2025-11-20-1400", start: "2025-11-20T14:00:00+03:00" },
        { id: "doc-ophtha-3-2025-11-20-1630", start: "2025-11-20T16:30:00+03:00" },
      ],
    },
  ],
  "doc-gyno-1": [
    {
      date: "2025-10-20",
      slots: [
        { id: "doc-gyno-1-2025-10-20-1030", start: "2025-10-20T10:30:00+03:00" },
        { id: "doc-gyno-1-2025-10-20-1230", start: "2025-10-20T12:30:00+03:00" },
      ],
    },
    {
      date: "2025-10-27",
      slots: [
        { id: "doc-gyno-1-2025-10-27-1330", start: "2025-10-27T13:30:00+03:00" },
        { id: "doc-gyno-1-2025-10-27-1530", start: "2025-10-27T15:30:00+03:00" },
        { id: "doc-gyno-1-2025-10-27-1730", start: "2025-10-27T17:30:00+03:00" },
      ],
    },
  ],
  "doc-gyno-2": [
    {
      date: "2025-10-22",
      slots: [
        { id: "doc-gyno-2-2025-10-22-1000", start: "2025-10-22T10:00:00+03:00" },
        { id: "doc-gyno-2-2025-10-22-1230", start: "2025-10-22T12:30:00+03:00" },
        { id: "doc-gyno-2-2025-10-22-1500", start: "2025-10-22T15:00:00+03:00" },
      ],
    },
    {
      date: "2025-11-03",
      slots: [
        { id: "doc-gyno-2-2025-11-03-0900", start: "2025-11-03T09:00:00+03:00" },
        { id: "doc-gyno-2-2025-11-03-1200", start: "2025-11-03T12:00:00+03:00" },
      ],
    },
  ],
  "doc-gyno-3": [
    {
      date: "2025-11-15",
      slots: [
        { id: "doc-gyno-3-2025-11-15-1030", start: "2025-11-15T10:30:00+03:00" },
        { id: "doc-gyno-3-2025-11-15-1300", start: "2025-11-15T13:00:00+03:00" },
      ],
    },
    {
      date: "2025-11-22",
      slots: [
        { id: "doc-gyno-3-2025-11-22-1000", start: "2025-11-22T10:00:00+03:00" },
        { id: "doc-gyno-3-2025-11-22-1230", start: "2025-11-22T12:30:00+03:00" },
        { id: "doc-gyno-3-2025-11-22-1500", start: "2025-11-22T15:00:00+03:00" },
      ],
    },
  ],
};

const APPOINTMENT_CLINIC = {
  name: "МедГраф Клиника",
  city: "Иркутск",
  address: "ул. Ленина, 58",
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function fetchDoctors(): Promise<Doctor[]> {
  await delay(350);
  return MOCK_DOCTORS.map((doctor) => ({ ...doctor }));
}

export async function fetchDoctorSchedule(doctorId: string): Promise<DoctorScheduleDay[]> {
  await delay(320);
  const schedule = MOCK_DOCTOR_SCHEDULE[doctorId] ?? [];
  return schedule.map((day) => ({
    date: day.date,
    slots: day.slots.map((slot) => ({ ...slot })),
  }));
}

export async function bookAppointment(payload: BookAppointmentPayload): Promise<Appointment> {
  await delay(500);

  const doctor = MOCK_DOCTORS.find((item) => item.id === payload.doctorId);
  if (!doctor) {
    throw new Error("Doctor not found");
  }

  const schedule = MOCK_DOCTOR_SCHEDULE[payload.doctorId] ?? [];
  const flatSlots = schedule.flatMap((day) => day.slots.map((slot) => ({ day: day.date, slot })));
  const matched = flatSlots.find((entry) => entry.slot.id === payload.slotId);

  if (!matched) {
    throw new Error("Slot not found");
  }

  const appointment: Appointment = {
    id: `new-${Date.now()}`,
    date: matched.slot.start,
    serviceName: `Приём у врача ${doctor.specialty}`,
    doctorName: doctor.fullName,
    specialty: doctor.specialty,
    clinic: { ...APPOINTMENT_CLINIC },
    status: "planned",
    doctorAvatar: doctor.photoUrl,
  };

  return appointment;
}
