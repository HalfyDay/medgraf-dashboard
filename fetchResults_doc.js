// fetchResults_doc.js - brute-force fetch of patient documents with multiple variants
const BASES = [
  "https://ob75av-o5lx9s-319rsf-umcclient.medgraft.ru/hs",
  "http://ob75av-o5lx9s-319rsf-umcclient.medgraft.ru/hs",
];
const BASIC_USER = process.env.ONEC_USER || "Test";
const BASIC_PASS = process.env.ONEC_PASS || "12345678";

const basicHeader = () => "Basic " + Buffer.from(`${BASIC_USER}:${BASIC_PASS}`).toString("base64");

function decodeText(buffer) {
  const utfText = buffer.toString("utf-8");
  const tryParse = (text) => {
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  };
  if (!utfText.includes("\uFFFD")) {
    const json = tryParse(utfText);
    if (json) return { text: utfText, json };
  }
  const decoded = new TextDecoder("windows-1251").decode(buffer);
  return { text: decoded, json: tryParse(decoded) ?? tryParse(utfText) };
}

async function requestJson(url) {
  const res = await fetch(url, {
    headers: {
      Authorization: basicHeader(),
      Accept: "application/json",
    },
  });
  const body = decodeText(Buffer.from(await res.arrayBuffer()));
  return { res, body };
}

async function tryPatients(base, id, pathVariant) {
  const path = pathVariant === "trailing" ? "/umc_client_users/patients/" : "/umc_client_users/patients";
  const url = `${base}${path}?id=${encodeURIComponent(id)}`;
  console.log(`-> GET ${url}`);
  const { res, body } = await requestJson(url);
  console.log("<- status", res.status);
  console.log("<- body:", body.text);
  return body;
}

async function tryResults(base, paramName, id, pathVariant) {
  const path = pathVariant === "trailing" ? "/umc_client_users/results/" : "/umc_client_users/results";
  const url = `${base}${path}?${paramName}=${encodeURIComponent(id)}`;
  console.log(`-> GET ${url}`);
  const { res, body } = await requestJson(url);
  console.log("<- status", res.status);
  console.log("<- body:", body.text);
  return body;
}

async function fetchDocuments(patientId) {
  const id = String(patientId || "").trim();
  if (!id) {
    throw new Error("Provide patient id, e.g. node fetchResults_doc.js 00103070");
  }

  const paramNames = ["id", "patient_id", "code"];
  const pathVariants = ["plain", "trailing"];

  for (const base of BASES) {
    for (const pv of pathVariants) {
      await tryPatients(base, id, pv).catch((err) => console.warn("patients error", err.message));
    }
  }

  for (const base of BASES) {
    for (const pv of pathVariants) {
      for (const name of paramNames) {
        await tryResults(base, name, id, pv).catch((err) => console.warn("results error", err.message));
      }
    }
  }
}

const patientId = process.argv[2];

fetchDocuments(patientId).catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
