"use client";
/* eslint-disable @next/next/no-img-element */
import React, { useState, useEffect, useRef } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/Button";
import { motion } from "framer-motion";

// Филиалы (Отделения клиники)
const BRANCHES = ["Братск", "Усть-Илимск", "Усть-Кут"];

// Категории услуг
const DEPARTMENTS = [
  "Детская офтальмология",
  "Взрослая офтальмология",
  "УЗИ",
  "Лечение варикоза",
  "Кардиология",
  "Невролог",
  "Эндокринолог",
  "Гинеколог",
  "ЛОР отделение",
  "Цифровой рентген",
  "МРТ",
  "МСКТ",
  "Денситометрия",
  "ЛАБОРАТОРНЫЕ ИССЛЕДОВАНИЯ",
];

// Подуслуги для Детской офтальмологии
const SUBSERVICES: Record<string, { id: number; name: string; price: string }[]> = {
  "Детская офтальмология": [
    { id: 1, name: "Прием детского врача‑офтальмолога", price: "2500 ₽" },
    { id: 2, name: "Прием (2 и более детей)", price: "2000 ₽" },
    { id: 3, name: "Повторный прием (до 1 года)", price: "1500 ₽" },
    { id: 4, name: "Подбор очковой коррекции", price: "1000 ₽" },
    { id: 5, name: "Подбор коррекции (без обучения)", price: "1200 ₽" },
    { id: 6, name: "Подбор коррекции (с обучением)", price: "1600 ₽" },
    { id: 7, name: "Орто‑линзы (2 глаза)", price: "9000 ₽" },
    { id: 8, name: "MoonLens (2 шт.)", price: "19000 ₽" },
    { id: 9, name: "Зондирование слезных каналов", price: "5600 ₽" },
    { id: 10, name: "Аппаратное лечение (курс 10 дн.)", price: "9000 ₽" },
    { id: 11, name: "Аппаратное лечение (1 день)", price: "900 ₽" },
  ],
  // …другие разделы…
};

// Врачи
const DOCTORS = [
  { id: 1, name: "Иванов И.И.", img: "/doc1.png" },
  { id: 2, name: "Петров П.П.", img: "/doc2.png" },
  { id: 3, name: "Сидоров С.С.", img: "/doc3.png" },
];

// Временные слоты
const TIMES = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30"];

export default function BookingPage() {
  // Начальные состояния
  const [branch, setBranch] = useState(BRANCHES[0]);
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [showAllSubservices, setShowAllSubservices] = useState(false);
  const [subservice, setSubservice] = useState(
    SUBSERVICES[department]?.[0] ?? null
  );
  const [doctor, setDoctor] = useState(DOCTORS[0]);

  // Месяц / Дата
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  ).getDate();
  const DAYS = Array.from({ length: daysInMonth }).map(
    (_, i) => new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i + 1)
  );
  const [date, setDate] = useState(today);

  // Время
  const [time, setTime] = useState(TIMES[0]);

  // Пациенты и телефоны
  const [patients, setPatients] = useState<string[]>(["Иванов Иван"]);
  const [newPatient, setNewPatient] = useState("");
  const [phones, setPhones] = useState<string[]>(["+7 (912) 345‑67‑89"]);
  const [newPhone, setNewPhone] = useState("");

  // Refs для каруселей
  const branchRef = useRef<HTMLDivElement>(null);
  const deptRef = useRef<HTMLDivElement>(null);
  const docRef = useRef<HTMLDivElement>(null);

  // Скролл карусели филиалов
  // Скролл карусели категорий
  const scrollDept = (delta: number) => {
    const idx = DEPARTMENTS.indexOf(department);
    const next = Math.min(Math.max(idx + delta, 0), DEPARTMENTS.length - 1);
    setDepartment(DEPARTMENTS[next]);
    deptRef.current?.children[next]?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
    });
  };
  // Скролл карусели врачей
  const scrollDoc = (delta: number) => {
    const idx = DOCTORS.findIndex((d) => d.id === doctor.id);
    const next = Math.min(Math.max(idx + delta, 0), DOCTORS.length - 1);
    setDoctor(DOCTORS[next]);
    docRef.current?.children[next]?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
    });
  };

  // При смене категории — сбрасываем подуслуги
  useEffect(() => {
    setShowAllSubservices(false);
    const subs = SUBSERVICES[department] || [];
    setSubservice(subs[0] || null);
  }, [department]);

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-4xl mx-auto space-y-8 pb-8"
      >
        {/* 1. Отделение (филиал) */}
        <div className="space-y-2 relative">
          <label className="block text-sm font-medium pl-4">Отделение</label>
          <div
            ref={branchRef}
            className="flex overflow-x-auto space-x-4 snap-x snap-mandatory px-4 pb-2"
          >
            {BRANCHES.map((b) => (
              <div
                key={b}
                onClick={() => setBranch(b)}
                className={`
                  snap-center flex-none px-4 py-2 rounded-xl cursor-pointer
                  ${branch === b ? "bg-primary text-white" : "bg-gray-100"}
                `}
              >
                {b}
              </div>
            ))}
          </div>
        </div>

        {/* 2. Категория услуг */}
        <div className="space-y-2 relative">
          <label className="block text-sm font-medium pl-4">Категория</label>
          <button
            className="hidden md:block absolute left-0 top-10 bg-white p-2 rounded-full shadow"
            onClick={() => scrollDept(-1)}
          >
            ‹
          </button>
          <div
            ref={deptRef}
            className="flex overflow-x-auto space-x-4 snap-x snap-mandatory px-4 pb-2"
          >
            {DEPARTMENTS.map((dep) => (
              <div
                key={dep}
                onClick={() => setDepartment(dep)}
                className={`
                  snap-center flex-none px-4 py-2 rounded-xl cursor-pointer
                  ${department === dep ? "bg-primary text-white" : "bg-gray-100"}
                `}
              >
                {dep}
              </div>
            ))}
          </div>
          <button
            className="hidden md:block absolute right-0 top-10 bg-white p-2 rounded-full shadow"
            onClick={() => scrollDept(1)}
          >
            ›
          </button>
        </div>

        {/* 3. Подуслуги */}
        {SUBSERVICES[department]?.length > 0 && (
          <div className="space-y-2">
            <label className="block text-sm font-medium pl-4">Услуга</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4">
              {(showAllSubservices
                ? SUBSERVICES[department]
                : SUBSERVICES[department].slice(0, 6)
              ).map((s) => (
                <div
                  key={s.id}
                  onClick={() => setSubservice(s)}
                  className={`
                    p-4 bg-white rounded-2xl shadow-soft cursor-pointer
                    ${subservice?.id === s.id ? "ring-2 ring-primary" : ""}
                  `}
                >
                  <p className="font-medium">{s.name}</p>
                  <p className="mt-1 text-sm text-gray-600">{s.price}</p>
                </div>
              ))}

              {!showAllSubservices &&
                SUBSERVICES[department].length > 6 && (
                  <div
                    onClick={() => setShowAllSubservices(true)}
                    className="p-4 bg-gray-200 rounded-2xl shadow-soft cursor-pointer flex items-center justify-center"
                  >
                    Ещё…
                  </div>
                )}
            </div>
          </div>
        )}

        {/* 4. Врач */}
        <div className="space-y-2 relative">
          <label className="block text-sm font-medium pl-4">Врач</label>
          <button
            className="hidden md:block absolute left-0 top-10 bg-white p-2 rounded-full shadow"
            onClick={() => scrollDoc(-1)}
          >
            ‹
          </button>
          <div
            ref={docRef}
            className="flex overflow-x-auto space-x-4 snap-x snap-mandatory px-4 pb-2"
          >
            {DOCTORS.map((d) => (
              <div
                key={d.id}
                onClick={() => setDoctor(d)}
                className={`
                  snap-center flex-none w-32 text-center p-2 rounded-2xl shadow-soft cursor-pointer
                  ${doctor.id === d.id ? "ring-2 ring-primary" : ""}
                `}
              >
                <img
                  src={d.img}
                  alt={d.name}
                  className="w-16 h-16 mx-auto rounded-full"
                />
                <p className="mt-2 text-sm">{d.name}</p>
              </div>
            ))}
          </div>
          <button
            className="hidden md:block absolute right-0 top-10 bg-white p-2 rounded-full shadow"
            onClick={() => scrollDoc(1)}
          >
            ›
          </button>
        </div>

        {/* 5. Дата (месяц + дни) */}
        <div className="space-y-2">
          <label className="block text-sm font-medium pl-4">Дата</label>
          <div className="flex items-center space-x-2 px-4">
            <button
              className="bg-gray-100 px-3 py-1 rounded-l-lg shadow"
              onClick={() =>
                setCurrentMonth(
                  (m) => new Date(m.getFullYear(), m.getMonth() - 1, 1)
                )
              }
            >
              ‹
            </button>
            <div className="bg-white px-4 py-1 rounded-r-lg shadow flex-1 text-center">
              {currentMonth.toLocaleString("ru", {
                month: "long",
                year: "numeric",
              })}
            </div>
            <button
              className="bg-gray-100 px-3 py-1 rounded-lg shadow"
              onClick={() =>
                setCurrentMonth(
                  (m) => new Date(m.getFullYear(), m.getMonth() + 1, 1)
                )
              }
            >
              ›
            </button>
          </div>
          <div className="flex overflow-x-auto space-x-4 px-4 pb-2">
            {DAYS.map((d) => {
              const sel = d.toDateString() === date.toDateString();
              return (
                <div
                  key={d.toISOString()}
                  onClick={() => setDate(d)}
                  className={`
                    snap-center flex-none w-20 text-center p-2 rounded-xl cursor-pointer
                    ${sel ? "bg-primary text-white" : "bg-white shadow-soft"}
                  `}
                >
                  <p className="font-medium">{d.getDate()}</p>
                  <p className="text-xs">
                    {d.toLocaleString("ru", { month: "short" })}
                  </p>
                  <p className="text-xs">
                    {["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"][d.getDay()]}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* 6. Время */}
        <div className="space-y-2">
          <label className="block text-sm font-medium pl-4">Время</label>
          <div className="flex overflow-x-auto space-x-4 px-4 pb-2">
            {TIMES.map((t) => (
              <div
                key={t}
                onClick={() => setTime(t)}
                className={`
                  flex-none px-4 py-2 rounded-xl cursor-pointer
                  ${time === t ? "bg-primary text-white" : "bg-white shadow-soft"}
                `}
              >
                {t}
              </div>
            ))}
          </div>
        </div>

        {/* 7. Пациенты */}
        <div className="space-y-2">
          <label className="block text-sm font-medium pl-4">Пациенты</label>
          <div className="flex flex-wrap gap-2 px-4">
            {patients.map((p, i) => (
              <div
                key={i}
                className="flex items-center bg-white rounded-full shadow-soft px-4 py-2 text-lg"
              >
                <span>{p}</span>
                <button
                  className="ml-2 text-gray-500"
                  onClick={() =>
                    setPatients((ps) => ps.filter((_, j) => j !== i))
                  }
                >
                  ×
                </button>
              </div>
            ))}
            <div className="flex items-center bg-gray-100 rounded-full shadow-soft px-4 py-2 text-lg">
              <input
                type="text"
                placeholder="ФИО"
                value={newPatient}
                onChange={(e) => setNewPatient(e.target.value)}
                className="bg-transparent focus:outline-none flex-1"
              />
              <button
                className="ml-2 text-primary font-bold text-xl"
                onClick={() => {
                  if (newPatient.trim()) {
                    setPatients((ps) => [...ps, newPatient.trim()]);
                    setNewPatient("");
                  }
                }}
              >
                ＋
              </button>
            </div>
          </div>
        </div>

        {/* 8. Телефоны */}
        <div className="space-y-2">
          <label className="block text-sm font-medium pl-4">Телефоны</label>
          <div className="flex flex-wrap gap-2 px-4">
            {phones.map((ph, i) => (
              <div
                key={i}
                className="flex items-center bg-white rounded-full shadow-soft px-4 py-2 text-lg"
              >
                <span>{ph}</span>
                <button
                  className="ml-2 text-gray-500"
                  onClick={() =>
                    setPhones((ps) => ps.filter((_, j) => j !== i))
                  }
                >
                  ×
                </button>
              </div>
            ))}
            <div className="flex items-center bg-gray-100 rounded-full shadow-soft px-4 py-2 text-lg">
              <input
                type="tel"
                placeholder="Телефон"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                className="bg-transparent focus:outline-none flex-1"
              />
              <button
                className="ml-2 text-primary font-bold text-xl"
                onClick={() => {
                  if (newPhone.trim()) {
                    setPhones((ps) => [...ps, newPhone.trim()]);
                    setNewPhone("");
                  }
                }}
              >
                ＋
              </button>
            </div>
          </div>
        </div>

        {/* Подтверждение */}
        <div className="px-4 py-6">
          <Button
            onClick={() =>
              alert(`
Отделение: ${branch}
Категория: ${department}
Услуга: ${subservice?.name}
Врач: ${doctor.name}
Дата: ${date.toLocaleDateString()}
Время: ${time}
Пациенты: ${patients.join(", ")}
Телефоны: ${phones.join(", ")}
`)
            }
            className="w-full"
          >
            Подтвердить запись
          </Button>
        </div>
      </motion.div>
    </Layout>
  );
}
