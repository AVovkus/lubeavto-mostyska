(function (root) {
  "use strict";

  var DB_NAME = "lubeavto_manager_db";
  var DB_VERSION = 1;
  var STORE_NAME = "kv";
  var KEY_CARS = "cars_v1";
  var KEY_SETTINGS = "settings_v1";
  var LS_SESSION = "lubeavto_admin_session_v1";
  var LS_LOCAL_PASS = "lubeavto_local_pass_v1";
  var LS_FALLBACK_CARS = "lubeavto_cars_fallback_v1";
  var LS_FALLBACK_SETTINGS = "lubeavto_settings_fallback_v1";

  var FUEL_TO_TYPE = {
    "Бензин": "petrol",
    "Дизель": "diesel",
    "Електро": "electric",
    "Гібрид": "hybrid"
  };

  function getBaseConfig() {
    var cfg = root.LUBE_AVTO_CONFIG || {};
    return JSON.parse(JSON.stringify(cfg));
  }

  function getBaseCars() {
    var list = Array.isArray(root.CARS_DATA) ? root.CARS_DATA : [];
    return JSON.parse(JSON.stringify(list)).map(normalizeCar);
  }

  function extractYouTubeId(src) {
    var str = String(src || "").trim();
    if (!str) return null;
    var match = str.match(
      /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/i
    );
    return match ? match[1] : null;
  }

  function isVideoUrl(src) {
    var str = String(src || "").trim();
    if (!str) return false;
    if (/^data:video\//i.test(str)) return true;
    if (extractYouTubeId(str)) return true;
    if (/^blob:/i.test(str)) return true;
    return /\.(mp4|webm|mov|m4v|ogv|ogg)(?:[?#].*)?$/i.test(str);
  }

  function getYouTubeEmbedUrl(src) {
    var id = extractYouTubeId(src);
    return id ? "https://www.youtube.com/embed/" + id + "?rel=0" : null;
  }

  function getYouTubeThumbUrl(src) {
    var id = extractYouTubeId(src);
    return id ? "https://img.youtube.com/vi/" + id + "/hqdefault.jpg" : null;
  }

  function normalizeCar(raw, index) {
    var c = raw || {};
    var mileageNum = Number(c.mileageThousandKm != null ? c.mileageThousandKm : c.mileage_thousand_km) || 0;
    var images = [];
    var rawList = [];
    if (Array.isArray(c.images)) rawList = rawList.concat(c.images);
    if (Array.isArray(c.videos)) rawList = rawList.concat(c.videos);
    rawList.forEach(function (item) {
      var trimmed = String(item || "").trim();
      if (trimmed && images.indexOf(trimmed) === -1) images.push(trimmed);
    });

    var explicitCover = c.image && !isVideoUrl(c.image) ? String(c.image).trim() : "";
    var firstPhoto = "";
    var firstYtThumb = "";
    for (var i = 0; i < images.length; i++) {
      if (!isVideoUrl(images[i]) && !firstPhoto) firstPhoto = images[i];
      if (!firstYtThumb) {
        var yt = getYouTubeThumbUrl(images[i]);
        if (yt) firstYtThumb = yt;
      }
    }

    var cover = explicitCover || firstPhoto || firstYtThumb || "assets/img/car-audi-a3.png";
    if (images.length === 0 && cover) images = [cover];

    var fuel = c.fuel || "Бензин";
    var fuelType = c.fuelType || c.fuel_type || FUEL_TO_TYPE[fuel] || "petrol";

    return {
      id: String(c.id || "car-" + Date.now() + "-" + (index || 0)),
      brand: String(c.brand || "").trim(),
      model: String(c.model || "").trim(),
      title: String(c.title || ((c.brand || "") + " " + (c.model || "")).trim() || "Авто"),
      year: Number(c.year) || new Date().getFullYear(),
      mileageThousandKm: mileageNum,
      mileageText: String(c.mileageText || c.mileage_text || mileageNum + " тис. км"),
      priceUsd: Number(c.priceUsd != null ? c.priceUsd : c.price_usd) || 0,
      fuel: fuel,
      fuelType: fuelType,
      engineCc: c.engineCc != null ? Number(c.engineCc) : c.engine_cc != null ? Number(c.engine_cc) : null,
      engineLabel: String(c.engineLabel || c.engine_label || ""),
      transmission: String(c.transmission || ""),
      drive: String(c.drive || ""),
      bodyType: String(c.bodyType || c.body_type || ""),
      vehicleType: String(c.vehicleType || c.vehicle_type || "passenger"),
      color: String(c.color || ""),
      status: String(c.status || "В наявності"),
      image: cover,
      images: images,
      description: String(c.description || ""),
      sortOrder: Number(c.sortOrder != null ? c.sortOrder : c.sort_order != null ? c.sort_order : index || 0)
    };
  }

  function toSupabaseRow(car, index) {
    var n = normalizeCar(car, index);
    return {
      id: n.id,
      brand: n.brand,
      model: n.model,
      title: n.title,
      year: n.year,
      mileage_thousand_km: n.mileageThousandKm,
      mileage_text: n.mileageText,
      price_usd: n.priceUsd,
      fuel: n.fuel,
      fuel_type: n.fuelType,
      engine_cc: n.engineCc,
      engine_label: n.engineLabel,
      transmission: n.transmission,
      drive: n.drive,
      body_type: n.bodyType,
      vehicle_type: n.vehicleType,
      color: n.color,
      status: n.status,
      image: n.image,
      images: n.images,
      description: n.description,
      sort_order: typeof n.sortOrder === "number" ? n.sortOrder : index || 0
    };
  }

  function getSupabaseConfig() {
    var cfg = getBaseConfig();
    var sb = cfg.supabase || {};
    var url = String(sb.url || "").trim().replace(/\/+$/, "");
    var anonKey = String(sb.anonKey || "").trim();
    var bucket = String(sb.bucket || "car-photos").trim();
    return {
      configured: Boolean(url && anonKey),
      url: url,
      anonKey: anonKey,
      bucket: bucket
    };
  }

  function mergeConfig(base, patch) {
    if (!patch || typeof patch !== "object") return base;
    var next = JSON.parse(JSON.stringify(base));
    [
      "companyName",
      "city",
      "addressNote",
      "workHours",
      "phoneDisplay",
      "phoneHref",
      "telegramUsername",
      "telegramUrl"
    ].forEach(function (key) {
      if (typeof patch[key] === "string" && patch[key].trim() !== "") {
        next[key] = patch[key].trim();
      }
    });
    if (patch.rates && typeof patch.rates === "object") {
      next.rates = next.rates || {};
      if (Number(patch.rates.usdToUah) > 0) next.rates.usdToUah = Number(patch.rates.usdToUah);
      if (Number(patch.rates.eurToUsd) > 0) next.rates.eurToUsd = Number(patch.rates.eurToUsd);
    }
    return next;
  }

  // IndexedDB helpers with localStorage fallback
  function openDb() {
    return new Promise(function (resolve, reject) {
      if (typeof indexedDB === "undefined") {
        reject(new Error("IndexedDB unavailable"));
        return;
      }
      var req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = function (e) {
        var db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      req.onsuccess = function (e) {
        resolve(e.target.result);
      };
      req.onerror = function () {
        reject(req.error || new Error("IndexedDB open error"));
      };
    });
  }

  function idbGet(key) {
    return openDb().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(STORE_NAME, "readonly");
        var req = tx.objectStore(STORE_NAME).get(key);
        req.onsuccess = function () {
          db.close();
          resolve(req.result);
        };
        req.onerror = function () {
          db.close();
          reject(req.error);
        };
      });
    });
  }

  function idbSet(key, val) {
    return openDb().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(STORE_NAME, "readwrite");
        tx.objectStore(STORE_NAME).put(val, key);
        tx.oncomplete = function () {
          db.close();
          resolve();
        };
        tx.onerror = function () {
          db.close();
          reject(tx.error);
        };
      });
    });
  }

  function idbDelete(key) {
    return openDb().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(STORE_NAME, "readwrite");
        tx.objectStore(STORE_NAME).delete(key);
        tx.oncomplete = function () {
          db.close();
          resolve();
        };
        tx.onerror = function () {
          db.close();
          reject(tx.error);
        };
      });
    });
  }

  function lsGetJson(key) {
    try {
      if (typeof localStorage === "undefined") return null;
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function lsSetJson(key, val) {
    try {
      if (typeof localStorage === "undefined") return;
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {}
  }

  function getStoredLocalCars() {
    return idbGet(KEY_CARS)
      .then(function (val) {
        return Array.isArray(val) ? val.map(normalizeCar) : null;
      })
      .catch(function () {
        var fb = lsGetJson(LS_FALLBACK_CARS);
        return Array.isArray(fb) ? fb.map(normalizeCar) : null;
      });
  }

  function saveStoredLocalCars(list) {
    var normalized = (Array.isArray(list) ? list : []).map(normalizeCar);
    return idbSet(KEY_CARS, normalized).catch(function () {
      lsSetJson(LS_FALLBACK_CARS, normalized);
    });
  }

  function getStoredLocalSettings() {
    return idbGet(KEY_SETTINGS)
      .then(function (val) {
        return val && typeof val === "object" ? val : null;
      })
      .catch(function () {
        return lsGetJson(LS_FALLBACK_SETTINGS);
      });
  }

  function saveStoredLocalSettings(patch) {
    return idbSet(KEY_SETTINGS, patch).catch(function () {
      lsSetJson(LS_FALLBACK_SETTINGS, patch);
    });
  }

  // Session management
  function getSession() {
    try {
      if (typeof sessionStorage === "undefined") return null;
      var raw = sessionStorage.getItem(LS_SESSION);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function setSession(session) {
    try {
      if (typeof sessionStorage === "undefined") return;
      if (!session) sessionStorage.removeItem(LS_SESSION);
      else sessionStorage.setItem(LS_SESSION, JSON.stringify(session));
    } catch (e) {}
  }

  function getLocalPassword() {
    try {
      if (typeof localStorage !== "undefined") {
        var custom = localStorage.getItem(LS_LOCAL_PASS);
        if (custom) return custom;
      }
    } catch (e) {}
    var cfg = getBaseConfig();
    return cfg.adminLocalPassword || "lubeavto2026";
  }

  function setLocalPassword(newPass) {
    if (!newPass || String(newPass).trim().length < 4) {
      throw new Error("Пароль має містити щонайменше 4 символи");
    }
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(LS_LOCAL_PASS, String(newPass).trim());
    }
  }

  function supabaseFetch(path, opts) {
    var sb = getSupabaseConfig();
    if (!sb.configured) return Promise.reject(new Error("Supabase не налаштовано"));

    var options = opts || {};
    var headers = Object.assign(
      {
        apikey: sb.anonKey
      },
      options.headers || {}
    );

    if (!options.isUpload && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }

    var session = getSession();
    if (options.useAuth && session && session.accessToken) {
      headers.Authorization = "Bearer " + session.accessToken;
    }

    return fetch(sb.url + path, {
      method: options.method || "GET",
      headers: headers,
      body: options.body
    }).then(function (res) {
      if (!res.ok) {
        return res.text().then(function (txt) {
          var msg = txt || "HTTP " + res.status;
          try {
            var parsed = JSON.parse(txt);
            msg = parsed.error_description || parsed.message || parsed.msg || msg;
          } catch (e) {}
          throw new Error(msg);
        });
      }
      if (res.status === 204) return null;
      var ct = res.headers.get("content-type") || "";
      return ct.indexOf("application/json") !== -1 ? res.json() : res.text();
    });
  }

  function login(credentials) {
    var creds = credentials || {};
    var sb = getSupabaseConfig();

    if (sb.configured) {
      return supabaseFetch("/auth/v1/token?grant_type=password", {
        method: "POST",
        body: JSON.stringify({
          email: String(creds.email || "").trim(),
          password: String(creds.password || "")
        })
      }).then(function (data) {
        var sess = {
          mode: "supabase",
          email: (data.user && data.user.email) || creds.email,
          accessToken: data.access_token,
          refreshToken: data.refresh_token
        };
        setSession(sess);
        return sess;
      });
    }

    return new Promise(function (resolve, reject) {
      var expected = getLocalPassword();
      if (String(creds.password || "") !== expected) {
        reject(new Error("Невірний пароль"));
        return;
      }
      var sess = { mode: "local", email: "Менеджер (локальний режим)" };
      setSession(sess);
      resolve(sess);
    });
  }

  function logout() {
    setSession(null);
  }

  function loadPublicState() {
    var baseConfig = getBaseConfig();
    var baseCars = getBaseCars();
    var sb = getSupabaseConfig();

    if (sb.configured) {
      return Promise.all([
        supabaseFetch("/rest/v1/cars?select=*&order=sort_order.asc,created_at.desc").catch(function () {
          return null;
        }),
        supabaseFetch("/rest/v1/site_settings?id=eq.main&select=payload").catch(function () {
          return null;
        })
      ]).then(function (results) {
        var cloudCars = Array.isArray(results[0]) ? results[0] : null;
        var settingsRows = Array.isArray(results[1]) ? results[1] : null;
        var patch = settingsRows && settingsRows[0] ? settingsRows[0].payload : null;

        return {
          config: mergeConfig(baseConfig, patch),
          cars: cloudCars && cloudCars.length > 0 ? cloudCars.map(normalizeCar) : baseCars,
          source: "supabase",
          hasCloudRows: Boolean(cloudCars && cloudCars.length > 0)
        };
      });
    }

    return Promise.all([getStoredLocalCars(), getStoredLocalSettings()]).then(function (results) {
      var localCars = results[0];
      var localSettings = results[1];
      return {
        config: mergeConfig(baseConfig, localSettings),
        cars: localCars !== null ? localCars : baseCars,
        source: localCars !== null || localSettings !== null ? "local" : "default"
      };
    });
  }

  function upsertCar(car, existingCars) {
    var sb = getSupabaseConfig();
    var normalized = normalizeCar(car);

    if (sb.configured) {
      var row = toSupabaseRow(normalized, normalized.sortOrder);
      return supabaseFetch("/rest/v1/cars?on_conflict=id", {
        method: "POST",
        useAuth: true,
        headers: {
          Prefer: "resolution=merge-duplicates,return=representation"
        },
        body: JSON.stringify(row)
      }).then(function (rows) {
        return Array.isArray(rows) && rows[0] ? normalizeCar(rows[0]) : normalized;
      });
    }

    var current = Array.isArray(existingCars) ? existingCars.slice() : getBaseCars();
    var idx = -1;
    for (var i = 0; i < current.length; i++) {
      if (current[i].id === normalized.id) {
        idx = i;
        break;
      }
    }
    if (idx >= 0) current[idx] = normalized;
    else current.unshift(normalized);

    return saveStoredLocalCars(current).then(function () {
      return normalized;
    });
  }

  function deleteCar(carId, existingCars) {
    var sb = getSupabaseConfig();
    if (sb.configured) {
      return supabaseFetch("/rest/v1/cars?id=eq." + encodeURIComponent(carId), {
        method: "DELETE",
        useAuth: true
      });
    }

    var current = Array.isArray(existingCars) ? existingCars.slice() : getBaseCars();
    var next = current.filter(function (c) {
      return c.id !== carId;
    });
    return saveStoredLocalCars(next);
  }

  function saveSettings(settingsPatch) {
    var sb = getSupabaseConfig();
    if (sb.configured) {
      return supabaseFetch("/rest/v1/site_settings?on_conflict=id", {
        method: "POST",
        useAuth: true,
        headers: {
          Prefer: "resolution=merge-duplicates,return=representation"
        },
        body: JSON.stringify({
          id: "main",
          payload: settingsPatch,
          updated_at: new Date().toISOString()
        })
      });
    }
    return saveStoredLocalSettings(settingsPatch);
  }

  function resetLocalData() {
    return Promise.all([
      idbDelete(KEY_CARS).catch(function () {}),
      idbDelete(KEY_SETTINGS).catch(function () {})
    ]).then(function () {
      try {
        if (typeof localStorage !== "undefined") {
          localStorage.removeItem(LS_FALLBACK_CARS);
          localStorage.removeItem(LS_FALLBACK_SETTINGS);
        }
      } catch (e) {}
    });
  }

  function compressImageFile(file, maxDim, quality) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onerror = function () {
        reject(new Error("Не вдалося прочитати файл зображення"));
      };
      reader.onload = function (ev) {
        var img = new Image();
        img.onerror = function () {
          reject(new Error("Пошкоджене зображення"));
        };
        img.onload = function () {
          var w = img.width;
          var h = img.height;
          var limit = maxDim || 1280;
          if (w > limit || h > limit) {
            if (w >= h) {
              h = Math.round((h * limit) / w);
              w = limit;
            } else {
              w = Math.round((w * limit) / h);
              h = limit;
            }
          }
          var canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          var ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, w, h);
          var q = quality || 0.82;
          var dataUrl = canvas.toDataURL("image/jpeg", q);
          if (canvas.toBlob) {
            canvas.toBlob(
              function (blob) {
                resolve({ dataUrl: dataUrl, blob: blob });
              },
              "image/jpeg",
              q
            );
          } else {
            resolve({ dataUrl: dataUrl, blob: null });
          }
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function isVideoFile(file) {
    if (!file) return false;
    if (file.type && file.type.indexOf("video/") === 0) return true;
    return /\.(mp4|webm|mov|m4v|ogv|ogg)$/i.test(file.name || "");
  }

  function readFileAsDataUrl(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onerror = function () {
        reject(new Error("Не вдалося прочитати відеофайл"));
      };
      reader.onload = function (ev) {
        resolve(ev.target.result);
      };
      reader.readAsDataURL(file);
    });
  }

  function getVideoExtension(file) {
    var name = String((file && file.name) || "");
    var extMatch = name.match(/\.([a-z0-9]+)$/i);
    if (extMatch) return extMatch[1].toLowerCase();
    var type = String((file && file.type) || "");
    if (type.indexOf("webm") !== -1) return "webm";
    if (type.indexOf("quicktime") !== -1) return "mov";
    return "mp4";
  }

  function uploadMedia(file) {
    if (isVideoFile(file)) {
      var maxBytes = 50 * 1024 * 1024;
      if (file.size && file.size > maxBytes) {
        return Promise.reject(
          new Error("Відео завелике (макс. 50 МБ). Стисніть файл або вставте посилання YouTube.")
        );
      }

      var sb = getSupabaseConfig();
      if (!sb.configured) {
        return readFileAsDataUrl(file);
      }

      var videoName =
        Date.now() +
        "-" +
        Math.random().toString(36).slice(2, 8) +
        "." +
        getVideoExtension(file);
      return supabaseFetch("/storage/v1/object/" + sb.bucket + "/" + videoName, {
        method: "POST",
        useAuth: true,
        isUpload: true,
        headers: {
          "Content-Type": file.type || "video/mp4",
          "x-upsert": "true"
        },
        body: file
      }).then(function () {
        return sb.url + "/storage/v1/object/public/" + sb.bucket + "/" + videoName;
      });
    }

    return compressImageFile(file, 1280, 0.82).then(function (compressed) {
      var sb = getSupabaseConfig();
      if (!sb.configured || !compressed.blob) {
        return compressed.dataUrl;
      }

      var safeName =
        Date.now() +
        "-" +
        Math.random().toString(36).slice(2, 8) +
        ".jpg";
      return supabaseFetch("/storage/v1/object/" + sb.bucket + "/" + safeName, {
        method: "POST",
        useAuth: true,
        isUpload: true,
        headers: {
          "Content-Type": "image/jpeg",
          "x-upsert": "true"
        },
        body: compressed.blob
      }).then(function () {
        return sb.url + "/storage/v1/object/public/" + sb.bucket + "/" + safeName;
      });
    });
  }

  function buildExportDataJs(config, cars) {
    var cleanCars = (Array.isArray(cars) ? cars : []).map(normalizeCar);
    return (
      "/**\n" +
      " * Конфігурація сайту та база автомобілів майданчика «Любе Авто Мостиська».\n" +
      " * Згенеровано в кабінеті менеджера. Повний список локацій зберігається у js/locations.js.\n" +
      " */\n" +
      "window.LUBE_AVTO_CONFIG = " +
      JSON.stringify(config, null, 2) +
      ";\n\n" +
      "/**\n" +
      " * Автомобілі на майданчику.\n" +
      " */\n" +
      "window.CARS_DATA = " +
      JSON.stringify(cleanCars, null, 2) +
      ";\n"
    );
  }

  root.LubeAvtoStore = {
    getBaseConfig: getBaseConfig,
    getBaseCars: getBaseCars,
    getSupabaseConfig: getSupabaseConfig,
    extractYouTubeId: extractYouTubeId,
    isVideoUrl: isVideoUrl,
    getYouTubeEmbedUrl: getYouTubeEmbedUrl,
    getYouTubeThumbUrl: getYouTubeThumbUrl,
    normalizeCar: normalizeCar,
    getSession: getSession,
    getLocalPassword: getLocalPassword,
    setLocalPassword: setLocalPassword,
    login: login,
    logout: logout,
    loadPublicState: loadPublicState,
    upsertCar: upsertCar,
    deleteCar: deleteCar,
    saveSettings: saveSettings,
    resetLocalData: resetLocalData,
    uploadMedia: uploadMedia,
    uploadPhoto: uploadMedia,
    buildExportDataJs: buildExportDataJs
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
