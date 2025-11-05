export function extractPhoneDigits(value: string) {
  let digits = value.replace(/\D/g, "");
  const trimmed = value.trim();

  if (trimmed.startsWith("+7") && digits.startsWith("7")) {
    digits = digits.slice(1);
  } else if (digits.startsWith("7") && digits.length === 11) {
    digits = digits.slice(1);
  } else if (digits.startsWith("8") && digits.length >= 11) {
    digits = digits.slice(1);
  }

  if (digits.length > 10) {
    digits = digits.slice(-10);
  }

  return digits;
}

export function formatPhoneInput(digits: string) {
  const cleaned = digits.slice(0, 10);

  const parts = [
    cleaned.slice(0, 3),
    cleaned.slice(3, 6),
    cleaned.slice(6, 8),
    cleaned.slice(8, 10),
  ];

  let result = "+7";
  if (parts[0]) {
    result += ` (${parts[0]}`;
    if (parts[0].length === 3) {
      result += ")";
    }
  }
  if (parts[1]) {
    result += ` ${parts[1]}`;
  }
  if (parts[2]) {
    result += `-${parts[2]}`;
  }
  if (parts[3]) {
    result += `-${parts[3]}`;
  }
  return result;
}

export function normalizePhone(value: string) {
  const digits = extractPhoneDigits(value);
  if (!digits) {
    return "";
  }
  const normalized = digits.slice(-10);
  return `+7${normalized}`;
}
