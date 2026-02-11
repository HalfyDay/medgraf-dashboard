"use client";

import SheetFrame from "@/components/SheetFrame";
import AppImage from "@/components/AppImage";
import type { ContractItem } from "@/utils/api";

type ContractsSheetProps = {
  open: boolean;
  onClose: () => void;
  contracts: ContractItem[];
  loading?: boolean;
};

function formatDate(dateIso: string) {
  const date = new Date(dateIso);
  if (Number.isNaN(date.getTime())) {
    return dateIso || "—";
  }
  return date.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

const CARD_GRADIENT = "from-sky-500 to-blue-600";

export default function ContractsSheet({
  open,
  onClose,
  contracts,
  loading = false,
}: ContractsSheetProps) {
  const hasContracts = contracts.length > 0;

  const handleDownload = (item: ContractItem) => {
    window.location.href = item.downloadUrl;
  };

  return (
    <SheetFrame
      open={open}
      onClose={onClose}
      title="Документы"
      subtitle="Подписанные вами документы"
      iconSrc="/list.svg"
      innerClassName="space-y-4"
    >
      {loading && (
        <div className="rounded-[18px] bg-slate-100/80 px-5 py-6 text-center text-[15px] text-slate-600 dark:bg-slate-900/70 dark:text-slate-300">
          Загружаем список документов...
        </div>
      )}

      {!loading && !hasContracts && (
        <div className="rounded-[18px] bg-slate-100/90 px-5 py-6 text-center text-[15px] text-slate-600 dark:bg-slate-900/70 dark:text-slate-300">
          Подписанные документы пока отсутствуют.
        </div>
      )}

      {!loading && hasContracts && (
        <div className="space-y-3">
          {contracts.map((item) => (
            <button
              key={item.uid}
              type="button"
              onClick={() => handleDownload(item)}
              className={[
                "relative flex w-full items-center gap-3 rounded-[20px] bg-gradient-to-r px-4 py-4 text-left shadow-lg ring-1 ring-black/5 transition-transform active:translate-y-[1px]",
                CARD_GRADIENT,
                "text-white",
              ].join(" ")}
            >
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-[14px] bg-white/15">
                <AppImage src="/list.svg" alt="" width={48} height={48} className="h-12 w-12" />
              </span>

              <div className="min-w-0 flex-1 leading-tight">
                <div className="truncate text-[17px] font-semibold">{item.title}</div>
                <div className="mt-1 text-[14px] text-white/90">{formatDate(item.date)}</div>
              </div>

              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center">
                <AppImage
                  src="/download.svg"
                  alt=""
                  width={22}
                  height={22}
                  className="h-[22px] w-[22px] opacity-100 brightness-0 invert"
                />
              </span>
            </button>
          ))}
        </div>
      )}
    </SheetFrame>
  );
}
