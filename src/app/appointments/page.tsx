"use client";
import React, { useEffect, useState } from "react";
import { fetchAppointments, fetchScheduleAppointments, type Appointment } from "@/utils/api";
import { AppointmentCard } from "@/components/AppointmentCard";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/providers/AuthProvider";

export default function AppointmentsPage() {
  const { user } = useAuth();
  const [activeAppointments, setActiveAppointments] = useState<Appointment[]>([]);
  const [cancelledAppointments, setCancelledAppointments] = useState<Appointment[]>([]);
  const [historyAppointments, setHistoryAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"planned" | "past">("planned");

  useEffect(() => {
    const patientId = user?.onecId?.toString().trim();
    if (!patientId) {
      setActiveAppointments([]);
      setCancelledAppointments([]);
      setHistoryAppointments([]);
      setLoading(false);
      return;
    }

    let alive = true;
    setLoading(true);
    Promise.all([
      fetchScheduleAppointments({ patientId, status: "1" }),
      fetchScheduleAppointments({ patientId, status: "3" }),
      fetchAppointments(patientId),
    ])
      .then(([active, cancelled, history]) => {
        if (!alive) return;
        setActiveAppointments(active);
        setCancelledAppointments(cancelled);
        setHistoryAppointments(history);
      })
      .catch(() => {
        if (!alive) return;
        setActiveAppointments([]);
        setCancelledAppointments([]);
        setHistoryAppointments([]);
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [user?.onecId]);

  const handleCancel = (id: string) => {
    setActiveAppointments((prev) => {
      const cancelled = prev.find((app) => app.id === id);
      if (cancelled) {
        setCancelledAppointments((prevCancelled) => [
          { ...cancelled, status: "cancelled" },
          ...prevCancelled,
        ]);
      }
      return prev.filter((app) => app.id !== id);
    });
  };

  return (
    <Layout>
      <h1 className="text-3xl font-semibold mb-6 text-primary">Мои приемы</h1>

      <div className="inline-flex mb-8 bg-gray-200 rounded-full overflow-hidden">
        <button
          onClick={() => setTab("planned")}
          className={`px-6 py-2 font-medium ${
            tab === "planned"
              ? "bg-white text-primary shadow"
              : "text-gray-600"
          }`}
        >
          Активные
        </button>
        <button
          onClick={() => setTab("past")}
          className={`px-6 py-2 font-medium ${
            tab === "past"
              ? "bg-white text-primary shadow"
              : "text-gray-600"
          }`}
        >
          История
        </button>
      </div>

      {loading && <p>Загрузка…</p>}

      {!loading && tab === "planned" && (
        <>
          <div className="mb-6">
            <h2 className="mb-3 text-lg font-semibold text-slate-700">Действующие</h2>
            {activeAppointments.length === 0 ? (
              <p className="text-gray-600">Нет действующих приемов.</p>
            ) : (
              activeAppointments.map((app) => (
                <AppointmentCard
                  key={app.id}
                  appointment={app}
                  onCancel={handleCancel}
                />
              ))
            )}
          </div>

          <div>
            <h2 className="mb-3 text-lg font-semibold text-slate-700">Отмененные</h2>
            {cancelledAppointments.length === 0 ? (
              <p className="text-gray-600">Нет отмененных приемов.</p>
            ) : (
              cancelledAppointments.map((app) => (
                <AppointmentCard
                  key={app.id}
                  appointment={app}
                  onCancel={undefined}
                />
              ))
            )}
          </div>
        </>
      )}

      {!loading && tab === "past" && (
        <>
          {historyAppointments.length === 0 ? (
            <p className="text-gray-600">Нет истории приемов.</p>
          ) : (
            historyAppointments.map((app) => (
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
