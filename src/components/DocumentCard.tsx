"use client";

import React from "react";
import { DocumentItem } from "@/utils/api";
import { Button } from "./Button";
import { FiFileText } from "react-icons/fi";

interface Props {
  doc: DocumentItem;
}

export const DocumentCard: React.FC<Props> = ({ doc }) => {
  return (
    <div className="p-4 bg-white rounded shadow flex items-center justify-between mb-4">
      <div className="flex items-center">
        <FiFileText className="text-2xl text-primary mr-4" />
        <div>
          <h3 className="text-lg font-medium text-text">{doc.type}</h3>
          <p className="text-sm text-gray-600">
            {new Date(doc.date).toLocaleDateString("ru-RU", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
      </div>
      <a href={doc.url} target="_blank" rel="noopener noreferrer">
        <Button variant="secondary">Скачать PDF</Button>
      </a>
    </div>
  );
};
