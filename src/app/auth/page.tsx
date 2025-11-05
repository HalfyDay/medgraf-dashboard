"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { Button } from "@/components/Button";
import { useAuth } from "@/providers/AuthProvider";
import { checkPhoneExists, registerUser } from "@/utils/authClient";
import { extractPhoneDigits, formatPhoneInput, normalizePhone } from "@/utils/phone";
type RegisterStep = "phone" | "passport" | "credentials";
type PassportData = {
  lastName: string;
  firstName: string;
  middleName: string;
  birthDate: string;
  email: string;
  passportLastDigits: string;
};
const MIN_PASSWORD_LENGTH = 8;
const WAVE_LINE_COUNT = 20; // Измените это значение, чтобы увеличить или уменьшить количество волнистых линий. 
const WAVE_STROKE_WIDTH = 5; // Измените это значение, чтобы настроить толщину волнистых линий. 
const WAVE_TOP_OFFSET = -50; // Измените это значение (в пикселях), чтобы переместить волнистые линии выше или ниже относительно верхнего края. 
const WAVE_CONTAINER_HEIGHT = 300; // Измените это значение (в пикселях), чтобы контролировать, сколько места по вертикали занимают волны перед логотипом. 
const WAVE_VIEW_BOX = "0 0 600 240"; // Измените это значение, если вам нужно изменить внутреннюю область рисования волн. 
const WAVE_SVG_HEIGHT = `${WAVE_CONTAINER_HEIGHT}px`; // Измените это значение, чтобы настроить высоту холста SVG. 
const WAVE_ANIMATION_DURATION = 6.9; // Измените это значение (в секундах), чтобы настроить скорость/интенсивность анимации. 
const WAVE_START_Y = -40; // Измените это значение, чтобы поднять или опустить первую волну внутри SVG. 
const WAVE_LINE_STEP = 13; // Измените это значение, чтобы расположить линии волн ближе или дальше друг от друга.
const registerWaveLines = Array.from({ length: WAVE_LINE_COUNT }, (_, index) => {
  const baseY = WAVE_START_Y + index * WAVE_LINE_STEP;
  return `M-40 ${baseY} C 80 ${baseY - 26}, 150 ${baseY + 24}, 260 ${baseY} S 460 ${baseY - 24}, 640 ${baseY}`;
});
const loginWaveLines = registerWaveLines;
function Waves({ variant }: { variant: "register" | "login" }) {
  const lines = variant === "register" ? registerWaveLines : loginWaveLines;
  const viewBox = WAVE_VIEW_BOX;
  const height = WAVE_SVG_HEIGHT;
  const gradientId = variant === "register" ? "waveGradientRegister" : "waveGradientLogin";
  return (
    <div
      className="pointer-events-none absolute inset-x-0 z-0 flex justify-center overflow-hidden"
      style={{ top: WAVE_TOP_OFFSET, height: WAVE_CONTAINER_HEIGHT }}
    >
      <svg viewBox={viewBox} width="100%" height={height} className="max-w-[900px]">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0F8FE9" />
            <stop offset="35%" stopColor="#14B6E8" />
            <stop offset="70%" stopColor="#20C78E" />
            <stop offset="100%" stopColor="#29D079" />
          </linearGradient>
        </defs>
        {lines.map((d, index) => (
          <path
            key={`${variant}-${index}`}
            d={d}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={WAVE_STROKE_WIDTH}
            strokeLinecap="round"
            className="wave-line"
            opacity={0.72 - index * 0.05}
          />
        ))}
      </svg>
      <style jsx>{`
        /* Edit the translateY/skew/scale values below to change animation strength/amplitude. */
        @keyframes wave-breathe {
          0% {
            transform: translateY(-12px) skewX(0deg) scaleY(0.9);
          }
          50% {
            transform: translateY(18px) skewX(8deg) scaleY(1.35);
          }
          100% {
            transform: translateY(-12px) skewX(0deg) scaleY(0.9);
          }
        }
        .wave-line {
          transform-box: fill-box;
          transform-origin: center;
          animation-name: wave-breathe;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
          animation-duration: ${WAVE_ANIMATION_DURATION}s; /* Change this to tweak the animation speed/intensity. */
        }
      `}</style>
    </div>
  );
}
type AuthFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  error?: string;
  maxLength?: number;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  autoComplete?: string;
};
function AuthField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  error,
  maxLength,
  inputMode,
  autoComplete,
}: AuthFieldProps) {
  return (
    <label className="block text-left">
      <span className="mb-1 block text-sm font-medium text-[#2D4F8A]">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        inputMode={inputMode}
        autoComplete={autoComplete}
        className={`h-12 w-full rounded-2xl border border-transparent bg-[#F0F5FF] px-5 text-base text-[#16345A] placeholder:text-[#96A8C4] focus:border-[#1AA4FF] focus:outline-none focus:ring-2 focus:ring-[#66C5FF]/60 ${
          error ? "border-red-400 focus:ring-red-200" : ""
        }`}
      />
      {error && <span className="mt-1 block text-xs font-medium text-red-500">{error}</span>}
    </label>
  );
}
function generateSmsCode() {
  return String(1000 + Math.floor(Math.random() * 9000));
}
function buildFullName({ lastName, firstName, middleName }: PassportData) {
  return [lastName.trim(), firstName.trim(), middleName.trim()].filter(Boolean).join(" ");
}
export default function AuthPage() {
  const router = useRouter();
  const { login, actionPending, setUser } = useAuth();
  const [mode, setMode] = useState<"register" | "login">("register");
  const [registerStep, setRegisterStep] = useState<RegisterStep>("phone");
  const [registerPhoneDigits, setRegisterPhoneDigits] = useState("");
 const [registerPhoneInput, setRegisterPhoneInput] = useState("");
 const [loginPhoneDigits, setLoginPhoneDigits] = useState("");
 const [loginPhoneInput, setLoginPhoneInput] = useState("");
  const [registerErrors, setRegisterErrors] = useState<Record<string, string>>({});
  const [loginError, setLoginError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [passportData, setPassportData] = useState<PassportData>({
    lastName: "",
    firstName: "",
    middleName: "",
    birthDate: "",
    email: "",
    passportLastDigits: "",
  });
  const [smsCode, setSmsCode] = useState("");
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [consent, setConsent] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [loginPassword, setLoginPassword] = useState("");
  const canResendCode = useMemo(
    () => registerStep === "credentials" && Boolean(generatedCode),
    [generatedCode, registerStep],
  );
  const clearRegisterError = (field: string) => {
    setRegisterErrors((prev) => {
      if (!(field in prev)) {
        return prev;
      }
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };
  const handleRegisterPhoneChange = (value: string) => {
    const digits = extractPhoneDigits(value);
    const formatted = digits ? formatPhoneInput(digits) : "";
    const display = formatted || (value.trim().startsWith("+") ? value : "");
    setRegisterPhoneDigits(digits);
    setRegisterPhoneInput(display);
    clearRegisterError("phone");
  };
  const handleLoginPhoneChange = (value: string) => {
    const digits = extractPhoneDigits(value);
    const formatted = digits ? formatPhoneInput(digits) : "";
    const display = formatted || (value.trim().startsWith("+") ? value : "");
    setLoginPhoneDigits(digits);
    setLoginPhoneInput(display);
    setLoginError(null);
  };
  const handlePhoneSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const errors: Record<string, string> = {};
    if (registerPhoneDigits.length !== 10) {
      errors.phone = "Введите номер полностью";
    }
    if (Object.keys(errors).length) {
      setRegisterErrors(errors);
      return;
    }
    try {
      setRegisterLoading(true);
      const exists = await checkPhoneExists(registerPhoneDigits);
      if (exists) {
        setRegisterErrors({ phone: "Такой номер уже зарегистрирован. Войдите по паролю." });
        setMode("login");
        setLoginPhoneDigits(registerPhoneDigits);
        setLoginPhoneInput(formatPhoneInput(registerPhoneDigits));
        setInfoMessage("Мы нашли ваш профиль. Введите пароль для входа.");
        return;
      }
      setRegisterErrors({});
      setRegisterStep("passport");
      setInfoMessage("Подтвердите свои данные, чтобы мы нашли вашу карточку пациента.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Не удалось проверить номер";
      setRegisterErrors({ phone: message });
    } finally {
      setRegisterLoading(false);
    }
  };
  const handlePassportChange = (field: keyof PassportData) => (value: string) => {
    const cleaned = field === "passportLastDigits" ? value.replace(/\D/g, "").slice(0, 3) : value;
    setPassportData((prev) => ({ ...prev, [field]: cleaned }));
    clearRegisterError(field);
  };
  const handlePassportSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const errors: Record<string, string> = {};
    if (!passportData.lastName.trim()) errors.lastName = "Укажите фамилию";
    if (!passportData.firstName.trim()) errors.firstName = "Укажите имя";
    if (!passportData.birthDate) errors.birthDate = "Укажите дату рождения";
    if (passportData.email && !/.+@.+\..+/.test(passportData.email.trim())) {
      errors.email = "Некорректный e-mail";
    }
    if (passportData.passportLastDigits.length !== 3) {
      errors.passportLastDigits = "Введите последние 3 цифры паспорта";
    }
    if (Object.keys(errors).length) {
      setRegisterErrors(errors);
      return;
    }
    setRegisterErrors({});
    setRegisterStep("credentials");
    const code = generateSmsCode();
    setGeneratedCode(code);
    setSmsCode("");
    setPassword("");
    setPasswordConfirm("");
    setConsent(false);
    setInfoMessage(`Мы отправили код подтверждения на ${formatPhoneInput(registerPhoneDigits)}.`);
  };
  const handleResendCode = () => {
    if (!canResendCode) {
      return;
    }
    const code = generateSmsCode();
    setGeneratedCode(code);
    setInfoMessage(`Новый код отправлен на ${formatPhoneInput(registerPhoneDigits)}.`);
  };
  const handleCredentialsSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const errors: Record<string, string> = {};
    if (!generatedCode) {
      errors.smsCode = "Получите код подтверждения";
    } else if (smsCode.trim() !== generatedCode) {
      errors.smsCode = "Неверный код из SMS";
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      errors.password = `Минимум ${MIN_PASSWORD_LENGTH} символов`;
    }
    if (password !== passwordConfirm) {
      errors.passwordConfirm = "Пароли не совпадают";
    }
    if (!consent) {
      errors.consent = "Необходимо согласие";
    }
    if (registerPhoneDigits.length !== 10) {
      errors.phone = "Введите номер полностью";
    }
    if (Object.keys(errors).length) {
      setRegisterErrors(errors);
      return;
    }
    setRegisterErrors({});
    setRegisterLoading(true);
    try {
      const user = await registerUser({
        phone: registerPhoneDigits,
        password,
        fullName: buildFullName(passportData),
        birthDate: passportData.birthDate,
        email: passportData.email.trim() || undefined,
        passportLastDigits: passportData.passportLastDigits,
      });
      setUser(user);
      setInfoMessage("Регистрация выполнена! Перенаправляем в личный кабинет…");
      router.replace("/home");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Не удалось завершить регистрацию";
      setRegisterErrors({ general: message });
    } finally {
      setRegisterLoading(false);
    }
  };
  const handleLoginSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loginPhoneDigits.length !== 10) {
      setLoginError("Введите номер полностью");
      return;
    }
    if (!loginPassword) {
      setLoginError("Введите пароль");
      return;
    }
    const result = await login(normalizePhone(loginPhoneDigits), loginPassword);
    if (!result.success) {
      setLoginError(result.error);
      return;
    }
    router.replace("/home");
  };
  const switchMode = (nextMode: "register" | "login") => {
    setMode(nextMode);
    setInfoMessage(null);
    setRegisterErrors({});
    setLoginError(null);
    if (nextMode === "register") {
      setRegisterStep("phone");
      setRegisterLoading(false);
    }
  };
  return (
    <div className="relative min-h-dvh overflow-hidden bg-[#F4F9FF]">
      <Waves variant={mode === "register" ? "register" : "login"} />
      <div className="relative z-10 mx-auto flex min-h-dvh max-w-[420px] flex-col px-6 pb-12 pt-36">
        <header className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 text-[#0C8FE8]">
            <div className="relative h-16 w-16">
              <Image src="/logo.svg" alt="Клиника МЕДГРАФТ" fill priority />
            </div>
            <div className="text-left">
              <span className="block text-xs font-bold uppercase tracking-[0.2em] text-[#0C8FE8]">
                клиника
              </span>
              <span className="block text-2xl font-extrabold leading-tight text-[#20BD75]">
                МЕДГРАФТ
              </span>
            </div>
          </div>
          <h1 className="mt-8 text-3xl font-bold leading-tight text-[#0173DB]">
            {mode === "register" ? "Войти в личный кабинет пациента" : "Личный кабинет пациента"}
          </h1>
        </header>
        <div className="grow rounded-[28px] bg-white/95 p-6 shadow-[0_18px_45px_rgba(17,130,255,0.18)] backdrop-blur-sm">
          {infoMessage && (
            <div className="mb-5 rounded-2xl bg-[#E6F5FF] px-4 py-3 text-sm text-[#0C8FE8]">
              {infoMessage}
              {canResendCode && generatedCode && (
                <span className="mt-1 block text-xs text-[#0C8FE8]/80">Демонстрационный код: {generatedCode}</span>
              )}
            </div>
          )}
          {mode === "register" ? (
            <div className="space-y-5">
              {registerErrors.general && (
                <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
                  {registerErrors.general}
                </div>
              )}
              {registerStep === "phone" && (
                <form onSubmit={handlePhoneSubmit} className="space-y-5">
                  <AuthField
                    label="Логин"
                    placeholder="+7 (___) ___-__-__"
                    value={registerPhoneInput}
                    onChange={handleRegisterPhoneChange}
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    maxLength={18}
                    error={registerErrors.phone}
                  />
                  <Button type="submit" className="w-full" disabled={registerLoading}>
                    Продолжить
                  </Button>
                </form>
              )}
              {registerStep === "passport" && (
                <form onSubmit={handlePassportSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <AuthField
                      label="Фамилия"
                      value={passportData.lastName}
                      onChange={handlePassportChange("lastName")}
                      placeholder="Иванова"
                      error={registerErrors.lastName}
                    />
                    <AuthField
                      label="Имя"
                      value={passportData.firstName}
                      onChange={handlePassportChange("firstName")}
                      placeholder="Анна"
                      error={registerErrors.firstName}
                    />
                    <AuthField
                      label="Отчество"
                      value={passportData.middleName}
                      onChange={handlePassportChange("middleName")}
                      placeholder="(если есть)"
                    />
                    <AuthField
                      label="Дата рождения"
                      type="date"
                      value={passportData.birthDate}
                      onChange={handlePassportChange("birthDate")}
                      error={registerErrors.birthDate}
                    />
                  </div>
                  <AuthField
                    label="E-mail"
                    type="email"
                    value={passportData.email}
                    onChange={handlePassportChange("email")}
                    placeholder="name@mail.ru"
                    error={registerErrors.email}
                  />
                  <AuthField
                    label="Последние 3 цифры паспорта"
                    value={passportData.passportLastDigits}
                    onChange={handlePassportChange("passportLastDigits")}
                    placeholder="000"
                    maxLength={3}
                    inputMode="numeric"
                    error={registerErrors.passportLastDigits}
                  />
                  <div className="flex items-center gap-3 pt-2">
                    <Button
                      type="button"
                      variant="secondary"
                      className="flex-1"
                      onClick={() => {
                        setRegisterStep("phone");
                        setInfoMessage(null);
                      }}
                    >
                      Назад
                    </Button>
                    <Button type="submit" className="flex-1" disabled={registerLoading}>
                      Далее
                    </Button>
                  </div>
                </form>
              )}
              {registerStep === "credentials" && (
                <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                  <AuthField
                    label="Код из SMS"
                    value={smsCode}
                    onChange={(value) => {
                      setSmsCode(value.replace(/\D/g, "").slice(0, 4));
                      clearRegisterError("smsCode");
                    }}
                    placeholder="проверочный код"
                    maxLength={4}
                    inputMode="numeric"
                    error={registerErrors.smsCode}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleResendCode}
                    disabled={!canResendCode || registerLoading}
                    className="w-full"
                  >
                    Отправить код ещё раз
                  </Button>
                  <AuthField
                    label="Задать пароль"
                    type="password"
                    value={password}
                    onChange={(value) => {
                      setPassword(value);
                      clearRegisterError("password");
                    }}
                    placeholder={`${MIN_PASSWORD_LENGTH} символов`}
                    error={registerErrors.password}
                  />
                  <AuthField
                    label="Повторите пароль"
                    type="password"
                    value={passwordConfirm}
                    onChange={(value) => {
                      setPasswordConfirm(value);
                      clearRegisterError("passwordConfirm");
                    }}
                    placeholder="введите ещё раз"
                    error={registerErrors.passwordConfirm}
                  />
                  <label
                    className={`flex items-start gap-3 rounded-2xl border border-transparent bg-[#EEF6FF] px-4 py-3 text-sm text-[#456388] ${
                      registerErrors.consent ? "border-red-400" : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={consent}
                      onChange={(event) => {
                        setConsent(event.target.checked);
                        clearRegisterError("consent");
                      }}
                      className="mt-1 h-4 w-4 rounded border border-[#98A8C4] text-[#1AA4FF] focus:ring-[#1AA4FF]"
                    />
                    <span>
                      Я даю своё согласие на обработку персональных данных и подтверждаю, что ознакомлен(а) с правилами
                      использования сервиса.
                    </span>
                  </label>
                  <div className="flex items-center gap-3 pt-2">
                    <Button
                      type="button"
                      variant="secondary"
                      className="flex-1"
                      onClick={() => {
                        setRegisterStep("passport");
                        setInfoMessage(null);
                      }}
                    >
                      Назад
                    </Button>
                    <Button type="submit" className="flex-1" disabled={registerLoading}>
                      Зарегистрироваться
                    </Button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <form onSubmit={handleLoginSubmit} className="space-y-5">
              {loginError && (
                <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{loginError}</div>
              )}
              <AuthField
                label="Логин"
                placeholder="+7 (___) ___-__-__"
                value={loginPhoneInput}
                onChange={handleLoginPhoneChange}
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                maxLength={18}
              />
              <AuthField
                label="Пароль"
                type="password"
                placeholder="ввод пароля"
                value={loginPassword}
                onChange={(value) => {
                  setLoginPassword(value);
                  setLoginError(null);
                }}
              />
              <Button type="submit" className="w-full" disabled={actionPending}>
                Войти
              </Button>
              <p className="text-center text-xs text-[#5A719B]">
                Если забыли пароль, обратитесь в клинику для восстановления доступа.
              </p>
            </form>
          )}
        </div>
        <footer className="mt-6 text-center text-sm text-[#456388]">
          {mode === "register" ? (
            <>
              Уже зарегистрированы?
              <button
                type="button"
                className="ml-1 font-semibold text-[#0B8EEA]"
                onClick={() => switchMode("login")}
              >
                Войти
              </button>
            </>
          ) : (
            <>
              Впервые в клинике?
              <button
                type="button"
                className="ml-1 font-semibold text-[#0B8EEA]"
                onClick={() => switchMode("register")}
              >
                Зарегистрироваться
              </button>
            </>
          )}
        </footer>
      </div>
    </div>
  );
}
