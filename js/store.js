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
    var priceUsd = Number(c.priceUsd != null ? c.priceUsd : c.price_usd) || 0;
    var rawOldPrice = c.oldPriceUsd != null ? c.oldPriceUsd : c.old_price_usd;
    var parsedOldPrice =
      rawOldPrice !== undefined && rawOldPrice !== null && String(rawOldPrice).trim() !== ""
        ? Number(rawOldPrice)
        : NaN;
    var oldPriceUsd =
      !isNaN(parsedOldPrice) && parsedOldPrice > priceUsd && priceUsd > 0
        ? parsedOldPrice
        : null;

    return {
      id: String(c.id || "car-" + Date.now() + "-" + (index || 0)),
      brand: String(c.brand || "").trim(),
      model: String(c.model || "").trim(),
      title: String(c.title || ((c.brand || "") + " " + (c.model || "")).trim() || "Авто"),
      year: Number(c.year) || new Date().getFullYear(),
      mileageThousandKm: mileageNum,
      mileageText: String(c.mileageText || c.mileage_text || mileageNum + " тис. км"),
      priceUsd: priceUsd,
      oldPriceUsd: oldPriceUsd,
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
      old_price_usd: n.oldPriceUsd,
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

  function normalizeCatalogLabel(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function mergeCustomCatalog(baseCatalog, patchCatalog) {
    var out = {};
    var brandKeyByLower = {};

    function addEntry(rawBrand, rawModels) {
      var brand = normalizeCatalogLabel(rawBrand);
      if (!brand) return;
      var lowerBrand = brand.toLowerCase();
      var targetBrand = brandKeyByLower[lowerBrand];
      if (!targetBrand) {
        targetBrand = brand;
        brandKeyByLower[lowerBrand] = brand;
        out[targetBrand] = [];
      }
      if (!Array.isArray(rawModels)) return;
      var seenModels = {};
      out[targetBrand].forEach(function (m) {
        seenModels[String(m || "").toLowerCase()] = true;
      });
      rawModels.forEach(function (rawModel) {
        var model = normalizeCatalogLabel(rawModel);
        if (!model) return;
        var lowerModel = model.toLowerCase();
        if (!seenModels[lowerModel]) {
          seenModels[lowerModel] = true;
          out[targetBrand].push(model);
        }
      });
    }

    [baseCatalog, patchCatalog].forEach(function (source) {
      if (!source || typeof source !== "object") return;
      Object.keys(source).forEach(function (brandKey) {
        addEntry(brandKey, source[brandKey]);
      });
    });

    return out;
  }

  function mergeConfig(base, patch) {
    var mergedBase = base || {};
    var next = JSON.parse(JSON.stringify(mergedBase));
    next.customCatalog = mergeCustomCatalog(mergedBase.customCatalog, patch && patch.customCatalog);
    if (!patch || typeof patch !== "object") return next;
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
    if (typeof patch.ratesAutoSync === "boolean") {
      next.ratesAutoSync = patch.ratesAutoSync;
    }
    ["ratesSource", "ratesExchangeDate", "ratesUpdatedAt"].forEach(function (key) {
      if (typeof patch[key] === "string" && patch[key].trim() !== "") {
        next[key] = patch[key].trim();
      }
    });
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

  function refreshSupabaseSession(session) {
    var sb = getSupabaseConfig();
    if (!sb.configured || !session || !session.refreshToken) {
      return Promise.reject(new Error("Refresh token missing"));
    }
    return fetch(sb.url + "/auth/v1/token?grant_type=refresh_token", {
      method: "POST",
      headers: {
        apikey: sb.anonKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ refresh_token: session.refreshToken })
    }).then(function (res) {
      if (!res.ok) throw new Error("Session refresh failed");
      return res.json();
    }).then(function (data) {
      var nextSess = {
        mode: "supabase",
        email: (data.user && data.user.email) || session.email,
        accessToken: data.access_token,
        refreshToken: data.refresh_token || session.refreshToken
      };
      setSession(nextSess);
      return nextSess;
    });
  }

  function supabaseFetch(path, opts, retried) {
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
      if (res.status === 401 && options.useAuth && !retried) {
        return refreshSupabaseSession(session)
          .then(function () {
            return supabaseFetch(path, opts, true);
          })
          .catch(function () {
            setSession(null);
            var expiredErr = new Error("Сесія завершилася. Увійдіть повторно.");
            expiredErr.code = "AUTH_EXPIRED";
            throw expiredErr;
          });
      }

      if (!res.ok) {
        return res.text().then(function (txt) {
          var msg = txt || "HTTP " + res.status;
          var apiCode = "";
          try {
            var parsed = JSON.parse(txt);
            msg = parsed.error_description || parsed.message || parsed.msg || parsed.error || msg;
            if (parsed.code) apiCode = String(parsed.code);
          } catch (e) {}
          var httpErr = new Error(msg);
          if (apiCode) httpErr.code = apiCode;
          if (res.status === 401) {
            setSession(null);
            httpErr.code = "AUTH_EXPIRED";
          }
          throw httpErr;
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
    var sb = getSupabaseConfig();
    var sess = getSession();
    setSession(null);
    if (sb.configured && sess && sess.accessToken && typeof fetch === "function") {
      fetch(sb.url + "/auth/v1/logout", {
        method: "POST",
        headers: {
          apikey: sb.anonKey,
          Authorization: "Bearer " + sess.accessToken
        }
      }).catch(function () {});
    }
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

  function extractStorageObjectName(publicUrl) {
    var sb = getSupabaseConfig();
    if (!sb.configured || !publicUrl) return null;
    var prefix = sb.url + "/storage/v1/object/public/" + sb.bucket + "/";
    var cleanUrl = String(publicUrl).split("?")[0].split("#")[0];
    if (cleanUrl.indexOf(prefix) !== 0) return null;
    var name = cleanUrl.slice(prefix.length);
    if (!name || name.indexOf("..") !== -1) return null;
    try {
      return decodeURIComponent(name);
    } catch (e) {
      return name;
    }
  }

  function collectCarStorageNames(car) {
    var names = [];
    if (!car) return names;
    var list = Array.isArray(car.images) ? car.images.slice() : [];
    if (car.image) list.push(car.image);
    list.forEach(function (src) {
      var objName = extractStorageObjectName(src);
      if (objName && names.indexOf(objName) === -1) names.push(objName);
    });
    return names;
  }

  function getUnusedCarStorageNames(targetCar, nextCarOrNull, allCars) {
    if (!targetCar) return [];
    var oldNames = collectCarStorageNames(targetCar);
    if (oldNames.length === 0) return [];

    var keepSet = {};
    if (nextCarOrNull) {
      collectCarStorageNames(nextCarOrNull).forEach(function (n) {
        keepSet[n] = true;
      });
    }
    (Array.isArray(allCars) ? allCars : []).forEach(function (other) {
      if (!other || other.id === targetCar.id) return;
      collectCarStorageNames(other).forEach(function (n) {
        keepSet[n] = true;
      });
    });

    return oldNames.filter(function (n) {
      return !keepSet[n];
    });
  }

  function deleteStorageObjects(objectNames) {
    var sb = getSupabaseConfig();
    var unique = [];
    (Array.isArray(objectNames) ? objectNames : []).forEach(function (name) {
      if (name && unique.indexOf(name) === -1) unique.push(name);
    });
    if (!sb.configured || unique.length === 0) {
      return Promise.resolve({ deleted: 0 });
    }

    var chain = Promise.resolve();
    var deletedTotal = 0;
    for (var i = 0; i < unique.length; i += 500) {
      (function (chunk) {
        chain = chain.then(function () {
          return supabaseFetch("/storage/v1/object/" + sb.bucket, {
            method: "DELETE",
            useAuth: true,
            body: JSON.stringify({ prefixes: chunk })
          }).then(function () {
            deletedTotal += chunk.length;
          });
        });
      })(unique.slice(i, i + 500));
    }
    return chain.then(function () {
      return { deleted: deletedTotal };
    });
  }

  function findCarById(list, carId) {
    var arr = Array.isArray(list) ? list : [];
    for (var i = 0; i < arr.length; i++) {
      if (arr[i] && arr[i].id === carId) return arr[i];
    }
    return null;
  }

  function upsertCar(car, existingCars, opts) {
    var sb = getSupabaseConfig();
    var normalized = normalizeCar(car);
    var skipStorageCleanup = Boolean(opts && opts.skipStorageCleanup);

    if (sb.configured) {
      var prevCar = findCarById(existingCars, normalized.id);
      var removedNames = !skipStorageCleanup && prevCar
        ? getUnusedCarStorageNames(prevCar, normalized, existingCars)
        : [];
      var row = toSupabaseRow(normalized, normalized.sortOrder);
      return supabaseFetch("/rest/v1/cars?on_conflict=id", {
        method: "POST",
        useAuth: true,
        headers: {
          Prefer: "resolution=merge-duplicates,return=representation"
        },
        body: JSON.stringify(row)
      }).then(function (rows) {
        var saved = Array.isArray(rows) && rows[0] ? normalizeCar(rows[0]) : normalized;
        if (removedNames.length > 0) {
          return deleteStorageObjects(removedNames)
            .catch(function () {})
            .then(function () {
              return saved;
            });
        }
        return saved;
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
      var targetCar = findCarById(existingCars, carId);
      var lookupPromise = targetCar
        ? Promise.resolve(targetCar)
        : supabaseFetch("/rest/v1/cars?id=eq." + encodeURIComponent(carId) + "&select=id,image,images", {
            useAuth: true
          }).then(function (rows) {
            return Array.isArray(rows) && rows[0] ? normalizeCar(rows[0]) : null;
          }).catch(function () {
            return null;
          });

      return lookupPromise.then(function (resolvedCar) {
        var unusedNames = resolvedCar ? getUnusedCarStorageNames(resolvedCar, null, existingCars) : [];
        return supabaseFetch("/rest/v1/cars?id=eq." + encodeURIComponent(carId), {
          method: "DELETE",
          useAuth: true
        }).then(function (res) {
          if (unusedNames.length > 0) {
            return deleteStorageObjects(unusedNames)
              .catch(function () {})
              .then(function () {
                return res;
              });
          }
          return res;
        });
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

  function dataUrlToBlob(dataUrl) {
    var parts = String(dataUrl || "").split(",");
    if (parts.length < 2) return null;
    var mimeMatch = parts[0].match(/data:([^;]+);base64/i);
    if (!mimeMatch) return null;
    var mime = mimeMatch[1];
    var bin = atob(parts[1]);
    var arr = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return new Blob([arr], { type: mime });
  }

  function extFromMime(mime) {
    var m = String(mime || "").toLowerCase();
    if (m.indexOf("png") !== -1) return "png";
    if (m.indexOf("webp") !== -1) return "webp";
    if (m.indexOf("webm") !== -1) return "webm";
    if (m.indexOf("quicktime") !== -1) return "mov";
    if (m.indexOf("mp4") !== -1) return "mp4";
    return "jpg";
  }

  function uploadBlobToSupabase(blob, ext) {
    var sb = getSupabaseConfig();
    var fileName = Date.now() + "-" + Math.random().toString(36).slice(2, 8) + "." + ext;
    return supabaseFetch("/storage/v1/object/" + sb.bucket + "/" + fileName, {
      method: "POST",
      useAuth: true,
      isUpload: true,
      headers: {
        "Content-Type": blob.type || "application/octet-stream",
        "x-upsert": "true"
      },
      body: blob
    }).then(function () {
      return sb.url + "/storage/v1/object/public/" + sb.bucket + "/" + fileName;
    });
  }

  function syncLocalDataToCloud() {
    var sb = getSupabaseConfig();
    if (!sb.configured) return Promise.reject(new Error("Supabase не налаштовано"));

    return Promise.all([
      getStoredLocalCars(),
      getStoredLocalSettings(),
      supabaseFetch("/rest/v1/cars?select=id,image,images", { useAuth: true })
    ]).then(function (res) {
      var localCars = Array.isArray(res[0]) && res[0].length ? res[0] : null;
      var localSettings = res[1];
      var cloudExisting = Array.isArray(res[2]) ? res[2].map(normalizeCar) : [];

      // Ніколи не підставляємо статичний js/data.js поверх вже заповненої хмарної бази,
      // інакше повторний клік перезапише актуальні авто застарілими URL і видалить фото зі Storage.
      if (!localCars && cloudExisting.length > 0) {
        var settingsChain = localSettings ? saveSettings(localSettings) : Promise.resolve();
        return settingsChain
          .then(function () {
            return resetLocalData().catch(function () {});
          })
          .then(function () {
            return { count: 0, skipped: true };
          });
      }

      var carsToSync = localCars || getBaseCars();
      var uploadedMap = {};

      function migrateUrl(src) {
        if (!src || String(src).indexOf("data:") !== 0) return Promise.resolve(src);
        if (uploadedMap[src]) return uploadedMap[src];
        var blob = dataUrlToBlob(src);
        if (!blob) return Promise.resolve(src);
        uploadedMap[src] = uploadBlobToSupabase(blob, extFromMime(blob.type));
        return uploadedMap[src];
      }

      var chain = Promise.resolve();
      carsToSync.forEach(function (car, idx) {
        chain = chain.then(function () {
          var media = Array.isArray(car.images) ? car.images : [car.image];
          return Promise.all([migrateUrl(car.image)].concat(media.map(migrateUrl))).then(function (urls) {
            var updatedCar = Object.assign({}, car, {
              image: urls[0],
              images: urls.slice(1),
              sortOrder: idx
            });
            return upsertCar(updatedCar, cloudExisting, { skipStorageCleanup: true }).then(function (saved) {
              var existingIdx = -1;
              for (var j = 0; j < cloudExisting.length; j++) {
                if (cloudExisting[j].id === saved.id) {
                  existingIdx = j;
                  break;
                }
              }
              if (existingIdx >= 0) cloudExisting[existingIdx] = saved;
              else cloudExisting.push(saved);
              return saved;
            });
          });
        });
      });

      if (localSettings) {
        chain = chain.then(function () {
          return saveSettings(localSettings);
        });
      }

      return chain
        .then(function () {
          return resetLocalData().catch(function () {});
        })
        .then(function () {
          return { count: carsToSync.length };
        });
    });
  }

  function listAllBucketObjects() {
    var sb = getSupabaseConfig();
    var all = [];
    var pageLimit = 1000;

    function fetchPage(offset, pagesLeft) {
      if (pagesLeft <= 0) return Promise.resolve(all);
      return supabaseFetch("/storage/v1/object/list/" + sb.bucket, {
        method: "POST",
        useAuth: true,
        body: JSON.stringify({
          prefix: "",
          limit: pageLimit,
          offset: offset,
          sortBy: { column: "name", order: "asc" }
        })
      }).then(function (items) {
        if (!Array.isArray(items) || items.length === 0) return all;
        items.forEach(function (item) {
          if (item && item.id && item.name) all.push(item);
        });
        if (items.length < pageLimit) return all;
        return fetchPage(offset + pageLimit, pagesLeft - 1);
      });
    }

    return fetchPage(0, 20);
  }

  function cleanupOrphanedStorageFiles(opts) {
    var sb = getSupabaseConfig();
    if (!sb.configured) return Promise.resolve({ scanned: 0, deleted: 0, freedBytes: 0 });
    var options = opts || {};
    var minAgeMs = typeof options.minAgeMs === "number" ? options.minAgeMs : 120000;
    var nowMs = Date.now();

    return Promise.all([
      supabaseFetch("/rest/v1/cars?select=id,image,images", { useAuth: true }),
      listAllBucketObjects()
    ]).then(function (results) {
      var rows = Array.isArray(results[0]) ? results[0] : [];
      var bucketFiles = Array.isArray(results[1]) ? results[1] : [];

      var activeSet = {};
      rows.forEach(function (row) {
        collectCarStorageNames(normalizeCar(row)).forEach(function (name) {
          activeSet[name] = true;
        });
      });

      var orphanNames = [];
      var freedBytes = 0;
      bucketFiles.forEach(function (item) {
        if (activeSet[item.name]) return;
        if (minAgeMs > 0 && item.created_at) {
          var createdMs = Date.parse(item.created_at);
          if (!isNaN(createdMs) && nowMs - createdMs < minAgeMs) return;
        }
        orphanNames.push(item.name);
        freedBytes += (item.metadata && Number(item.metadata.size)) || 0;
      });

      if (orphanNames.length === 0) {
        return { scanned: bucketFiles.length, deleted: 0, freedBytes: 0 };
      }

      return deleteStorageObjects(orphanNames).then(function (delRes) {
        return {
          scanned: bucketFiles.length,
          deleted: delRes.deleted,
          freedBytes: freedBytes
        };
      });
    });
  }

  function waitMs(ms) {
    return new Promise(function (resolve) {
      if (typeof setTimeout === "function") setTimeout(resolve, ms);
      else resolve();
    });
  }

  function syncNbuRatesNow() {
    var sb = getSupabaseConfig();
    if (!sb.configured) {
      return Promise.reject(new Error("Автооновлення НБУ доступне лише при підключеному Supabase"));
    }

    return supabaseFetch("/rest/v1/rpc/admin_request_nbu_rates", {
      method: "POST",
      useAuth: true,
      body: "{}"
    }).then(function () {
      var attemptsLeft = 10;
      function poll() {
        return waitMs(450).then(function () {
          return supabaseFetch("/rest/v1/rpc/admin_apply_nbu_rates", {
            method: "POST",
            useAuth: true,
            body: "{}"
          });
        }).then(function (res) {
          if (res && res.status === "applied") {
            return res;
          }
          if (res && res.status === "error") {
            throw new Error(res.error || "Помилка отримання курсу НБУ");
          }
          attemptsLeft -= 1;
          if (attemptsLeft <= 0) {
            throw new Error("НБУ не відповів вчасно — спробуйте ще раз");
          }
          return poll();
        });
      }
      return poll();
    });
  }

  function mapVinFuel(rawFuel) {
    var f = String(rawFuel || "").toLowerCase();
    if (f.indexOf("electric") !== -1) return "Електро";
    if (f.indexOf("hybrid") !== -1 || f.indexOf("phev") !== -1) return "Гібрид";
    if (f.indexOf("diesel") !== -1) return "Дизель";
    return "Бензин";
  }

  function mapVinDrive(rawDrive) {
    var d = String(rawDrive || "").toLowerCase();
    if (!d) return "";
    if (d.indexOf("awd") !== -1 || d.indexOf("4wd") !== -1 || d.indexOf("all") !== -1 || d.indexOf("4x4") !== -1) {
      return "Повний";
    }
    if (d.indexOf("fwd") !== -1 || d.indexOf("front") !== -1) return "Передній";
    if (d.indexOf("rwd") !== -1 || d.indexOf("rear") !== -1) return "Задній";
    return String(rawDrive || "").trim();
  }

  function mapVinTransmission(rawTrans) {
    var t = String(rawTrans || "").toLowerCase();
    if (!t) return "";
    if (t.indexOf("auto") !== -1) return "Автомат";
    if (t.indexOf("manual") !== -1) return "Механіка";
    if (t.indexOf("cvt") !== -1) return "Варіатор";
    return String(rawTrans || "").trim();
  }

  function mapVinBody(rawBody) {
    var b = String(rawBody || "").toLowerCase();
    if (!b) return { bodyType: "", vehicleType: "passenger" };
    if (b.indexOf("motorcycle") !== -1) return { bodyType: "Мотоцикл", vehicleType: "moto" };
    if (b.indexOf("crossover") !== -1 || b.indexOf("cuv") !== -1) {
      return { bodyType: "Кросовер", vehicleType: "crossover" };
    }
    if (b.indexOf("suv") !== -1 || b.indexOf("utility") !== -1) {
      return { bodyType: "Позашляховик", vehicleType: "suv" };
    }
    if (b.indexOf("pickup") !== -1) return { bodyType: "Пікап", vehicleType: "van" };
    if (b.indexOf("van") !== -1) return { bodyType: "Мінівен", vehicleType: "van" };
    if (b.indexOf("wagon") !== -1) return { bodyType: "Універсал", vehicleType: "passenger" };
    if (b.indexOf("hatchback") !== -1) return { bodyType: "Хетчбек", vehicleType: "passenger" };
    if (b.indexOf("coupe") !== -1) return { bodyType: "Купе", vehicleType: "passenger" };
    if (b.indexOf("convertible") !== -1) return { bodyType: "Кабріолет", vehicleType: "passenger" };
    if (b.indexOf("sedan") !== -1) return { bodyType: "Седан", vehicleType: "passenger" };
    return { bodyType: String(rawBody || "").trim(), vehicleType: "passenger" };
  }

  function decodeVinDirect(vin) {
    var url =
      "https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValuesExtended/" +
      encodeURIComponent(vin) +
      "?format=json";
    return fetch(url)
      .then(function (res) {
        if (!res.ok) throw new Error("VIN-сервіс повернув HTTP " + res.status);
        return res.json();
      })
      .then(function (data) {
        var row = data && Array.isArray(data.Results) ? data.Results[0] : null;
        var make = row && row.Make ? String(row.Make).trim() : "";
        var model = row && row.Model ? String(row.Model).trim() : "";
        if (!make && !model) {
          throw new Error("Не вдалося розшифрувати VIN " + vin);
        }
        var yearNum = Number(row.ModelYear);
        var disp = Number(row.DisplacementL);
        var body = mapVinBody(row.BodyClass);
        return {
          source: "vin",
          vin: vin,
          brand: make,
          model: model,
          year: !isNaN(yearNum) && yearNum > 1950 ? yearNum : null,
          mileageThousandKm: null,
          priceUsd: null,
          fuel: mapVinFuel(row.FuelTypePrimary),
          engineLabel: !isNaN(disp) && disp > 0 ? disp.toFixed(1) + "L" : "",
          vehicleType: body.vehicleType,
          transmission: mapVinTransmission(row.TransmissionStyle),
          drive: mapVinDrive(row.DriveType),
          bodyType: body.bodyType,
          color: "",
          description: "",
          images: []
        };
      });
  }

  function importCarFromSource(rawInput, opts) {
    var trimmed = String(rawInput || "").trim();
    if (!trimmed) {
      return Promise.reject(new Error("Вставте посилання на auto.ria.com або 17-значний VIN-код"));
    }

    var sb = getSupabaseConfig();
    if (sb.configured) {
      var uploadPhotos = !(opts && opts.uploadPhotos === false);
      return supabaseFetch("/functions/v1/import-car", {
        method: "POST",
        useAuth: true,
        body: JSON.stringify({
          input: trimmed,
          uploadPhotos: uploadPhotos
        })
      });
    }

    var vinCandidate = trimmed.toUpperCase();
    if (/^[A-HJ-NPR-Z0-9]{17}$/.test(vinCandidate)) {
      return decodeVinDirect(vinCandidate);
    }

    return Promise.reject(
      new Error("Імпорт за посиланням AUTO.RIA працює у хмарному режимі Supabase (у локальному режимі доступне лише розшифрування 17-значного VIN)")
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
    mergeCustomCatalog: mergeCustomCatalog,
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
    syncLocalDataToCloud: syncLocalDataToCloud,
    cleanupOrphanedStorageFiles: cleanupOrphanedStorageFiles,
    syncNbuRatesNow: syncNbuRatesNow,
    importCarFromSource: importCarFromSource,
    uploadMedia: uploadMedia,
    uploadPhoto: uploadMedia,
    buildExportDataJs: buildExportDataJs
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
