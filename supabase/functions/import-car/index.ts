import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "jsr:@supabase/supabase-js@2/cors";

const responseCorsHeaders = {
  ...corsHeaders,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...responseCorsHeaders,
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

function getEnvKey(jsonVar: string, legacyVar: string): string {
  const raw = Deno.env.get(jsonVar);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.default === "string" && parsed.default) {
        return parsed.default;
      }
    } catch {
      // ignore invalid JSON wrapper and fall back to legacy env var
    }
  }
  return Deno.env.get(legacyVar) || "";
}

type ImportTarget =
  | { kind: "autoria"; autoId: string }
  | { kind: "vin"; vin: string };

function parseImportTarget(rawInput: string): ImportTarget | null {
  const trimmed = String(rawInput || "").trim();
  if (!trimmed) return null;

  const vinCandidate = trimmed.toUpperCase();
  if (/^[A-HJ-NPR-Z0-9]{17}$/.test(vinCandidate)) {
    return { kind: "vin", vin: vinCandidate };
  }

  if (/^\d{6,12}$/.test(trimmed)) {
    return { kind: "autoria", autoId: trimmed };
  }

  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const parsedUrl = new URL(withScheme);
    const host = parsedUrl.hostname.toLowerCase();
    if (host === "auto.ria.com" || host.endsWith(".auto.ria.com")) {
      const paramId = parsedUrl.searchParams.get("auto_id");
      if (paramId && /^\d{6,12}$/.test(paramId.trim())) {
        return { kind: "autoria", autoId: paramId.trim() };
      }
      const pathMatch = parsedUrl.pathname.match(/(?:_|\/)(\d{6,12})(?:\.html|\/?$)/);
      if (pathMatch) {
        return { kind: "autoria", autoId: pathMatch[1] };
      }
    }
  } catch {
    return null;
  }

  return null;
}

function isAllowedRiaMediaHost(rawUrl: string): boolean {
  try {
    const u = new URL(rawUrl);
    if (u.protocol !== "https:") return false;
    const host = u.hostname.toLowerCase();
    return (
      host === "riastatic.com" ||
      host.endsWith(".riastatic.com") ||
      host === "ria.com" ||
      host.endsWith(".ria.com")
    );
  } catch {
    return false;
  }
}

function cleanText(val: unknown): string {
  return String(val ?? "")
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function mapFuelType(rawFuel: string): string {
  const f = rawFuel.toLowerCase();
  if (!f) return "Бензин";
  if (f.includes("електр") || f.includes("electric")) return "Електро";
  if (f.includes("гібрид") || f.includes("гибрид") || f.includes("hybrid") || f.includes("phev")) {
    return "Гібрид";
  }
  if (f.includes("дизел") || f.includes("diesel")) return "Дизель";
  if (f.includes("бенз") || f.includes("газ") || f.includes("gas")) return "Бензин";
  return "Бензин";
}

function mapTransmission(rawGearbox: string): string {
  const g = rawGearbox.toLowerCase();
  if (!g) return "";
  if (g.includes("автомат") || g.includes("automatic") || g.includes("tiptronic")) return "Автомат";
  if (g.includes("механ") || g.includes("ручн") || g.includes("manual")) return "Механіка";
  if (g.includes("робот") || g.includes("dsg") || g.includes("dual")) return "Робот";
  if (g.includes("варіатор") || g.includes("вариатор") || g.includes("cvt")) return "Варіатор";
  return cleanText(rawGearbox);
}

function mapDrive(rawDrive: string): string {
  const d = rawDrive.toLowerCase();
  if (!d) return "";
  if (d.includes("повн") || d.includes("полн") || d.includes("awd") || d.includes("4wd") || d.includes("4x4")) {
    return "Повний";
  }
  if (d.includes("перед") || d.includes("fwd")) return "Передній";
  if (d.includes("зад") || d.includes("rwd")) return "Задній";
  return cleanText(rawDrive);
}

function normalizeBodyType(rawBody: string): string {
  const clean = cleanText(rawBody);
  const b = clean.toLowerCase();
  if (!b) return "";
  if (b.includes("кросов") || b.includes("кроссовер") || b.includes("cuv")) return "Кросовер";
  if (b.includes("позашляхов") || b.includes("внедорож") || b.includes("вездеход") || b.includes("suv")) {
    return "Позашляховик";
  }
  if (b.includes("седан") || b.includes("sedan")) return "Седан";
  if (b.includes("універсал") || b.includes("универсал") || b.includes("wagon")) return "Універсал";
  if (b.includes("хетч") || b.includes("хэтч") || b.includes("hatch")) return "Хетчбек";
  if (b.includes("ліфтбек") || b.includes("лифтбек") || b.includes("liftback")) return "Ліфтбек";
  if (b.includes("мінівен") || b.includes("минивен") || b.includes("minivan")) return "Мінівен";
  if (b.includes("пікап") || b.includes("пикап") || b.includes("pickup")) return "Пікап";
  if (b.includes("фургон") || b.includes("бус") || b.includes("van")) return "Мікроавтобус";
  if (b.includes("купе") || b.includes("coupe")) return "Купе";
  if (b.includes("кабріо") || b.includes("кабрио") || b.includes("convertible")) return "Кабріолет";
  if (b.includes("мото")) return "Мотоцикл";
  return clean;
}

function mapVehicleType(rawBody: string, categoryEng = ""): string {
  const b = `${rawBody} ${categoryEng}`.toLowerCase();
  if (b.includes("moto")) return "moto";
  if (b.includes("кросов")) return "crossover";
  if (b.includes("позашляхов") || b.includes("внедорож") || b.includes("вездеход") || b.includes("suv")) {
    return "suv";
  }
  if (b.includes("пікап") || b.includes("пикап") || b.includes("pickup") || b.includes("фургон") || b.includes("мінівен") || b.includes("бус") || b.includes("van") || b.includes("truck")) {
    return "van";
  }
  return "passenger";
}

function parseMileageThousandKm(raceInt: unknown, raceText: unknown): number | null {
  const numeric = Number(raceInt);
  if (!Number.isNaN(numeric) && numeric >= 0 && numeric <= 2000) {
    return Math.round(numeric);
  }
  const str = String(raceText || "");
  const m = str.match(/(\d+(?:[.,]\d+)?)/);
  if (m) {
    const val = Number(m[1].replace(",", "."));
    if (!Number.isNaN(val)) {
      return val > 2000 ? Math.round(val / 1000) : Math.round(val);
    }
  }
  return null;
}

function extractRiaEngineLabel(info: Record<string, unknown>): string {
  const autoData = (info.autoData || {}) as Record<string, unknown>;
  const candidates = [
    autoData.engineName,
    autoData.modification,
    autoData.fuelName,
    info.title,
  ]
    .map((v) => cleanText(v))
    .filter(Boolean);

  for (const text of candidates) {
    const m = text.match(/(\d\.\d\s*(?:TDI|TSI|TFSI|FSI|CDI|HDI|dCi|CRDi|GDI|Hybrid|PHEV)?)/i);
    if (m) return cleanText(m[1]);
  }
  return "";
}

function pickBestRiaPhotoUrl(formats: unknown): string {
  if (!Array.isArray(formats) || formats.length === 0) return "";
  const urls = formats.map((u) => String(u || "").trim()).filter((u) => isAllowedRiaMediaHost(u));
  if (urls.length === 0) return "";

  const priority = [/fx\.(?:jpe?g|webp)$/i, /b\.(?:jpe?g|webp)$/i, /hd\.(?:jpe?g|webp)$/i, /xl\.(?:jpe?g|webp)$/i, /f\.(?:jpe?g|webp)$/i];
  for (const rx of priority) {
    const hit = urls.find((u) => rx.test(u));
    if (hit) return hit;
  }
  const nonThumb = urls.find((u) => !/(?:s|sx|m)\.(?:jpe?g|webp)$/i.test(u));
  return nonThumb || urls[urls.length - 1];
}

function extractRiaPhotoUrls(info: Record<string, unknown>, fotosPayload: Record<string, unknown> | null, autoId: string): string[] {
  const collected: string[] = [];
  const pushUnique = (u: string) => {
    if (u && isAllowedRiaMediaHost(u) && !collected.includes(u)) {
      collected.push(u);
    }
  };

  if (fotosPayload && fotosPayload.data && typeof fotosPayload.data === "object") {
    const dataMap = fotosPayload.data as Record<string, unknown>;
    const autoMap = (dataMap[autoId] || Object.values(dataMap)[0]) as Record<string, unknown> | undefined;
    if (autoMap && typeof autoMap === "object") {
      const entries = Object.values(autoMap)
        .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"))
        .sort((a, b) => {
          const mainDiff = (b.isMain ? 1 : 0) - (a.isMain ? 1 : 0);
          if (mainDiff !== 0) return mainDiff;
          return (Number(a.sortingIndex) || 9999) - (Number(b.sortingIndex) || 9999);
        });

      for (const item of entries) {
        const best = pickBestRiaPhotoUrl(item.formats);
        if (best) pushUnique(best);
      }
    }
  }

  const photoData = (info.photoData || {}) as Record<string, unknown>;
  for (const key of ["seoLinkB", "seoLinkF", "seoLinkM"]) {
    if (typeof photoData[key] === "string") {
      pushUnique(String(photoData[key]));
    }
  }

  return collected.slice(0, 18);
}

async function mirrorPhotosToStorage(
  supabaseAdmin: ReturnType<typeof createClient> | null,
  supabaseUrl: string,
  bucket: string,
  autoId: string,
  photoUrls: string[],
): Promise<string[]> {
  if (!supabaseAdmin || photoUrls.length === 0) return photoUrls;

  const uploadedUrls: string[] = [];
  const maxBytes = 10 * 1024 * 1024;
  const batchSize = 5;

  for (let start = 0; start < photoUrls.length; start += batchSize) {
    const batch = photoUrls.slice(start, start + batchSize);
    const settled = await Promise.all(
      batch.map(async (srcUrl, offset) => {
        if (!isAllowedRiaMediaHost(srcUrl)) return null;
        try {
          const resp = await fetch(srcUrl, { signal: AbortSignal.timeout(8000) });
          if (!resp.ok) return srcUrl;
          const contentType = (resp.headers.get("content-type") || "image/jpeg").split(";")[0].trim().toLowerCase();
          if (!contentType.startsWith("image/")) return null;
          const buf = new Uint8Array(await resp.arrayBuffer());
          if (buf.byteLength === 0 || buf.byteLength > maxBytes) return srcUrl;

          const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
          const fileName = `ria-${autoId}-${start + offset}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
          const { error } = await supabaseAdmin.storage
            .from(bucket)
            .upload(fileName, buf, { contentType, upsert: false });

          if (error) return srcUrl;
          return `${supabaseUrl}/storage/v1/object/public/${bucket}/${fileName}`;
        } catch {
          return srcUrl;
        }
      }),
    );

    for (const url of settled) {
      if (url && !uploadedUrls.includes(url)) uploadedUrls.push(url);
    }
  }

  return uploadedUrls;
}

async function fetchFromAutoRia(
  autoId: string,
  riaApiKey: string,
  uploadPhotos: boolean,
  supabaseAdmin: ReturnType<typeof createClient> | null,
  supabaseUrl: string,
) {
  const infoUrl = `https://developers.ria.com/auto/info?api_key=${encodeURIComponent(riaApiKey)}&auto_id=${encodeURIComponent(autoId)}`;
  const fotosUrl = `https://developers.ria.com/auto/fotos/${encodeURIComponent(autoId)}?api_key=${encodeURIComponent(riaApiKey)}`;

  const [infoResp, fotosResp] = await Promise.all([
    fetch(infoUrl, { signal: AbortSignal.timeout(10000) }),
    fetch(fotosUrl, { signal: AbortSignal.timeout(10000) }).catch(() => null),
  ]);

  const infoRaw = await infoResp.text();
  let infoJson: Record<string, unknown> | null = null;
  try {
    infoJson = JSON.parse(infoRaw);
  } catch {
    infoJson = null;
  }

  if (!infoResp.ok || !infoJson || infoJson.error) {
    const apiErrMsg = infoJson && typeof infoJson.error === "object"
      ? cleanText((infoJson.error as Record<string, unknown>).message)
      : cleanText(infoJson && infoJson.error);
    if (infoResp.status === 404) {
      throw Object.assign(new Error(`Оголошення №${autoId} на AUTO.RIA не знайдено або вже видалено`), { status: 404 });
    }
    if (infoResp.status === 401 || infoResp.status === 403 || apiErrMsg.toLowerCase().includes("api_key")) {
      throw Object.assign(new Error("Недійсний RIA_API_KEY або вичерпано ліміт запитів AUTO.RIA API"), { status: 400 });
    }
    throw Object.assign(
      new Error(apiErrMsg || `AUTO.RIA повернув HTTP ${infoResp.status}`),
      { status: 502 },
    );
  }

  const autoData = (infoJson.autoData || {}) as Record<string, unknown>;
  let fotosJson: Record<string, unknown> | null = null;
  if (fotosResp && fotosResp.ok) {
    try {
      fotosJson = await fotosResp.json();
    } catch {
      fotosJson = null;
    }
  }

  const rawPhotos = extractRiaPhotoUrls(infoJson, fotosJson, autoId);
  const images = uploadPhotos
    ? await mirrorPhotosToStorage(supabaseAdmin, supabaseUrl, "car-photos", autoId, rawPhotos)
    : rawPhotos;

  const brand = cleanText(infoJson.markName);
  const model = cleanText(infoJson.modelName);
  const yearNum = Number(autoData.year);
  const mileageNum = parseMileageThousandKm(autoData.raceInt, autoData.race);
  const priceUsd = Math.round(Number(infoJson.USD) || 0);
  const rawBody = cleanText(infoJson.subCategoryName);
  const rawColor =
    typeof infoJson.color === "string"
      ? cleanText(infoJson.color)
      : cleanText(infoJson.color && (infoJson.color as Record<string, unknown>).name);
  const linkToView = cleanText(infoJson.linkToView);

  return {
    source: "autoria",
    autoId,
    sourceUrl: linkToView ? `https://auto.ria.com/uk${linkToView}` : `https://auto.ria.com/uk/auto__${autoId}.html`,
    brand,
    model,
    year: !Number.isNaN(yearNum) && yearNum > 1950 ? yearNum : null,
    mileageThousandKm: mileageNum,
    priceUsd: priceUsd > 0 ? priceUsd : null,
    fuel: mapFuelType(cleanText(autoData.fuelName)),
    engineLabel: extractRiaEngineLabel(infoJson),
    vehicleType: mapVehicleType(rawBody, cleanText(autoData.categoryNameEng)),
    transmission: mapTransmission(cleanText(autoData.gearboxName)),
    drive: mapDrive(cleanText(autoData.driveName)),
    bodyType: normalizeBodyType(rawBody),
    color: rawColor,
    description: cleanText(autoData.description),
    images,
    vin: cleanText(infoJson.VIN || autoData.vin),
  };
}

async function fetchFromVin(vin: string) {
  const url = `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValuesExtended/${encodeURIComponent(vin)}?format=json`;
  const resp = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!resp.ok) {
    throw Object.assign(new Error(`VIN-сервіс повернув HTTP ${resp.status}`), { status: 502 });
  }
  const data = await resp.json();
  const row = Array.isArray(data && data.Results) ? data.Results[0] : null;
  if (!row || (!cleanText(row.Make) && !cleanText(row.Model))) {
    throw Object.assign(new Error(`Не вдалося розшифрувати VIN ${vin}`), { status: 404 });
  }

  const disp = Number(row.DisplacementL);
  const engineLabel = !Number.isNaN(disp) && disp > 0 ? `${disp.toFixed(1)}L` : "";
  const rawBody = cleanText(row.BodyClass);
  const yearNum = Number(row.ModelYear);

  return {
    source: "vin",
    vin,
    brand: cleanText(row.Make),
    model: cleanText(row.Model),
    year: !Number.isNaN(yearNum) && yearNum > 1950 ? yearNum : null,
    mileageThousandKm: null,
    priceUsd: null,
    fuel: mapFuelType(cleanText(row.FuelTypePrimary)),
    engineLabel,
    vehicleType: mapVehicleType(rawBody, cleanText(row.VehicleType)),
    transmission: mapTransmission(cleanText(row.TransmissionStyle)),
    drive: mapDrive(cleanText(row.DriveType)),
    bodyType: normalizeBodyType(rawBody),
    color: "",
    description: "",
    images: [],
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: responseCorsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const publishableKey = getEnvKey("SUPABASE_PUBLISHABLE_KEYS", "SUPABASE_ANON_KEY");
  const secretKey = getEnvKey("SUPABASE_SECRET_KEYS", "SUPABASE_SERVICE_ROLE_KEY");

  const authHeader = req.headers.get("Authorization") || "";
  if (!authHeader.startsWith("Bearer ")) {
    return jsonResponse({ error: "Потрібна авторизація менеджера", code: "AUTH_EXPIRED" }, 401);
  }
  const token = authHeader.slice(7).trim();
  if (!token) {
    return jsonResponse({ error: "Потрібна авторизація менеджера", code: "AUTH_EXPIRED" }, 401);
  }

  const supabaseUserClient = createClient(supabaseUrl, publishableKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user },
    error: authError,
  } = await supabaseUserClient.auth.getUser(token);
  if (authError || !user) {
    return jsonResponse({ error: "Сесія авторизації недійсна або завершена", code: "AUTH_EXPIRED" }, 401);
  }

  const { data: isAdmin, error: adminErr } = await supabaseUserClient.rpc("check_lube_admin");
  if (adminErr || isAdmin !== true) {
    return jsonResponse({ error: "Доступ дозволено лише менеджерам майданчика" }, 403);
  }

  let payload: Record<string, unknown> = {};
  try {
    payload = (await req.json()) as Record<string, unknown>;
  } catch {
    return jsonResponse({ error: "Некоректний формат запиту" }, 400);
  }

  const rawInput = cleanText(payload.input);
  const uploadPhotos = payload.uploadPhotos !== false;
  const target = parseImportTarget(rawInput);

  if (!target) {
    return jsonResponse(
      { error: "Вставте коректне посилання на auto.ria.com або 17-значний VIN-код" },
      400,
    );
  }

  try {
    if (target.kind === "autoria") {
      const riaApiKey = cleanText(Deno.env.get("RIA_API_KEY"));
      if (!riaApiKey) {
        return jsonResponse(
          {
            code: "MISSING_RIA_KEY",
            error: "Додайте безкоштовний API-ключ AUTO.RIA (RIA_API_KEY) у Supabase → Edge Functions → Secrets",
          },
          400,
        );
      }

      const supabaseAdmin = secretKey ? createClient(supabaseUrl, secretKey) : null;
      const result = await fetchFromAutoRia(target.autoId, riaApiKey, uploadPhotos, supabaseAdmin, supabaseUrl);
      return jsonResponse(result, 200);
    }

    const vinResult = await fetchFromVin(target.vin);
    return jsonResponse(vinResult, 200);
  } catch (err) {
    const status = typeof (err as { status?: number }).status === "number"
      ? (err as { status: number }).status
      : 500;
    const message = err instanceof Error ? err.message : "Не вдалося отримати дані автомобіля";
    return jsonResponse({ error: message }, status);
  }
});
