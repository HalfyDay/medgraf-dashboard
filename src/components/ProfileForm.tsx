// src/components/ProfileForm.tsx
"use client";

import React, { useState, useEffect } from "react";
import { FormInput } from "./FormInput";
import { Button } from "./Button";
import { fetchProfile, updateProfile } from "@/utils/api";

export function ProfileForm() {
  const [profile, setProfile] = useState<{
    fullName: string;
    email: string;
    phone: string;
    medCard: string;
    birthDate: string;
    city: string;
  }>({
    fullName: "",
    email: "",
    phone: "",
    medCard: "",
    birthDate: "",
    city: "",
  });
  const [loading, setLoading] = useState(true);

  const [editingPassword, setEditingPassword] = useState(false);
  const [passwords, setPasswords] = useState({
    old: "",
    new: "",
    confirm: "",
  });

  const CITIES = ["Братск", "Усть-Илимск", "Усть-Кут"];

  useEffect(() => {
    fetchProfile().then((data) => {
      setProfile(data);
      setLoading(false);
    });
  }, []);

  const handleChange = (field: string, value: string) => {
    setProfile((p) => ({ ...p, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile(profile);
    // можно уведомить об успехе
  };

  const handlePasswordSave = () => {
    // здесь логика смены пароля...
    setPasswords({ old: "", new: "", confirm: "" });
    setEditingPassword(false);
  };

  if (loading) {
    return <p>Загрузка...</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Двухколоночная сетка */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormInput
          label="ФИО"
          value={profile.fullName}
          onChange={(e) => handleChange("fullName", e.target.value)}
        />
        <FormInput
          label="Дата рождения"
          type="date"
          value={profile.birthDate}
          onChange={(e) => handleChange("birthDate", e.target.value)}
        />
        <FormInput
          label="E‑mail"
          type="email"
          value={profile.email}
          onChange={(e) => handleChange("email", e.target.value)}
        />

        {/* Город — теперь с таким же pl-4 */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1 text-text pl-4">
            Город
          </label>
          <select
            value={profile.city}
            onChange={(e) => handleChange("city", e.target.value)}
            className="
              w-full px-4 py-2 border rounded-3xl
              focus:outline-none focus:ring-2 focus:ring-primary
              transition-colors duration-200 ease-out
              border-gray-300
            "
          >
            {CITIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <FormInput
          label="Телефон"
          type="tel"
          value={profile.phone}
          onChange={(e) => handleChange("phone", e.target.value)}
        />
        <FormInput
          label="Номер медкарты"
          value={profile.medCard}
          readOnly
        />
      </div>

      {/* Сохранить и Сменить пароль */}
      <div className="flex items-center gap-4">
        <Button type="submit" variant="primary">
          Сохранить изменения
        </Button>
        {!editingPassword && (
          <button
            type="button"
            onClick={() => setEditingPassword(true)}
            className="text-primary underline"
          >
            Сменить пароль
          </button>
        )}
      </div>

      {/* Блок смены пароля */}
      {editingPassword && (
        <div className="space-y-4 bg-gray-50 p-4 rounded-2xl shadow-soft">
          <FormInput
            label="Старый пароль"
            type="password"
            value={passwords.old}
            onChange={(e) =>
              setPasswords((p) => ({ ...p, old: e.target.value }))
            }
          />
          <FormInput
            label="Новый пароль"
            type="password"
            value={passwords.new}
            onChange={(e) =>
              setPasswords((p) => ({ ...p, new: e.target.value }))
            }
          />
          <FormInput
            label="Подтвердите пароль"
            type="password"
            value={passwords.confirm}
            onChange={(e) =>
              setPasswords((p) => ({ ...p, confirm: e.target.value }))
            }
          />
          <div className="flex gap-4 justify-end">
            <button
              type="button"
              onClick={() => setEditingPassword(false)}
              className="px-4 py-2 bg-gray-200 rounded-2xl shadow-soft hover:shadow-md transition"
            >
              Отмена
            </button>
            <Button variant="primary" onClick={handlePasswordSave}>
              Сохранить пароль
            </Button>
          </div>
        </div>
      )}
    </form>
  );
}
