"use client";
import React, { useState } from "react";
import { Appointment } from "@/utils/api";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  appointment: Appointment;
  onCancel?: (id: string) => void;
}

export function AppointmentCard({ appointment, onCancel }: Props) {
  const [open, setOpen] = useState(false);
  const {
    id,
    date,
    serviceName,
    doctorName,
    specialty,
    recommendations,
    patients: patientsRaw,
    status,
  } = appointment;

  const patients = patientsRaw ?? [];
  const dt = new Date(date);
  const formattedDate = dt.toLocaleDateString("ru", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const formattedTime = dt.toLocaleTimeString("ru", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Цвет рамки приёма: серый, если отменён
  const borderClass =
    status === "cancelled"
      ? "border-red-300"
      : status === "completed"
      ? "border-gray-300"
      : "border-primary";

  return (
    <div className={`mb-6 border-2 ${borderClass} rounded-2xl overflow-hidden`}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full bg-white px-6 py-4 flex justify-between items-center hover:bg-gray-50 transition"
      >
        <div>
          <p className="text-lg font-semibold">{serviceName}</p>
          <p className="text-gray-600 mt-1">
            {formattedDate} в {formattedTime}
          </p>
          {status === "cancelled" && (
            <p className="text-red-600 font-medium mt-1">Отменён</p>
          )}
        </div>
        <div className="ml-4 text-2xl">{open ? "▲" : "▼"}</div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-gray-50 px-6 pt-4 pb-6"
          >
            <div className="space-y-3 text-base">
              <p>
                <span className="font-medium">Врач:</span> {doctorName}
                {specialty ? ` · ${specialty}` : ""}
              </p>
              <p className="font-medium">Пациенты:</p>
              {patients.length > 0 ? (
                <ul className="list-disc list-inside">
                  {patients.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-600">Нет данных</p>
              )}
              {recommendations && (
                <div>
                  <p className="font-medium">Рекомендации:</p>
                  <p className="whitespace-pre-wrap">{recommendations}</p>
                </div>
              )}
              {onCancel && status !== "cancelled" && (
                <button
                  onClick={() => onCancel(id)}
                  className="mt-4 px-5 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition"
                >
                  Отменить приём
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
