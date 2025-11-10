"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { Button } from "@/components/Button";
import { useAuth } from "@/providers/AuthProvider";
import {
  finalizeLoginPassword,
  resendLoginOtp,
  startRemoteLogin,
  verifyLoginOtp,
  verifyPassportDigits,
} from "@/utils/authClient";
import { extractPhoneDigits, formatPhoneInput, normalizePhone } from "@/utils/phone";

type LoginStep = "phone" | "doc" | "password" | "otp" | "setPassword";

const MIN_PASSWORD_LENGTH = 8;
const LOGIN_OTP_LENGTH = 4;

const WAVE_LINE_COUNT = 20; // Increase to render more decorative wave lines.
const WAVE_STROKE_WIDTH = 5; // Thickness of each SVG stroke.
const WAVE_TOP_OFFSET = -50; // Vertical offset for the entire wave block.
const WAVE_CONTAINER_HEIGHT = 300; // Height of the container hosting the waves.
const WAVE_VIEW_BOX = "0 0 600 240"; // Default SVG viewBox.
const WAVE_SVG_HEIGHT = `${WAVE_CONTAINER_HEIGHT}px`; // Explicit SVG height value.
const WAVE_ANIMATION_DURATION = 6.9; // Duration of the breathing animation.
const WAVE_START_Y = -40; // Initial Y coordinate for the first wave line.
const WAVE_LINE_STEP = 13; // Distance between neighbouring wave lines.

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
          animation-duration: ${WAVE_ANIMATION_DURATION}s;
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
      <span className="mb-1 block pl-4 text-sm font-medium text-[#2D4F8A]">{label}</span>
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

export default function AuthPage() {
  const router = useRouter();
  const { login, actionPending, setUser } = useAuth();

  const [loginPhoneDigits, setLoginPhoneDigits] = useState("");
  const [loginPhoneInput, setLoginPhoneInput] = useState("");
  const [loginPassportDigits, setLoginPassportDigits] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [loginStep, setLoginStep] = useState<LoginStep>("phone");
  const [loginSessionId, setLoginSessionId] = useState<string | null>(null);
  const [loginOtpCode, setLoginOtpCode] = useState("");
  const [loginOtpHint, setLoginOtpHint] = useState<string | null>(null);
  const [loginSetupPassword, setLoginSetupPassword] = useState("");
  const [loginSetupPasswordConfirm, setLoginSetupPasswordConfirm] = useState("");
  const [loginStepLoading, setLoginStepLoading] = useState(false);
  const [loginDisplayName, setLoginDisplayName] = useState<string | null>(null);

  const helperName = useMemo(() => {
    if (!loginDisplayName) return null;
    const parts = loginDisplayName.split(/\s+/).filter(Boolean);
    if (!parts.length) return null;
    if (parts.length === 1) return parts[0];
    return `${parts[0]} ${parts[1]}`;
  }, [loginDisplayName]);

  const resetLoginFlow = () => {
    setLoginStep("phone");
    setLoginSessionId(null);
    setLoginOtpCode("");
    setLoginOtpHint(null);
    setLoginSetupPassword("");
    setLoginSetupPasswordConfirm("");
    setLoginPassword("");
    setLoginPassportDigits("");
    setLoginDisplayName(null);
    setLoginError(null);
    setInfoMessage(null);
  };

  const handleLoginPhoneChange = (value: string) => {
    const digits = extractPhoneDigits(value);
    const isDeleting = value.length < loginPhoneInput.length;

    let display: string;
    if (!digits) {
      display = "";
    } else if (isDeleting) {
      display = value;
    } else {
      display = formatPhoneInput(digits);
    }

    setLoginPhoneDigits(digits);
    setLoginPhoneInput(display);
    setLoginError(null);
    setInfoMessage(null);
  };

  const cleanDocDigits = (value: string) => value.replace(/\D/g, "").slice(-3);

  const handleLoginPhoneSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loginPhoneDigits.length !== 10) {
      setLoginError("Введите номер телефона полностью");
      return;
    }
    setLoginError(null);
    setLoginStepLoading(true);
    try {
      const result = await startRemoteLogin(loginPhoneDigits);
      setLoginDisplayName(result.displayName ?? null);
      if (result.hasLocalPassword) {
        setLoginStep("password");
        setInfoMessage(
          result.displayName
            ? `Найдена карточка пациента ${result.displayName}. Введите пароль для входа.`
            : "Введите пароль для входа.",
        );
        setLoginSessionId(null);
        return;
      }
      if (!result.sessionId) {
        throw new Error("Не удалось начать вход");
      }
      setLoginSessionId(result.sessionId);
      setLoginPassportDigits("");
      setLoginStep("doc");
      setInfoMessage("Укажите последние 3 цифры паспорта, чтобы продолжить.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Не удалось проверить номер";
      setLoginError(message);
    } finally {
      setLoginStepLoading(false);
    }
  };

  const handleDocSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!loginSessionId) {
      setLoginError("Сессия не найдена. Начните заново.");
      return;
    }
    const cleaned = cleanDocDigits(loginPassportDigits);
    if (cleaned.length !== 3) {
      setLoginError("Введите последние 3 цифры паспорта");
      return;
    }
    setLoginError(null);
    setLoginStepLoading(true);
    try {
      const result = await verifyPassportDigits(loginSessionId, cleaned);
      setLoginPassportDigits(cleaned);
      setLoginStep("otp");
      setLoginOtpCode("");
      setLoginOtpHint(result.debugCode ?? null);
      setInfoMessage("Мы отправили код подтверждения на ваш номер телефона.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Не удалось подтвердить паспортные данные";
      setLoginError(message);
    } finally {
      setLoginStepLoading(false);
    }
  };

  const handleExistingPasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loginPhoneDigits.length !== 10) {
      setLoginError("Введите номер телефона полностью");
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

  const handleResendLoginCode = async () => {
    if (!loginSessionId) {
      setLoginError("Сессия не найдена. Начните заново.");
      return;
    }
    setLoginError(null);
    setLoginStepLoading(true);
    try {
      const result = await resendLoginOtp(loginSessionId);
      setLoginOtpHint(result.debugCode ?? null);
      setInfoMessage("Новый код отправлен.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Не удалось отправить код";
      setLoginError(message);
    } finally {
      setLoginStepLoading(false);
    }
  };

  const handleOtpSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!loginSessionId) {
      setLoginError("Сессия не найдена. Начните заново.");
      return;
    }
    if (loginOtpCode.length !== LOGIN_OTP_LENGTH) {
      setLoginError("Введите полный код из SMS");
      return;
    }
    setLoginError(null);
    setLoginStepLoading(true);
    try {
      await verifyLoginOtp(loginSessionId, loginOtpCode);
      setLoginStep("setPassword");
      setInfoMessage("Код подтверждён. Придумайте пароль для входа.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Не удалось подтвердить код";
      setLoginError(message);
    } finally {
      setLoginStepLoading(false);
    }
  };

  const handleSetPasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!loginSessionId) {
      setLoginError("Сессия не найдена. Начните заново.");
      return;
    }
    if (loginSetupPassword.length < MIN_PASSWORD_LENGTH) {
      setLoginError(`Пароль должен содержать не менее ${MIN_PASSWORD_LENGTH} символов`);
      return;
    }
    if (loginSetupPassword !== loginSetupPasswordConfirm) {
      setLoginError("Пароли не совпадают");
      return;
    }
    setLoginError(null);
    setLoginStepLoading(true);
    try {
      const user = await finalizeLoginPassword(loginSessionId, loginSetupPassword);
      setUser(user);
      resetLoginFlow();
      router.replace("/home");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Не удалось сохранить пароль";
      setLoginError(message);
    } finally {
      setLoginStepLoading(false);
    }
  };

  return (
    <div className="relative min-h-dvh overflow-hidden bg-[#F4F9FF]">
      <Waves variant="login" />
      <div className="relative z-10 mx-auto flex min-h-dvh max-w-[420px] flex-col px-6 pb-12 pt-36">
        <header className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 text-[#0C8FE8]">
            <div className="relative h-16 w-16">
              <Image src="/logo.svg" alt="Клиника Медграфт" fill priority />
            </div>
            <div className="text-left">
              <span className="block text-sm font-extrabold uppercase tracking-[0.08em] text-[#0C8FE8]">
                Клиника
              </span>
              <span className="block text-2xl font-extrabold leading-tight text-[#20BD75]">
                Медграфт
              </span>
            </div>
          </div>
          <h1 className="mt-8 text-3xl font-bold leading-tight text-[#0173DB]">
            Вход в
            <br />
            Личный кабинет
          </h1>
        </header>

        <div className="grow rounded-[28px] bg-white/95 p-6 shadow-[0_18px_45px_rgba(17,130,255,0.18)] backdrop-blur-sm">
          {infoMessage && (
            <div className="mb-5 rounded-2xl bg-[#E6F5FF] px-4 py-3 text-sm text-[#0C8FE8]">{infoMessage}</div>
          )}
          <div className="space-y-5">
            {loginError && (
              <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{loginError}</div>
            )}

            {loginStep === "phone" && (
              <form onSubmit={handleLoginPhoneSubmit} className="space-y-4">
                <AuthField
                  label="Телефон"
                  placeholder="+7 (___) ___-__-__"
                  value={loginPhoneInput}
                  onChange={handleLoginPhoneChange}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  maxLength={18}
                />
                <Button type="submit" className="w-full" disabled={loginStepLoading}>
                  Продолжить
                </Button>
              </form>
            )}
            {loginStep === "doc" && (
              <form onSubmit={handleDocSubmit} className="space-y-4">
                <AuthField
                  label="Последние 3 цифры паспорта"
                  value={loginPassportDigits}
                  onChange={(value) => {
                    setLoginPassportDigits(cleanDocDigits(value));
                    setLoginError(null);
                  }}
                  placeholder="000"
                  maxLength={3}
                  inputMode="numeric"
                />
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="flex-1 whitespace-nowrap px-3 py-2.5 text-sm"
                    onClick={() => {
                      resetLoginFlow();
                      setLoginPhoneDigits("");
                      setLoginPhoneInput("");
                    }}
                  >
                    Изменить номер
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    className="flex-1 px-3 py-2.5 text-sm"
                    disabled={loginStepLoading}
                  >
                    Подтвердить
                  </Button>
                </div>
              </form>
            )}

            {loginStep === "password" && (
              <form onSubmit={handleExistingPasswordSubmit} className="space-y-4">
                <div className="rounded-2xl bg-[#EEF6FF] px-4 py-3 text-sm text-[#456388]">
                  <p className="font-semibold text-[#16345A]">
                    {helperName ?? "Пациент найден"}
                  </p>
                  <p>{loginPhoneDigits ? formatPhoneInput(loginPhoneDigits) : ""}</p>
                </div>
                <AuthField
                  label="Пароль"
                  type="password"
                  placeholder="Введите пароль"
                  value={loginPassword}
                  onChange={(value) => {
                    setLoginPassword(value);
                    setLoginError(null);
                  }}
                />
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    className="flex-1 whitespace-nowrap px-4"
                    onClick={() => {
                      resetLoginFlow();
                      setLoginPhoneDigits("");
                      setLoginPhoneInput("");
                      setLoginPassportDigits("");
                    }}
                  >
                    Изменить номер
                  </Button>
                  <Button type="submit" className="flex-1" disabled={actionPending}>
                    Войти
                  </Button>
                </div>
              </form>
            )}

            {loginStep === "otp" && (
              <form onSubmit={handleOtpSubmit} className="space-y-4">
                <AuthField
                  label="Код из SMS"
                  value={loginOtpCode}
                  onChange={(value) => {
                    setLoginOtpCode(value.replace(/\D/g, "").slice(0, LOGIN_OTP_LENGTH));
                    setLoginError(null);
                  }}
                  placeholder="Введите код"
                  maxLength={LOGIN_OTP_LENGTH}
                  inputMode="numeric"
                />
                {loginOtpHint && (
                  <p className="text-xs text-[#5A719B]">Тестовый код: {loginOtpHint}</p>
                )}
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="flex-1 whitespace-nowrap py-2.5"
                    onClick={handleResendLoginCode}
                    disabled={loginStepLoading}
                  >
                    Отправить снова
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    className="flex-1 py-2.5"
                    disabled={loginStepLoading}
                  >
                    Подтвердить
                  </Button>
                </div>
              </form>
            )}

            {loginStep === "setPassword" && (
              <form onSubmit={handleSetPasswordSubmit} className="space-y-4">
                <AuthField
                  label="Придумайте пароль"
                  type="password"
                  value={loginSetupPassword}
                  onChange={(value) => {
                    setLoginSetupPassword(value);
                    setLoginError(null);
                  }}
                  placeholder={`${MIN_PASSWORD_LENGTH} символов`}
                />
                <AuthField
                  label="Повторите пароль"
                  type="password"
                  value={loginSetupPasswordConfirm}
                  onChange={(value) => {
                    setLoginSetupPasswordConfirm(value);
                    setLoginError(null);
                  }}
                  placeholder="Введите ещё раз"
                />
                <Button type="submit" className="w-full" disabled={loginStepLoading}>
                  Сохранить пароль
                </Button>
              </form>
            )}

            <p className="text-center text-xs text-[#5A719B]">
              Если не получается войти, свяжитесь со службой поддержки клиники.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
