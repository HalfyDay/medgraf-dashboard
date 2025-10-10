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
