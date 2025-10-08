"use client";
import React, { useEffect, useState } from "react";
import { fetchAppointments, Appointment } from "@/utils/api";
import { AppointmentCard } from "@/components/AppointmentCard";
import { Layout } from "@/components/Layout";

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  // "planned" или "past"
  const [tab, setTab] = useState<"planned" | "past">("planned");

  useEffect(() => {
    fetchAppointments().then((data) => {
      setAppointments(data);
      setLoading(false);
    });
  }, []);

  const handleCancel = (id: string) => {
    setAppointments((prev) =>
      prev.map((app) =>
        app.id === id ? { ...app, status: "cancelled" } : app
      )
    );
  };

  const planned = appointments.filter(
    (a) => a.status === "planned" || a.status === "confirmed"
  );
  const past = appointments.filter(
    (a) => a.status === "completed" || a.status === "cancelled"
  );

  return (
    <Layout>
      <h1 className="text-3xl font-semibold mb-6 text-primary">Мои приёмы</h1>

      {/* Вкладки */}
      <div className="inline-flex mb-8 bg-gray-200 rounded-full overflow-hidden">
        <button
          onClick={() => setTab("planned")}
          className={`px-6 py-2 font-medium ${
            tab === "planned"
              ? "bg-white text-primary shadow"
              : "text-gray-600"
          }`}
        >
          Планируемые
        </button>
        <button
          onClick={() => setTab("past")}
          className={`px-6 py-2 font-medium ${
            tab === "past"
              ? "bg-white text-primary shadow"
              : "text-gray-600"
          }`}
        >
          Прошедшие
        </button>
      </div>

      {loading && <p>Загрузка…</p>}

      {!loading && tab === "planned" && (
        <>
          {planned.length === 0 ? (
            <p className="text-gray-600">Нет планируемых приёмов.</p>
          ) : (
            planned.map((app) => (
              <AppointmentCard
                key={app.id}
                appointment={app}
                onCancel={handleCancel}
              />
            ))
          )}
        </>
      )}

      {!loading && tab === "past" && (
        <>
          {past.length === 0 ? (
            <p className="text-gray-600">Нет прошедших приёмов.</p>
          ) : (
            past.map((app) => (
              <AppointmentCard
                key={app.id}
                appointment={app}
                onCancel={undefined}
              />
            ))
          )}
        </>
      )}
    </Layout>
  );
}
