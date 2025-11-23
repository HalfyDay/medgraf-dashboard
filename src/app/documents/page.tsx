"use client";

import React, { useEffect, useMemo, useState } from "react";
import { fetchDocuments, type DocumentItem } from "@/utils/api";
import { DocumentCard } from "@/components/DocumentCard";
import { Layout } from "@/components/Layout";
import { FormInput } from "@/components/FormInput";
import { useAuth } from "@/providers/AuthProvider";

export default function DocumentsPage() {
  const { user } = useAuth();
  const patientId = useMemo(() => user?.onecId?.trim() || null, [user?.onecId]);

  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [filtered, setFiltered] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTitle, setSearchTitle] = useState("");
  const [searchDate, setSearchDate] = useState("");

  useEffect(() => {
    if (!patientId) {
      setDocs([]);
      setFiltered([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetchDocuments(patientId)
      .then((data) => {
        setDocs(data);
        setFiltered(data);
      })
      .catch((error) => {
        console.warn("Не удалось загрузить документы:", error);
        setDocs([]);
        setFiltered([]);
      })
      .finally(() => setLoading(false));
  }, [patientId]);

  useEffect(() => {
    let res = docs;
    if (searchTitle) {
      const query = searchTitle.toLowerCase();
      res = res.filter((d) => d.title.toLowerCase().includes(query));
    }
    if (searchDate) {
      res = res.filter((d) => d.date === searchDate);
    }
    setFiltered(res);
  }, [searchTitle, searchDate, docs]);

  return (
    <Layout>
      <h1 className="text-2xl font-semibold mb-6 text-primary">Мои исследования</h1>

      <div className="flex flex-col md:flex-row md:space-x-4 mb-6">
        <FormInput
          label="Поиск по названию"
          placeholder="Сертификат, договор..."
          value={searchTitle}
          onChange={(e) => setSearchTitle(e.target.value)}
          className="flex-1"
        />
        <FormInput
          label="Дата документа"
          type="date"
          value={searchDate}
          onChange={(e) => setSearchDate(e.target.value)}
          className="mt-4 md:mt-0"
        />
      </div>

      {loading && <p>Загружаем документы...</p>}
      {!loading && filtered.length === 0 && <p>Документов пока нет.</p>}

      {!loading &&
        filtered.map((doc) => (
          <DocumentCard key={doc.id} doc={doc} />
        ))}
    </Layout>
  );
}
