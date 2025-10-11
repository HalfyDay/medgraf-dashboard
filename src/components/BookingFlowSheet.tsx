"use client";
/* eslint-disable @next/next/no-img-element */

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type PointerEvent as ReactPointerEvent,
  type TouchEvent as ReactTouchEvent,
} from "react";
import clsx from "clsx";
import SheetFrame from "@/components/SheetFrame";
import {
  fetchDoctors,
  fetchDoctorSchedule,
  bookAppointment,
  type Appointment,
  type BookAppointmentPayload,
  type Doctor,
  type DoctorScheduleDay,
  type DoctorScheduleSlot,
} from "@/utils/api";

type BookingFlowStep = "doctor" | "date" | "time";

type BookingFlowSheetProps = {
  open: boolean;
  onClose: () => void;
  onBooked?: (appointment: Appointment) => void;
};

const STEP_META: Record<
  BookingFlowStep,
  { title: string; subtitle: string; icon: string; actionLabel: string }
> = {
  doctor: {
    title: "Выберите специалиста",
    subtitle: "Свободные дни",
    icon: "/doctor.svg",
    actionLabel: "Далее",
  },
  date: {
    title: "Запись на приём",
    subtitle: "Выберите день",
    icon: "/date.svg",
    actionLabel: "Далее",
  },
  time: {
    title: "Запись на приём",
    subtitle: "Выберите свободный слот",
    icon: "/date.svg",
    actionLabel: "Записаться",
  },
};

const WEEKDAYS_SHORT = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

const formatMoney = (amount: number) =>
  `${amount.toLocaleString("ru-RU")} ₽`;

const toIsoDate = (year: number, monthIndex: number, day: number) =>
  [
    year,
    (monthIndex + 1).toString().padStart(2, "0"),
    day.toString().padStart(2, "0"),
  ].join("-");

const buildCalendarCells = (
  year: number,
  monthIndex: number,
  availableSet: Set<string>,
) => {
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const firstDay = new Date(year, monthIndex, 1);
  const offset = (firstDay.getDay() + 6) % 7; // Monday as first day
  const cells: Array<{ dateIso: string | null; dayLabel: string }> = [];

  for (let i = 0; i < offset; i += 1) {
    cells.push({ dateIso: null, dayLabel: "" });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const iso = toIsoDate(year, monthIndex, day);
    cells.push({ dateIso: iso, dayLabel: day.toString() });
  }

  while (cells.length % 7 !== 0) {
    cells.push({ dateIso: null, dayLabel: "" });
  }

  return cells.map((cell) => ({
    ...cell,
    available: cell.dateIso ? availableSet.has(cell.dateIso) : false,
  }));
};

const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);

const addMonths = (date: Date, delta: number) =>
  new Date(date.getFullYear(), date.getMonth() + delta, 1);

const compareMonths = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear()
    ? a.getMonth() - b.getMonth()
    : a.getFullYear() - b.getFullYear();

const monthTitle = (date: Date | null) =>
  date
    ? date.toLocaleDateString("ru-RU", { month: "long", year: "numeric" })
    : "";

const formatTime = (slot: DoctorScheduleSlot) =>
  new Date(slot.start).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });

const formatLongDate = (isoDate: string) => {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(year, (month ?? 1) - 1, day ?? 1);
  return date.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const formatDoctorShortName = (fullName: string) => {
  const parts = fullName
    .split(/\s+/)
    .map((item) => item.trim())
    .filter(Boolean);
  if (parts.length === 0) {
    return fullName;
  }
  const [surname, firstName] = parts;
  const initial = firstName?.[0];
  return initial ? `${surname} ${initial}.` : surname;
};

type HorizontalHandlers = {
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onTouchStart: (event: ReactTouchEvent<HTMLDivElement>) => void;
  onTouchMove: (event: ReactTouchEvent<HTMLDivElement>) => void;
};

const createHorizontalHandlers = (): HorizontalHandlers => {
  const stopPointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.stopPropagation();
  };
  const stopTouch = (event: ReactTouchEvent<HTMLDivElement>) => {
    event.stopPropagation();
  };
  return {
    onPointerDown: stopPointer,
    onPointerMove: stopPointer,
    onTouchStart: stopTouch,
    onTouchMove: stopTouch,
  };
};

export default function BookingFlowSheet({
  open,
  onClose,
  onBooked,
}: BookingFlowSheetProps) {
  const [step, setStep] = useState<BookingFlowStep>("doctor");

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [doctorsLoading, setDoctorsLoading] = useState(false);
  const [doctorsError, setDoctorsError] = useState<string | null>(null);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(
    null,
  );
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);

  const [schedule, setSchedule] = useState<DoctorScheduleDay[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);

  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);

  const [monthCursor, setMonthCursor] = useState<Date | null>(null);
  const [monthMin, setMonthMin] = useState<Date | null>(null);
  const [monthMax, setMonthMax] = useState<Date | null>(null);

  const horizontalHandlers = useMemo(() => createHorizontalHandlers(), []);
  const horizontalStyle = useMemo(() => ({ touchAction: "pan-x" as const }), []);

  const resetState = useCallback(() => {
    setStep("doctor");
    setDoctors([]);
    setDoctorsLoading(false);
    setDoctorsError(null);
    setSelectedSpecialty(null);
    setSelectedDoctorId(null);
    setSchedule([]);
    setScheduleLoading(false);
    setScheduleError(null);
    setSelectedDate(null);
    setSelectedSlotId(null);
    setBookingError(null);
    setBookingLoading(false);
    setMonthCursor(null);
    setMonthMin(null);
    setMonthMax(null);
  }, []);

  useEffect(() => {
    if (!open) {
      resetState();
      return;
    }

    let mounted = true;
    setDoctorsLoading(true);
    setDoctorsError(null);
    fetchDoctors()
      .then((list) => {
        if (!mounted) return;
        setDoctors(list);
        if (list.length > 0) {
          setSelectedSpecialty(list[0].category);
        }
      })
      .catch(() => {
        if (!mounted) return;
        setDoctorsError("Не удалось загрузить список врачей. Попробуйте позже.");
      })
      .finally(() => {
        if (!mounted) return;
        setDoctorsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [open, resetState]);

  useEffect(() => {
    if (doctors.length === 0 || selectedSpecialty) return;
    setSelectedSpecialty(doctors[0].category);
  }, [doctors, selectedSpecialty]);

  const specialties = useMemo(() => {
    const unique = new Set(doctors.map((doctor) => doctor.category));
    return Array.from(unique);
  }, [doctors]);

  const filteredDoctors = useMemo(
    () =>
      selectedSpecialty
        ? doctors.filter((doctor) => doctor.category === selectedSpecialty)
        : doctors,
    [doctors, selectedSpecialty],
  );

  useEffect(() => {
    if (filteredDoctors.length === 0) {
      setSelectedDoctorId(null);
      return;
    }

    if (!selectedDoctorId) {
      setSelectedDoctorId(filteredDoctors[0].id);
      return;
    }

    if (!filteredDoctors.some((doctor) => doctor.id === selectedDoctorId)) {
      setSelectedDoctorId(filteredDoctors[0].id);
    }
  }, [filteredDoctors, selectedDoctorId]);

  useEffect(() => {
    if (!open || !selectedDoctorId) return;

    let mounted = true;
    setScheduleLoading(true);
    setScheduleError(null);
    setSchedule([]);
    setSelectedDate(null);
    setSelectedSlotId(null);
    setMonthCursor(null);
    setMonthMin(null);
    setMonthMax(null);

    fetchDoctorSchedule(selectedDoctorId)
      .then((data) => {
        if (!mounted) return;
        setSchedule(data);
      })
      .catch(() => {
        if (!mounted) return;
        setScheduleError(
          "Не удалось получить свободные даты. Попробуйте выбрать врача позже.",
        );
      })
      .finally(() => {
        if (!mounted) return;
        setScheduleLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [open, selectedDoctorId]);

  const availableDates = useMemo(() => {
    const list = schedule.map((day) => day.date);
    return [...list].sort();
  }, [schedule]);

  const availableSet = useMemo(
    () => new Set(schedule.map((day) => day.date)),
    [schedule],
  );

  useEffect(() => {
    if (schedule.length === 0) return;
    setSelectedDate((prev) => {
      if (prev && schedule.some((day) => day.date === prev)) {
        return prev;
      }
      return schedule[0].date;
    });
  }, [schedule]);

  useEffect(() => {
    if (!open) return;
    if (schedule.length === 0) {
      const today = startOfMonth(new Date());
      setMonthCursor(today);
      setMonthMin(today);
      setMonthMax(addMonths(today, 11));
      return;
    }

    const sortedDates = [...schedule]
      .map((day) => new Date(day.date))
      .sort((a, b) => a.getTime() - b.getTime());

    const today = startOfMonth(new Date());
    const earliest = startOfMonth(sortedDates[0]);
    const initial =
      compareMonths(earliest, today) < 0 ? today : earliest;
    const min = today;
    const max = addMonths(today, 11);

    setMonthCursor(initial);
    setMonthMin(min);
    setMonthMax(max);
  }, [open, schedule]);

  useEffect(() => {
    if (!selectedDate) return;
    const [yearStr, monthStr] = selectedDate.split("-");
    const year = Number(yearStr);
    const month = Number(monthStr) - 1;
    if (Number.isNaN(year) || Number.isNaN(month)) return;
    const target = startOfMonth(new Date(year, month, 1));

    let next = target;
    if (monthMin && compareMonths(next, monthMin) < 0) {
      next = monthMin;
    }
    if (monthMax && compareMonths(next, monthMax) > 0) {
      next = monthMax;
    }

    if (!monthCursor || compareMonths(next, monthCursor) !== 0) {
      setMonthCursor(next);
    }
  }, [selectedDate, monthCursor, monthMin, monthMax]);

  const calendarCells = useMemo(() => {
    if (!monthCursor) return [];
    const year = monthCursor.getFullYear();
    const monthIndex = monthCursor.getMonth();
    return buildCalendarCells(year, monthIndex, availableSet);
  }, [monthCursor, availableSet]);

  const slotsForSelectedDate = useMemo<DoctorScheduleSlot[]>(() => {
    if (!selectedDate) return [];
    return schedule.find((day) => day.date === selectedDate)?.slots ?? [];
  }, [schedule, selectedDate]);

  const canProceedDoctor = Boolean(selectedDoctorId);
  const canProceedDate = Boolean(selectedDate);
  const canConfirm = Boolean(selectedSlotId) && !bookingLoading;

  const handleBack = () => {
    if (step === "date") {
      setStep("doctor");
    } else if (step === "time") {
      setStep("date");
    }
  };

  const handlePrimaryAction = async () => {
    if (step === "doctor") {
      if (canProceedDoctor) {
        setStep("date");
      }
      return;
    }

    if (step === "date") {
      if (canProceedDate) {
        setStep("time");
      }
      return;
    }

    if (!selectedDoctorId || !selectedSlotId) return;
    setBookingLoading(true);
    setBookingError(null);
    const payload: BookAppointmentPayload = {
      doctorId: selectedDoctorId,
      slotId: selectedSlotId,
    };

    try {
      const appointment = await bookAppointment(payload);
      onBooked?.(appointment);
      onClose();
    } catch {
      setBookingError("Не удалось создать запись. Попробуйте снова.");
    } finally {
      setBookingLoading(false);
    }
  };

  const handleSelectDate = (dateIso: string) => {
    setSelectedDate(dateIso);
    setSelectedSlotId(null);
  };

  const handleShiftDate = (direction: "prev" | "next") => {
    if (!selectedDate) return;
    const index = availableDates.indexOf(selectedDate);
    if (index === -1) return;
    const target =
      direction === "prev"
        ? availableDates[index - 1]
        : availableDates[index + 1];
    if (target) {
      setSelectedDate(target);
      setSelectedSlotId(null);
    }
  };

  const handleShiftMonth = (direction: "prev" | "next") => {
    if (!monthCursor) return;
    const delta = direction === "prev" ? -1 : 1;
    const next = addMonths(monthCursor, delta);
    if (monthMin && compareMonths(next, monthMin) < 0) return;
    if (monthMax && compareMonths(next, monthMax) > 0) return;
    setMonthCursor(next);
  };

  const renderDoctorsStep = () => (
      <div className="mt-1 space-y-4 pb-3">

      {specialties.length > 0 && (
        <div
          className="-mx-4 mt-1 overflow-x-auto px-4 pb-1 no-scrollbar"
          data-allow-horizontal-scroll="true"
          style={horizontalStyle}
          {...horizontalHandlers}
        >
          <div className="flex w-max gap-2 pr-4">
            {specialties.map((item) => {
              const active = item === selectedSpecialty;
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setSelectedSpecialty(item)}
                  className={clsx(
                    "flex-none rounded-full px-5 py-1.5 text-[15px] font-semibold transition-colors",
                    active
                      ? "bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                  )}
                  aria-pressed={active}
                >
                  {item}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {doctorsLoading && (
        <div className="rounded-[18px] bg-slate-100/90 px-5 py-6 text-center text-[15px] text-slate-600">
          Загружаем специалистов…
        </div>
      )}

      {doctorsError && (
        <div className="rounded-[18px] bg-rose-50 px-5 py-4 text-center text-[15px] text-rose-600">
          {doctorsError}
        </div>
      )}

      {!doctorsLoading && !doctorsError && filteredDoctors.length === 0 && (
        <div className="rounded-[18px] bg-slate-100/90 px-5 py-6 text-center text-[15px] text-slate-600">
          Для этой специализации пока нет доступных врачей.
        </div>
      )}

      <div
        className="-mx-4 mt-2 overflow-x-auto px-4 pb-4 pt-2 no-scrollbar"
        data-allow-horizontal-scroll="true"
        style={horizontalStyle}
        {...horizontalHandlers}
      >
        <div className="-mx-2 flex w-max gap-3 px-2 pb-2 pr-4">
          {filteredDoctors.map((doctor) => {
            const selected = doctor.id === selectedDoctorId;
            return (
              <button
                key={doctor.id}
                type="button"
                onClick={() => setSelectedDoctorId(doctor.id)}
                className={clsx(
                  "min-w-[240px] shrink-0 rounded-[24px] bg-white text-left transition-all duration-150 active:translate-y-[1px]",
                  selected
                    ? "shadow-xl ring-2 ring-sky-400"
                    : "shadow-sm ring-1 ring-slate-200 hover:ring-sky-200",
                )}
                aria-pressed={selected}
              >
                <div className="relative h-48 overflow-hidden rounded-[22px] bg-slate-100">
                  <img
                    src={doctor.photoUrl}
                    alt=""
                    className="h-full w-full object-cover object-top"
                  />
                  {doctor.isAvailable && (
                    <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[12px] font-semibold text-sky-600 shadow">
                      <span className="inline-block h-2 w-2 rounded-full bg-sky-500" />
                      Доступен
                    </span>
                  )}
                </div>

                <div className="space-y-3 px-4 pb-4 pt-3">
                  <div className="space-y-1.5">
                    <div className="flex items-baseline justify-between gap-1.5">
                      <p className="text-[17px] font-semibold leading-tight text-slate-900">
                        {formatDoctorShortName(doctor.fullName)}
                      </p>
                      <span className="inline-flex items-center gap-1 text-[15px] font-semibold text-amber-500">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          className="shrink-0"
                          aria-hidden="true"
                        >
                          <path
                            d="m12 2.75 2.31 5.41 5.94.5-4.52 3.84 1.38 5.78L12 15.8l-5.11 2.48 1.38-5.78-4.52-3.84 5.94-.5L12 2.75Z"
                            stroke="currentColor"
                            strokeWidth="1.4"
                            strokeLinejoin="round"
                          />
                        </svg>
                        {doctor.rating.toFixed(1)}
                      </span>
                    </div>
                    <p className="text-[14px] font-medium text-slate-500">
                      {doctor.specialty}
                    </p>
                  </div>

                  <div className="text-[14px] font-semibold text-rose-500">
                    {formatMoney(doctor.price)} · {doctor.pricePeriod}
                  </div>

                  <div className="rounded-[16px] bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-2 text-center text-[15px] font-semibold text-white shadow">
                    {selected ? "Выбрано" : "Записаться"}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderCalendarStep = () => {
    const canGoPrev =
      monthCursor && monthMin ? compareMonths(monthCursor, monthMin) > 0 : false;
    const canGoNext =
      monthCursor && monthMax ? compareMonths(monthCursor, monthMax) < 0 : false;

    return (
      <div className="space-y-4">
        {scheduleLoading && (
          <div className="rounded-[18px] bg-slate-100/90 px-5 py-6 text-center text-[15px] text-slate-600">
            Загружаем свободные даты…
          </div>
        )}

        {scheduleError && (
          <div className="rounded-[18px] bg-rose-50 px-5 py-4 text-center text-[15px] text-rose-600">
            {scheduleError}
          </div>
        )}

        {!scheduleLoading && !scheduleError && schedule.length === 0 && (
          <div className="rounded-[18px] bg-slate-100/90 px-5 py-6 text-center text-[15px] text-slate-600">
            У выбранного врача пока нет свободных дат для записи.
          </div>
        )}

        {calendarCells.length > 0 && (
          <div className="rounded-[24px] bg-white px-4 py-4 shadow-sm ring-1 ring-slate-200">
            <div className="mb-3 flex items-center justify-between text-[15px] font-semibold text-slate-700">
              <button
                type="button"
                onClick={() => handleShiftMonth("prev")}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
                disabled={!canGoPrev}
                aria-label="Предыдущий месяц"
              >
                ‹
              </button>
              <span className="text-[16px] capitalize">
                {monthTitle(monthCursor)}
              </span>
              <button
                type="button"
                onClick={() => handleShiftMonth("next")}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
                disabled={!canGoNext}
                aria-label="Следующий месяц"
              >
                ›
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-[12px] font-semibold text-slate-400">
              {WEEKDAYS_SHORT.map((day) => (
                <span key={day} className="py-1">
                  {day}
                </span>
              ))}
            </div>

            <div className="mt-2 grid grid-cols-7 gap-1.5">
            {calendarCells.map(({ dateIso, dayLabel, available }) => {
              if (!dateIso) {
                return (
                  <span
                    key={`empty-${dayLabel}-${Math.random()}`}
                      className="h-10 rounded-full"
                    />
                  );
              }

              const selected = selectedDate === dateIso;
              return (
                <button
                  key={dateIso}
                  type="button"
                  onClick={() => {
                    if (available) handleSelectDate(dateIso);
                  }}
                  className={clsx(
                    "h-11 rounded-full text-[15px] font-semibold transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500",
                    available
                      ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        : "cursor-default bg-slate-50 text-slate-400",
                    selected &&
                      "bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md hover:from-sky-500 hover:to-blue-600",
                  )}
                  disabled={!available}
                >
                  {dayLabel}
                </button>
              );
            })}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderTimeStep = () => (
    <div className="space-y-4">
      {selectedDate && (
        <div className="flex items-center justify-between rounded-[16px] bg-white px-4 py-3 text-[15px] font-semibold text-slate-600 shadow-sm ring-1 ring-slate-200">
          <button
            type="button"
            onClick={() => handleShiftDate("prev")}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 disabled:opacity-40"
            disabled={availableDates.indexOf(selectedDate) <= 0}
            aria-label="Предыдущий день"
          >
            ‹
          </button>
          <span>{formatLongDate(selectedDate)}</span>
          <button
            type="button"
            onClick={() => handleShiftDate("next")}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 disabled:opacity-40"
            disabled={
              availableDates.indexOf(selectedDate) ===
              availableDates.length - 1
            }
            aria-label="Следующий день"
          >
            ›
          </button>
        </div>
      )}

      {slotsForSelectedDate.length === 0 && (
        <div className="rounded-[18px] bg-slate-100/90 px-5 py-6 text-center text-[15px] text-slate-600">
          На выбранную дату свободных слотов нет. Выберите другой день.
        </div>
      )}

      {slotsForSelectedDate.length > 0 && (
        <div className="grid grid-cols-3 gap-2 max-[360px]:grid-cols-2">
          {slotsForSelectedDate.map((slot) => {
            const selected = slot.id === selectedSlotId;
            return (
              <button
                key={slot.id}
                type="button"
                onClick={() => setSelectedSlotId(slot.id)}
                className={clsx(
                  "rounded-[14px] px-3 py-2 text-[15px] font-semibold transition-colors active:translate-y-[1px]",
                  selected
                    ? "bg-sky-500 text-white shadow"
                    : "bg-white text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-100",
                )}
              >
                {formatTime(slot)}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );

  const meta = STEP_META[step];
  const showBack = step !== "doctor";
  const stepNumber = step === "doctor" ? 1 : step === "date" ? 2 : 3;
  const STEP_BAR_LABEL: Record<BookingFlowStep, string> = {
    doctor: "Врачи клиники",
    date: "Выберите день",
    time: "Выберите время",
  };
  const currentBarLabel = STEP_BAR_LABEL[step];

  return (
    <SheetFrame
      open={open}
      onClose={onClose}
      title={meta.title}
      subtitle={meta.subtitle}
      iconSrc={meta.icon}
      initialVH={92}
      maxVH={100}
      innerClassName="space-y-5 pb-6"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-[13px] font-semibold text-slate-400">
            Шаг {stepNumber} из 3
          </span>
          <span className="text-[15px] font-semibold text-slate-600">
            {currentBarLabel}
          </span>
        </div>
        {showBack && (
          <button
            type="button"
            onClick={handleBack}
            className="text-[13px] font-semibold text-sky-600 transition-colors hover:text-sky-700"
          >
            Назад
          </button>
        )}
      </div>

      {step === "doctor" && renderDoctorsStep()}
      {step === "date" && renderCalendarStep()}
      {step === "time" && renderTimeStep()}

      {bookingError && (
        <div className="rounded-[16px] bg-rose-50 px- py-3 text-[14px] font-medium text-rose-600">
          {bookingError}
        </div>
      )}

      <div className="mt-3">
        <button
          type="button"
          onClick={handlePrimaryAction}
          disabled={
            (step === "doctor" && !canProceedDoctor) ||
            (step === "date" && !canProceedDate) ||
            (step === "time" && !canConfirm)
          }
          className={clsx(
            "block w-full rounded-[16px] bg-gradient-to-r from-sky-500 to-blue-600 px-6 py-3 text-[17px] font-semibold text-white shadow-lg transition-transform active:translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-50",
            bookingLoading && "pointer-events-none opacity-60",
          )}
        >
          {bookingLoading ? "Отправляем…" : meta.actionLabel}
        </button>
      </div>
    </SheetFrame>
  );
}
