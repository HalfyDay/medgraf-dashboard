"use client";

import React, { useEffect, useState } from "react";
import { fetchDocuments, DocumentItem } from "@/utils/api";
import { DocumentCard } from "@/components/DocumentCard";
import { Layout } from "@/components/Layout";
import { FormInput } from "@/components/FormInput";

export default function DocumentsPage() {
  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [filtered, setFiltered] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchType, setSearchType] = useState("");
  const [searchDate, setSearchDate] = useState("");

  useEffect(() => {
    fetchDocuments().then(data => {
      setDocs(data);
      setFiltered(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    let res = docs;
    if (searchType) {
      res = res.filter(d =>
        d.type.toLowerCase().includes(searchType.toLowerCase())
      );
    }
    if (searchDate) {
      res = res.filter(d => d.date === searchDate);
    }
    setFiltered(res);
  }, [searchType, searchDate, docs]);

  return (
    <Layout>
      <h1 className="text-2xl font-semibold mb-6 text-primary">Документы</h1>

      <div className="flex flex-col md:flex-row md:space-x-4 mb-6">
        <FormInput
          label="Поиск по типу"
          placeholder="например, кровь"
          value={searchType}
          onChange={e => setSearchType(e.target.value)}
          className="flex-1"
        />
        <FormInput
          label="По дате"
          type="date"
          value={searchDate}
          onChange={e => setSearchDate(e.target.value)}
          className="mt-4 md:mt-0"
        />
      </div>

      {loading && <p>Загрузка документов…</p>}
      {!loading && filtered.length === 0 && (
        <p>Документы не найдены.</p>
      )}

      {!loading && filtered.map(doc => (
        <DocumentCard key={doc.id} doc={doc} />
      ))}
    </Layout>
  );
}
