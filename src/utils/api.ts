// src/utils/api.ts
export interface Appointment {
  id: string;
  date: string;       // ISO 8601, например "2025-07-20T14:30:00Z"
  doctor: string;     // имя врача
  status: "planned" | "cancelled" | "completed";
}

export async function fetchAppointments(): Promise<Appointment[]> {
  // Эмуляция задержки
  await new Promise(res => setTimeout(res, 500));

  return [
    {
      id: "1",
      date: "2025-07-20T14:30:00Z",
      doctor: "Иванова О.В.",
      status: "planned",
    },
    {
      id: "2",
      date: "2025-06-15T10:00:00Z",
      doctor: "Петров С.А.",
      status: "completed",
    },
    {
      id: "3",
      date: "2025-05-30T12:00:00Z",
      doctor: "Сидорова Е.К.",
      status: "cancelled",
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
}

// Мок‑данные документов
export async function fetchDocuments(): Promise<DocumentItem[]> {
  await new Promise(res => setTimeout(res, 400));
  return [
    {
      id: "d1",
      date: "2025-07-01",
      type: "Общий анализ крови",
      url: "/documents/d1.pdf",
    },
    {
      id: "d2",
      date: "2025-06-20",
      type: "Биохимический анализ крови",
      url: "/documents/d2.pdf",
    },
    {
      id: "d3",
      date: "2025-05-15",
      type: "УЗИ брюшной полости",
      url: "/documents/d3.pdf",
    },
    // …другие записи
  ];
}
