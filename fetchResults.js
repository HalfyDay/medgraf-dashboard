// fetchResults.js — простой запрос /umc_client/auth_user через Basic Auth
const BASE = "https://ob75av-o5lx9s-319rsf-umcclient.medgraft.ru/hs";
const BASIC_USER = process.env.ONEC_USER || "Test";
const BASIC_PASS = process.env.ONEC_PASS || "12345678";

const basicHeader = () => "Basic " + Buffer.from(`${BASIC_USER}:${BASIC_PASS}`).toString("base64");

async function fetchAuthUser(phone, docNum) {
  const normalized = String(phone).replace(/\D/g, "").slice(-10);
  const params = new URLSearchParams({ phone: normalized });
  if (docNum) {
    params.set("docNum", String(docNum).replace(/\D/g, ""));
  }

  console.log("-> GET /umc_client/auth_user", Object.fromEntries(params));
  const res = await fetch(`${BASE}/umc_client/auth_user?${params.toString()}`, {
    method: "GET",
    headers: {
      Authorization: basicHeader(),
      Accept: "application/json",
    },
  });
  const text = await res.text();
  console.log("<- status", res.status);
  console.log("<- body:", text);
}

const [phone, docNum] = process.argv.slice(2);
if (!phone) {
  console.error("Укажите phone, пример: node fetchResults.js 79111111111 [456]");
  process.exit(1);
}

fetchAuthUser(phone, docNum).catch((err) => {
  console.error("Ошибка:", err.message);
  process.exit(1);
});
