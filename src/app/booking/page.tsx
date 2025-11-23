"use client";
/* eslint-disable @next/next/no-img-element */

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/Button";
import { motion } from "framer-motion";
import type { DoctorDirectoryEntry, ServiceDirectoryEntry } from "@/types/clinic";

const BRANCHES = ["Центральный", "Северный", "Южный"];
const TIMES = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30"];
const FALLBACK_SPECIALTY = "Без специализации";
const SERVICE_FALLBACK_GROUP = "Другие услуги";
const DOCTOR_PLACEHOLDER = "/doctor.svg";

const formatServicePrice = (service: ServiceDirectoryEntry) => {
  if (typeof service.price !== "number") {
    return null;
  }
  const currency = service.currency?.toUpperCase() ?? "RUB";
  const symbol = currency === "RUB" ? "₽" : currency;
  return `${service.price.toLocaleString("ru-RU")} ${symbol}`;
};

const formatDuration = (minutes?: number | null) => {
  if (typeof minutes !== "number" || Number.isNaN(minutes) || minutes <= 0) {
    return null;
  }
  return `${minutes} мин.`;
};

const buildDays = (cursor: Date) => {
  const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  return Array.from({ length: daysInMonth }, (_, index) =>
    new Date(cursor.getFullYear(), cursor.getMonth(), index + 1),
  );
};

type DoctorsGroup = [string, DoctorDirectoryEntry[]];

export default function BookingPage() {
  const [branch, setBranch] = useState(BRANCHES[0]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showAllServices, setShowAllServices] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceDirectoryEntry | null>(null);

  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [date, setDate] = useState(today);
  const [time, setTime] = useState(TIMES[0]);
  const days = useMemo(() => buildDays(currentMonth), [currentMonth]);

  const [patients, setPatients] = useState<string[]>(["Иванов Иван"]);
  const [newPatient, setNewPatient] = useState("");
  const [phones, setPhones] = useState<string[]>(["+7 (912) 345-67-89"]);
  const [newPhone, setNewPhone] = useState("");

  const categoryRef = useRef<HTMLDivElement | null>(null);

  const [services, setServices] = useState<ServiceDirectoryEntry[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [servicesError, setServicesError] = useState<string | null>(null);

  const [doctors, setDoctors] = useState<DoctorDirectoryEntry[]>([]);
  const [doctorsLoading, setDoctorsLoading] = useState(false);
  const [doctorsError, setDoctorsError] = useState<string | null>(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadServices = async () => {
      setServicesLoading(true);
      setServicesError(null);
      try {
        const res = await fetch("/api/services");
        if (!res.ok) {
          throw new Error("services response is not ok");
        }
        const payload = (await res.json()) as { data?: ServiceDirectoryEntry[] };
        if (!active) return;
        const list = (payload.data ?? []).map((item) => ({
          ...item,
          category: item.category || SERVICE_FALLBACK_GROUP,
        }));
        list.sort(
          (a, b) =>
            a.category.localeCompare(b.category, "ru") ||
            a.name.localeCompare(b.name, "ru"),
        );
        setServices(list);
      } catch (error) {
        console.warn("loadServices error", error);
        if (!active) return;
        setServices([]);
        setServicesError("Не удалось загрузить список услуг. Попробуйте позже.");
      } finally {
        if (active) {
          setServicesLoading(false);
        }
      }
    };

    const loadDoctors = async () => {
      setDoctorsLoading(true);
      setDoctorsError(null);
      try {
        const res = await fetch("/api/doctors");
        if (!res.ok) {
          throw new Error("doctors response is not ok");
        }
        const payload = (await res.json()) as { data?: DoctorDirectoryEntry[] };
        if (!active) return;
        const list = (payload.data ?? []).map((item) => ({
          ...item,
          specialties: Array.isArray(item.specialties) ? item.specialties : [],
        }));
        list.sort((a, b) => a.fullName.localeCompare(b.fullName, "ru"));
        setDoctors(list);
      } catch (error) {
        console.warn("loadDoctors error", error);
        if (!active) return;
        setDoctors([]);
        setDoctorsError("Не удалось загрузить список врачей. Попробуйте позже.");
      } finally {
        if (active) {
          setDoctorsLoading(false);
        }
      }
    };

    loadServices();
    loadDoctors();

    return () => {
      active = false;
    };
  }, []);

  const serviceCategories = useMemo(() => {
    const unique = new Set<string>();
    services.forEach((service) => {
      unique.add(service.category || SERVICE_FALLBACK_GROUP);
    });
    return Array.from(unique).sort((a, b) => a.localeCompare(b, "ru"));
  }, [services]);

  useEffect(() => {
    if (!serviceCategories.length) {
      setSelectedCategory(null);
      setSelectedService(null);
      return;
    }
    setSelectedCategory((prev) => {
      if (prev && serviceCategories.includes(prev)) {
        return prev;
      }
      return serviceCategories[0];
    });
  }, [serviceCategories]);

  useEffect(() => {
    setShowAllServices(false);
  }, [selectedCategory]);

  const servicesInCategory = useMemo(() => {
    if (!selectedCategory) {
      return [];
    }
    return services
      .filter((service) => service.category === selectedCategory)
      .sort((a, b) => a.name.localeCompare(b.name, "ru"));
  }, [services, selectedCategory]);

  useEffect(() => {
    if (!servicesInCategory.length) {
      setSelectedService(null);
      return;
    }
    setSelectedService((prev) => {
      if (prev && servicesInCategory.some((service) => service.id === prev.id)) {
        return prev;
      }
      return servicesInCategory[0];
    });
  }, [servicesInCategory]);

  useEffect(() => {
    if (!doctors.length) {
      setSelectedDoctorId(null);
      return;
    }
    setSelectedDoctorId((prev) => {
      if (prev && doctors.some((doctor) => doctor.id === prev)) {
        return prev;
      }
      return doctors[0].id;
    });
  }, [doctors]);

  const doctorGroups = useMemo<DoctorsGroup[]>(() => {
    if (!doctors.length) {
      return [];
    }
    const map = new Map<string, DoctorDirectoryEntry[]>();
    doctors.forEach((doctor) => {
      const specs = doctor.specialties?.length ? doctor.specialties : [FALLBACK_SPECIALTY];
      specs.forEach((raw) => {
        const key = raw?.trim() || FALLBACK_SPECIALTY;
        const list = map.get(key) ?? [];
        list.push(doctor);
        map.set(key, list);
      });
    });
    return Array.from(map.entries())
      .map<DoctorsGroup>(([specialty, list]) => [
        specialty,
        [...list].sort((a, b) => a.fullName.localeCompare(b.fullName, "ru")),
      ])
      .sort((a, b) => a[0].localeCompare(b[0], "ru"));
  }, [doctors]);

  const selectedDoctor = useMemo(
    () => doctors.find((doctor) => doctor.id === selectedDoctorId) ?? null,
    [doctors, selectedDoctorId],
  );

  const handleCategoryScroll = (delta: number) => {
    if (!serviceCategories.length) {
      return;
    }
    const currentIndex = selectedCategory ? serviceCategories.indexOf(selectedCategory) : 0;
    const safeIndex = currentIndex === -1 ? 0 : currentIndex;
    const nextIndex = Math.min(
      Math.max(safeIndex + delta, 0),
      serviceCategories.length - 1,
    );
    const target = serviceCategories[nextIndex];
    if (target) {
      setSelectedCategory(target);
      categoryRef.current?.children[nextIndex]?.scrollIntoView({
        behavior: "smooth",
        inline: "center",
      });
    }
  };

  const handleAddPatient = () => {
    const value = newPatient.trim();
    if (!value) return;
    setPatients((prev) => [...prev, value]);
    setNewPatient("");
  };

  const handleAddPhone = () => {
    const value = newPhone.trim();
    if (!value) return;
    setPhones((prev) => [...prev, value]);
    setNewPhone("");
  };

  const servicesToDisplay = showAllServices
    ? servicesInCategory
    : servicesInCategory.slice(0, 6);

  const handleSubmit = () => {
    alert(`
Филиал: ${branch}
Категория: ${selectedCategory ?? "не выбрана"}
Услуга: ${selectedService?.name ?? "не выбрана"}
Врач: ${selectedDoctor?.fullName ?? "не выбран"}
Дата: ${date.toLocaleDateString("ru-RU")}
Время: ${time}
Пациенты: ${patients.join(", ") || "не указаны"}
Телефоны: ${phones.join(", ") || "не указаны"}
`);
  };

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mx-auto max-w-4xl space-y-8 pb-8"
      >
        {/* 1. Филиалы */}
        <div className="relative space-y-2">
          <label className="block pl-4 text-sm font-medium text-slate-600">Филиалы</label>
          <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2">
            {BRANCHES.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setBranch(item)}
                className={`snap-center rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                  branch === item ? "bg-primary text-white" : "bg-gray-100 text-slate-600"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Направления (категории услуг) */}
        <div className="relative space-y-2">
          <label className="block pl-4 text-sm font-medium text-slate-600">Направления</label>
          <button
            type="button"
            className="absolute left-0 top-10 hidden rounded-full bg-white p-2 shadow md:block"
            onClick={() => handleCategoryScroll(-1)}
          >
            ←
          </button>
          <div
            ref={categoryRef}
            className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2"
          >
            {serviceCategories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className={`snap-center rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                  selectedCategory === category
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-slate-600"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="absolute right-0 top-10 hidden rounded-full bg-white p-2 shadow md:block"
            onClick={() => handleCategoryScroll(1)}
          >
            →
          </button>
          {!serviceCategories.length && !servicesLoading && !servicesError && (
            <div className="rounded-2xl bg-slate-100 px-5 py-4 text-center text-sm text-slate-500">
              Нет доступных категорий услуг.
            </div>
          )}
        </div>

        {/* 3. Услуги */}
        <div className="space-y-2">
          <label className="block pl-4 text-sm font-medium text-slate-600">Услуги</label>
          {servicesLoading && (
            <div className="rounded-2xl bg-slate-100 px-5 py-4 text-center text-sm text-slate-600">
              Загружаем каталог услуг…
            </div>
          )}
          {servicesError && (
            <div className="rounded-2xl bg-rose-50 px-5 py-4 text-center text-sm text-rose-600">
              {servicesError}
            </div>
          )}
          {!servicesLoading && !servicesError && servicesInCategory.length === 0 && (
            <div className="rounded-2xl bg-slate-100 px-5 py-4 text-center text-sm text-slate-500">
              Для выбранного направления пока нет услуг.
            </div>
          )}
          {servicesInCategory.length > 0 && (
            <div className="grid gap-4 px-4 md:grid-cols-2">
              {servicesToDisplay.map((service) => {
                const active = selectedService?.id === service.id;
                const price = formatServicePrice(service);
                const duration = formatDuration(service.durationMinutes);
                return (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => setSelectedService(service)}
                    className={`rounded-2xl p-4 text-left shadow-soft transition ring-1 ring-transparent ${
                      active ? "ring-2 ring-primary" : "bg-white"
                    }`}
                  >
                    <p className="text-sm font-semibold text-slate-900">{service.name}</p>
                    {service.subcategory && (
                      <p className="mt-1 text-[13px] text-slate-500">{service.subcategory}</p>
                    )}
                    {(price || duration) && (
                      <p className="mt-3 text-sm font-semibold text-slate-700">
                        {price ?? "—"} {duration ? `· ${duration}` : ""}
                      </p>
                    )}
                  </button>
                );
              })}
              {!showAllServices && servicesInCategory.length > servicesToDisplay.length && (
                <button
                  type="button"
                  onClick={() => setShowAllServices(true)}
                  className="flex items-center justify-center rounded-2xl bg-slate-100 p-4 text-sm font-semibold text-slate-600 shadow-soft"
                >
                  Показать ещё
                </button>
              )}
            </div>
          )}
        </div>

        {/* 4. Врачи */}
        <div className="space-y-4">
          <label className="block pl-4 text-sm font-medium text-slate-600">Врачи</label>
          {doctorsLoading && (
            <div className="rounded-2xl bg-slate-100 px-5 py-4 text-center text-sm text-slate-600">
              Загружаем список врачей…
            </div>
          )}
          {doctorsError && (
            <div className="rounded-2xl bg-rose-50 px-5 py-4 text-center text-sm text-rose-600">
              {doctorsError}
            </div>
          )}
          {!doctorsLoading && !doctorsError && doctorGroups.length === 0 && (
            <div className="rounded-2xl bg-slate-100 px-5 py-4 text-center text-sm text-slate-500">
              Список врачей временно недоступен.
            </div>
          )}
          {doctorGroups.map(([specialty, list]) => (
            <div key={specialty} className="space-y-2">
              <div className="flex items-center justify-between px-4">
                <p className="text-base font-semibold text-slate-800">{specialty}</p>
                <span className="text-sm text-slate-500">{list.length} врач.</span>
              </div>
              <div className="-mx-2 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2">
                {list.map((doctor) => {
                  const selected = doctor.id === selectedDoctorId;
                  const photo =
                    doctor.photoUrl && doctor.photoUrl.length > 0
                      ? doctor.photoUrl
                      : DOCTOR_PLACEHOLDER;
                  return (
                    <button
                      key={`${specialty}-${doctor.id}`}
                      type="button"
                      onClick={() => setSelectedDoctorId(doctor.id)}
                      className={`min-w-[220px] snap-center rounded-2xl bg-white p-4 text-left shadow-soft transition ${
                        selected ? "ring-2 ring-primary" : "ring-1 ring-transparent"
                      }`}
                    >
                      <img
                        src={photo}
                        alt={doctor.fullName}
                        className="mx-auto h-20 w-20 rounded-full object-cover"
                      />
                      <p className="mt-3 text-sm font-semibold text-slate-900">
                        {doctor.fullName}
                      </p>
                      {doctor.specialties.length > 0 && (
                        <p className="mt-1 text-[13px] text-slate-500">
                          {doctor.specialties.join(" · ")}
                        </p>
                      )}
                      {doctor.phone && (
                        <p className="mt-1 text-[13px] text-slate-500">{doctor.phone}</p>
                      )}
                      {doctor.email && (
                        <p className="text-[13px] text-slate-500">{doctor.email}</p>
                      )}
                      <div className="mt-3 rounded-xl bg-slate-100 px-3 py-1 text-center text-sm font-semibold text-slate-600">
                        {selected ? "Выбран" : "Выбрать"}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* 5. Календарь */}
        <div className="space-y-2">
          <label className="block pl-4 text-sm font-medium text-slate-600">Календарь</label>
          <div className="flex items-center gap-2 px-4">
            <button
              type="button"
              className="rounded-l-lg bg-gray-100 px-3 py-1 text-slate-600 shadow"
              onClick={() =>
                setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
              }
            >
              ←
            </button>
            <div className="flex-1 rounded-r-lg bg-white px-4 py-1 text-center font-semibold shadow">
              {currentMonth.toLocaleString("ru-RU", { month: "long", year: "numeric" })}
            </div>
            <button
              type="button"
              className="rounded-lg bg-gray-100 px-3 py-1 text-slate-600 shadow"
              onClick={() =>
                setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
              }
            >
              →
            </button>
          </div>
          <div className="flex gap-4 overflow-x-auto px-4 pb-2">
            {days.map((day) => {
              const isSelected = day.toDateString() === date.toDateString();
              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => setDate(day)}
                  className={`w-20 snap-center rounded-xl p-2 text-center text-sm font-semibold transition ${
                    isSelected ? "bg-primary text-white" : "bg-white text-slate-700 shadow-soft"
                  }`}
                >
                  <p className="text-lg">{day.getDate()}</p>
                  <p className="text-xs capitalize">{day.toLocaleString("ru-RU", { month: "short" })}</p>
                  <p className="text-xs">
                    {["ВС", "ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ"][day.getDay()]}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* 6. Время */}
        <div className="space-y-2">
          <label className="block pl-4 text-sm font-medium text-slate-600">Время</label>
          <div className="flex gap-4 overflow-x-auto px-4 pb-2">
            {TIMES.map((slot) => (
              <button
                key={slot}
                type="button"
                onClick={() => setTime(slot)}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  time === slot ? "bg-primary text-white" : "bg-white text-slate-700 shadow-soft"
                }`}
              >
                {slot}
              </button>
            ))}
          </div>
        </div>

        {/* 7. Пациенты */}
        <div className="space-y-2">
          <label className="block pl-4 text-sm font-medium text-slate-600">Пациенты</label>
          <div className="flex flex-wrap gap-2 px-4">
            {patients.map((patient, index) => (
              <div
                key={`${patient}-${index}`}
                className="flex items-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-soft"
              >
                <span>{patient}</span>
                <button
                  type="button"
                  className="ml-2 text-slate-400"
                  onClick={() =>
                    setPatients((prev) => prev.filter((_, idx) => idx !== index))
                  }
                >
                  ✕
                </button>
              </div>
            ))}
            <div className="flex items-center rounded-full bg-gray-100 px-4 py-2 shadow-soft">
              <input
                type="text"
                placeholder="Имя"
                value={newPatient}
                onChange={(event) => setNewPatient(event.target.value)}
                className="bg-transparent text-sm text-slate-700 outline-none"
              />
              <button
                type="button"
                className="ml-2 text-lg font-semibold text-primary"
                onClick={handleAddPatient}
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* 8. Контакты */}
        <div className="space-y-2">
          <label className="block pl-4 text-sm font-medium text-slate-600">Контактные телефоны</label>
          <div className="flex flex-wrap gap-2 px-4">
            {phones.map((phone, index) => (
              <div
                key={`${phone}-${index}`}
                className="flex items-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-soft"
              >
                <span>{phone}</span>
                <button
                  type="button"
                  className="ml-2 text-slate-400"
                  onClick={() =>
                    setPhones((prev) => prev.filter((_, idx) => idx !== index))
                  }
                >
                  ✕
                </button>
              </div>
            ))}
            <div className="flex items-center rounded-full bg-gray-100 px-4 py-2 shadow-soft">
              <input
                type="tel"
                placeholder="+7 (___) ___-__-__"
                value={newPhone}
                onChange={(event) => setNewPhone(event.target.value)}
                className="bg-transparent text-sm text-slate-700 outline-none"
              />
              <button
                type="button"
                className="ml-2 text-lg font-semibold text-primary"
                onClick={handleAddPhone}
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="px-4 py-6">
          <Button onClick={handleSubmit} className="w-full">
            Оформить запись
          </Button>
        </div>
      </motion.div>
    </Layout>
  );
}
