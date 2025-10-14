"use client";

const MAIN_CARD_INFO = [
  {
    label: "\u0424\u0418\u041E",
    value: "\u0418\u0432\u0430\u043D\u043E\u0432 \u0418\u0432\u0430\u043D \u0418\u0432\u0430\u043D\u043E\u0432\u0438\u0447",
  },
  {
    label: "\u041D\u043E\u043C\u0435\u0440 \u0422\u0435\u043B\u0435\u0444\u043E\u043D\u0430",
    value: "+7 (987) 545 54 54",
  },
  {
    label: "\u041F\u043E\u0447\u0442\u0430",
    value: "\u0414\u043E\u043F\u0438\u0441\u0430\u0442\u044C",
  },
];

const PATIENTS = [
  {
    title: "\u041F\u0430\u0446\u0438\u0435\u043D\u0442 \u21161",
    data: [
      {
        label: "\u0424\u0418\u041E",
        value: "\u0418\u0432\u0430\u043D\u043E\u0432\u0430 \u0415\u043B\u0435\u043D\u0430 \u041F\u0435\u0442\u0440\u043E\u0432\u043D\u0430",
      },
      {
        label: "\u041D\u043E\u043C\u0435\u0440 \u041A\u0430\u0440\u0442\u044B",
        value: "957496-7548965-76",
      },
      {
        label: "\u0414\u0430\u0442\u0430 \u0420\u043E\u0436\u0434\u0435\u043D\u0438\u044F",
        value: "12.04.1995",
      },
      {
        label: "\u0420\u043E\u0434\u0441\u0442\u0432\u0435\u043D\u043D\u0430\u044F \u0421\u0432\u044F\u0437\u044C",
        value: "\u0421\u0443\u043F\u0440\u0443\u0433\u0430",
      },
    ],
  },
  {
    title: "\u041F\u0430\u0446\u0438\u0435\u043D\u0442 \u21162",
    data: [
      {
        label: "\u0424\u0418\u041E",
        value: "\u0418\u0432\u0430\u043D\u043E\u0432 \u041C\u0430\u043A\u0441\u0438\u043C \u0418\u0432\u0430\u043D\u043E\u0432\u0438\u0447",
      },
      {
        label: "\u041D\u043E\u043C\u0435\u0440 \u041A\u0430\u0440\u0442\u044B",
        value: "957496-7548965-77",
      },
      {
        label: "\u0414\u0430\u0442\u0430 \u0420\u043E\u0436\u0434\u0435\u043D\u0438\u044F",
        value: "06.09.2015",
      },
      {
        label: "\u0420\u043E\u0434\u0441\u0442\u0432\u0435\u043D\u043D\u0430\u044F \u0421\u0432\u044F\u0437\u044C",
        value: "\u0421\u044B\u043D",
      },
    ],
  },
];

export default function CardPage() {
  return (
    <div className="min-h-dvh flex flex-col bg-[#EEF3FF]">
      <main className="flex-1">
        <div className="mx-auto max-w-[420px] px-5 py-10">
          <div className="rounded-[32px] bg-gradient-to-r from-[#0F99FF] via-[#28D07C] to-[#0F99FF] p-[1px] shadow-[0_18px_40px_rgba(40,160,255,0.35)]">
            <div className="rounded-[32px] bg-gradient-to-r from-[#0D7BFF] via-[#20C269] to-[#28D07C] px-6 pt-7 pb-14 text-white">
              <div className="flex items-center gap-4 -translate-y-2">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
                  <img src="/list.svg" alt="" className="h-12 w-12" />
                </div>
                <div className="-mt-1">
                  <h1 className="text-2xl font-semibold leading-tight">
                    {"\u041C\u043E\u044F \u043C\u0435\u0434\u043A\u0430\u0440\u0442\u0430"}
                  </h1>
                </div>
              </div>
            </div>
          </div>

          <div className="-mt-14 space-y-6">
            <section className="rounded-[28px] bg-white p-6 shadow-[0_18px_50px_rgba(14,74,166,0.12)]">
              <header className="flex items-center justify-between">
                <div>
                  <p className="text-base font-semibold text-neutral-800">
                    {"\u041C\u0435\u0434\u043A\u0430\u0440\u0442\u0430:"}
                  </p>
                  <ul className="mt-3 space-y-2 text-sm text-neutral-700">
                    {MAIN_CARD_INFO.map((item) => (
                      <li key={item.label}>
                        <span className="font-semibold text-neutral-800">
                          {item.label}
                        </span>{" "}
                        <span className="font-medium text-neutral-600">{item.value}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center text-[#0F86FF] transition hover:text-[#0C6FD9]"
                  aria-label="\u0421\u043A\u0430\u0447\u0430\u0442\u044C \u043C\u0435\u0434\u043A\u0430\u0440\u0442\u0443"
                >
                  <img src="/download.svg" alt="" className="h-5 w-5" />
                </button>
              </header>
              <div className="mt-6 h-px w-full bg-[#E9EDF8]" />
              <div className="mt-6 space-y-6">
                {PATIENTS.map((patient, index) => (
                  <article key={patient.title}>
                    <h2 className="text-base font-semibold text-neutral-800">
                      {patient.title}
                    </h2>
                    <ul className="mt-3 space-y-2 text-sm text-neutral-700">
                      {patient.data.map((item) => (
                        <li key={item.label}>
                          <span className="font-semibold text-neutral-800">
                            {item.label}
                          </span>{" "}
                          <span className="font-medium text-neutral-600">
                            {item.value}
                          </span>
                        </li>
                      ))}
                    </ul>
                    {index < PATIENTS.length - 1 && (
                      <div className="mt-5 h-px w-full bg-[#E9EDF8]" />
                    )}
                  </article>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>

      <div className="h-20 md:h-24" />
    </div>
  );
}
