// src/components/ProfileForm.tsx
"use client";

import React, { useState } from "react";
import { FormInput } from "./FormInput";
import { Button } from "./Button";

export function ProfileForm() {
  const [profile, setProfile] = useState<{
    fullName: string;
    email: string;
    phone: string;
    medCard: string;
    birthDate: string;
    city: string;
    notifySms: boolean;
    notifyEmail: boolean;
  }>({
    fullName: "",
    email: "",
    phone: "",
    medCard: "",
    birthDate: "",
    city: "",
    notifySms: false,
    notifyEmail: false,
  });

  const [editingPassword, setEditingPassword] = useState(false);
  const [passwords, setPasswords] = useState({
    old: "",
    new: "",
    confirm: "",
  });

  const CITIES = ["Р‘СЂР°С‚СЃРє", "РЈСЃС‚СЊ-РР»РёРјСЃРє", "РЈСЃС‚СЊ-РљСѓС‚"];

  const handleChange = (field: string, value: string) => {
    setProfile((p) => ({ ...p, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void profile;
    // РјРѕР¶РЅРѕ СѓРІРµРґРѕРјРёС‚СЊ РѕР± СѓСЃРїРµС…Рµ
  };

  const handlePasswordSave = () => {
    // Р·РґРµСЃСЊ Р»РѕРіРёРєР° СЃРјРµРЅС‹ РїР°СЂРѕР»СЏ...
    setPasswords({ old: "", new: "", confirm: "" });
    setEditingPassword(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Р”РІСѓС…РєРѕР»РѕРЅРѕС‡РЅР°СЏ СЃРµС‚РєР° */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormInput
          label="Р¤РРћ"
          value={profile.fullName}
          onChange={(e) => handleChange("fullName", e.target.value)}
        />
        <FormInput
          label="Р”Р°С‚Р° СЂРѕР¶РґРµРЅРёСЏ"
          type="date"
          value={profile.birthDate}
          onChange={(e) => handleChange("birthDate", e.target.value)}
        />
        <FormInput
          label="EвЂ‘mail"
          type="email"
          value={profile.email}
          onChange={(e) => handleChange("email", e.target.value)}
        />

        {/* Р“РѕСЂРѕРґ вЂ” С‚РµРїРµСЂСЊ СЃ С‚Р°РєРёРј Р¶Рµ pl-4 */}
        <div className="mb-4">
          <label
            htmlFor="profile-city"
            className="block text-sm font-medium mb-1 text-text pl-4"
          >
            Р“РѕСЂРѕРґ
          </label>
          <select
            id="profile-city"
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
          label="РўРµР»РµС„РѕРЅ"
          type="tel"
          value={profile.phone}
          onChange={(e) => handleChange("phone", e.target.value)}
        />
        <FormInput
          label="РќРѕРјРµСЂ РјРµРґРєР°СЂС‚С‹"
          value={profile.medCard}
          readOnly
        />
      </div>

      {/* РЎРѕС…СЂР°РЅРёС‚СЊ Рё РЎРјРµРЅРёС‚СЊ РїР°СЂРѕР»СЊ */}
      <div className="flex items-center gap-4">
        <Button type="submit" variant="primary">
          РЎРѕС…СЂР°РЅРёС‚СЊ РёР·РјРµРЅРµРЅРёСЏ
        </Button>
        {!editingPassword && (
          <button
            type="button"
            onClick={() => setEditingPassword(true)}
            className="text-primary underline"
          >
            РЎРјРµРЅРёС‚СЊ РїР°СЂРѕР»СЊ
          </button>
        )}
      </div>

      {/* Р‘Р»РѕРє СЃРјРµРЅС‹ РїР°СЂРѕР»СЏ */}
      {editingPassword && (
        <div className="space-y-4 bg-gray-50 p-4 rounded-2xl shadow-soft">
          <FormInput
            label="РЎС‚Р°СЂС‹Р№ РїР°СЂРѕР»СЊ"
            type="password"
            value={passwords.old}
            onChange={(e) =>
              setPasswords((p) => ({ ...p, old: e.target.value }))
            }
          />
          <FormInput
            label="РќРѕРІС‹Р№ РїР°СЂРѕР»СЊ"
            type="password"
            value={passwords.new}
            onChange={(e) =>
              setPasswords((p) => ({ ...p, new: e.target.value }))
            }
          />
          <FormInput
            label="РџРѕРґС‚РІРµСЂРґРёС‚Рµ РїР°СЂРѕР»СЊ"
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
              РћС‚РјРµРЅР°
            </button>
            <Button variant="primary" onClick={handlePasswordSave}>
              РЎРѕС…СЂР°РЅРёС‚СЊ РїР°СЂРѕР»СЊ
            </Button>
          </div>
        </div>
      )}
    </form>
  );
}


