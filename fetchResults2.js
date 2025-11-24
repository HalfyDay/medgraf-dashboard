// fetchResults2.js — запрос результатов с пробой Bearer и fallback на Basic
const BASE = "https://ob75av-o5lx9s-319rsf-umcclient.medgraft.ru/hs";
const BASIC_USER = process.env.ONEC_USER || "Test";
const BASIC_PASS = process.env.ONEC_PASS || "12345678";

const basicHeader = () => "Basic " + Buffer.from(`${BASIC_USER}:${BASIC_PASS}`).toString("base64");

async function getToken() {
  console.log("-> GET /umc_client/get_token");
  const res = await fetch(`${BASE}/umc_client/get_token`, {
    headers: {
      Authorization: basicHeader(),
      Accept: "application/json",
    },
  });
  const payload = await res.json().catch(() => ({}));
  console.log("<- token response:", payload);
  return payload.details;
}

async function decodeBody(res) {
  const buffer = Buffer.from(await res.arrayBuffer());
  const utfText = buffer.toString("utf-8");
  const hasReplacement = utfText.includes("\uFFFD");
  const tryParse = (text) => {
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  };

  if (!hasReplacement) {
    const parsed = tryParse(utfText);
    if (parsed) {
      return { text: utfText, json: parsed };
    }
  }

  // Попытка раскодировать CP1251, если UTF-8 не читается или не парсится
  const decoded1251 = new TextDecoder("windows-1251").decode(buffer);
  const parsed1251 = tryParse(decoded1251);
  if (parsed1251) {
    return { text: decoded1251, json: parsed1251 };
  }

  return { text: utfText, json: tryParse(utfText) };
}

function buildUrl(params) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      search.set(key, value);
    }
  });
  return `${BASE}/umc_client_users/results?${search.toString()}`;
}

async function requestResults(authHeader, mode, label, params) {
  console.log(`-> GET /umc_client_users/results (${mode}, ${label})`, params);
  const res = await fetch(buildUrl(params), {
    headers: {
      Authorization: authHeader,
      Accept: "application/json",
    },
  });
  const body = await decodeBody(res);
  console.log(`<-${mode} status`, res.status);
  console.log(`<-${mode} body:`, body.text);
  return { res, body };
}

async function fetchPatients(patientId) {
  console.log("-> GET /umc_client_users/patients (basic)", { id: patientId });
  const res = await fetch(`${BASE}/umc_client_users/patients?id=${encodeURIComponent(patientId)}`, {
    headers: {
      Authorization: basicHeader(),
      Accept: "application/json",
    },
  });
  const body = await decodeBody(res);
  console.log("<-patients status", res.status);
  console.log("<-patients body:", body.text);
  return body;
}

async function fetchResults(patientId) {
  // Оставлен только первый вариант, который давал code 0: получаем токен и читаем /patients.
  await getToken();
  await fetchPatients(patientId);
}

const patientId = process.argv[2];
if (!patientId) {
  console.error("Укажите patientId, например: node fetchResults2.js 00103070");
  process.exit(1);
}

fetchResults(patientId).catch((err) => {
  console.error("Ошибка:", err.message);
  process.exit(1);
});
