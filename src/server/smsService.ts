import SMSru from "sms_ru";

type SmsRuResponse = {
  code?: string;
  description?: string;
  status_text?: string;
};

const DEFAULT_API_ID = "EC6A9C15-AC54-4CE8-BCFF-B8DBF7F49D61";
const SMS_RU_API_ID = process.env.SMS_RU_API_ID || DEFAULT_API_ID;
const DEBUG_SMS_CODES = process.env.SMS_RU_DEBUG_CODES === "true";

const smsRuClient = SMS_RU_API_ID ? new SMSru(SMS_RU_API_ID) : null;

function normalizeSmsPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (!digits) {
    throw new Error("Некорректный номер телефона для SMS");
  }
  if (digits.length === 10) {
    return `7${digits}`;
  }
  if (digits.length === 11 && digits.startsWith("8")) {
    return `7${digits.slice(1)}`;
  }
  if (digits.length === 11 && digits.startsWith("7")) {
    return digits;
  }
  return digits;
}

function sendSmsRu(to: string, text: string) {
  if (!smsRuClient) {
    throw new Error("SMS_RU_API_ID не задан");
  }

  return new Promise<void>((resolve, reject) => {
    smsRuClient.sms_send({ to, text }, (response: SmsRuResponse | undefined) => {
      if (response?.code === "100") {
        resolve();
        return;
      }
      const description =
        response?.description ||
        response?.status_text ||
        `Неизвестная ошибка ответа SMS.RU (${response?.code ?? "без кода"})`;
      reject(new Error(`SMS.RU: не удалось отправить SMS: ${description}`));
    });
  });
}

export async function sendLoginOtpSms(phone: string, code: string) {
  const to = normalizeSmsPhone(phone);
  const text = `Код для входа в Медграф: ${code}`;
  await sendSmsRu(to, text);
}

export function getOtpDebugCode(code: string) {
  return DEBUG_SMS_CODES ? code : undefined;
}
