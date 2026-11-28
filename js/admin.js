(function () {
  "use strict";

  var store = window.LubeAvtoStore;
  var FUEL_TO_TYPE = {
    "Бензин": "petrol",
    "Дизель": "diesel",
    "Електро": "electric",
    "Гібрид": "hybrid"
  };

  var state = {
    config: null,
    cars: [],
    photos: [],
    coverIndex: 0,
    uploadingCount: 0,
    isSavingCar: false,
    editingOriginalPriceUsd: null,
    editingOriginalOldPriceUsd: null
  };

  var els = {};

  function showToast(msg) {
    if (!els.toast) return;
    els.toast.textContent = msg;
    els.toast.hidden = false;
    clearTimeout(showToast._t);
    showToast._t = setTimeout(function () {
      els.toast.hidden = true;
    }, 3200);
  }

  function cacheElements() {
    els.modePill = document.getElementById("mode-pill");
    els.logoutBtn = document.getElementById("logout-btn");
    els.loginView = document.getElementById("login-view");
    els.dashboardView = document.getElementById("dashboard-view");
    els.loginForm = document.getElementById("login-form");
    els.loginEmailWrap = document.getElementById("login-email-wrap");
    els.loginEmail = document.getElementById("login-email");
    els.loginPassword = document.getElementById("login-password");
    els.loginLocalHint = document.getElementById("login-local-hint");
    els.loginError = document.getElementById("login-error");

    els.tabs = document.querySelectorAll(".admin-tab");
    els.tabCarsCount = document.getElementById("tab-cars-count");
    els.panelCars = document.getElementById("panel-cars");
    els.panelSettings = document.getElementById("panel-settings");
    els.panelDeploy = document.getElementById("panel-deploy");

    els.carForm = document.getElementById("car-form");
    els.carFormTitle = document.getElementById("car-form-title");
    els.carFormCancel = document.getElementById("car-form-cancel");
    els.carId = document.getElementById("car-id");
    els.carBrand = document.getElementById("car-brand");
    els.carModel = document.getElementById("car-model");
    els.brandCombobox = document.getElementById("brand-combobox");
    els.brandTrigger = document.getElementById("brand-trigger");
    els.brandTriggerText = document.getElementById("brand-trigger-text");
    els.brandPopover = document.getElementById("brand-popover");
    els.brandSearch = document.getElementById("brand-search");
    els.brandList = document.getElementById("brand-list");
    els.brandAddRow = document.getElementById("brand-add-row");
    els.brandAddBtn = document.getElementById("brand-add-btn");
    els.modelCombobox = document.getElementById("model-combobox");
    els.modelTrigger = document.getElementById("model-trigger");
    els.modelTriggerText = document.getElementById("model-trigger-text");
    els.modelPopover = document.getElementById("model-popover");
    els.modelSearch = document.getElementById("model-search");
    els.modelList = document.getElementById("model-list");
    els.modelAddRow = document.getElementById("model-add-row");
    els.modelAddBtn = document.getElementById("model-add-btn");
    els.carTitle = document.getElementById("car-title");
    els.carYear = document.getElementById("car-year");
    els.carMileage = document.getElementById("car-mileage");
    els.carPrice = document.getElementById("car-price");
    els.carOldPrice = document.getElementById("car-old-price");
    els.carDiscountPreview = document.getElementById("car-discount-preview");
    els.carFuel = document.getElementById("car-fuel");
    els.carStatus = document.getElementById("car-status");
    els.carEngineLabel = document.getElementById("car-engine-label");
    els.carEngineCc = document.getElementById("car-engine-cc");
    els.carVehicleType = document.getElementById("car-vehicle-type");
    els.carTransmission = document.getElementById("car-transmission");
    els.carDrive = document.getElementById("car-drive");
    els.carBodyType = document.getElementById("car-body-type");
    els.carColor = document.getElementById("car-color");
    els.carDesc = document.getElementById("car-desc");
    els.carPhotosInput = document.getElementById("car-photos-input");
    els.carPhotoUrl = document.getElementById("car-photo-url");
    els.addPhotoUrlBtn = document.getElementById("add-photo-url-btn");
    els.carPhotosPreview = document.getElementById("car-photos-preview");
    els.carSubmitBtn = document.getElementById("car-submit-btn");

    els.carsSearch = document.getElementById("admin-cars-search");
    els.carsList = document.getElementById("admin-cars-list");

    els.settingsForm = document.getElementById("settings-form");
    els.setPhoneDisplay = document.getElementById("set-phone-display");
    els.setPhoneHref = document.getElementById("set-phone-href");
    els.setTelegramUrl = document.getElementById("set-telegram-url");
    els.setWorkHours = document.getElementById("set-work-hours");
    els.setCity = document.getElementById("set-city");
    els.setRateUsd = document.getElementById("set-rate-usd");
    els.setRateEur = document.getElementById("set-rate-eur");
    els.setRatesAutoSync = document.getElementById("set-rates-auto-sync");
    els.ratesSyncStatus = document.getElementById("rates-sync-status");
    els.syncNbuRatesBtn = document.getElementById("sync-nbu-rates-btn");
    els.localPassSetting = document.getElementById("local-pass-setting");
    els.setLocalPassword = document.getElementById("set-local-password");

    els.exportDataJsBtn = document.getElementById("export-data-js-btn");
    els.resetLocalBtn = document.getElementById("reset-local-btn");
    els.syncCloudBtn = document.getElementById("sync-cloud-btn");
    els.cleanupStorageBtn = document.getElementById("cleanup-storage-btn");
    els.cloudStatusText = document.getElementById("cloud-status-text");
    els.toast = document.getElementById("admin-toast");
  }

  function formatBytesMb(bytes) {
    return ((Number(bytes) || 0) / (1024 * 1024)).toFixed(1) + " МБ";
  }

  function updateSubmitBtnState() {
    if (!els.carSubmitBtn) return;
    if (state.isSavingCar) {
      els.carSubmitBtn.disabled = true;
      els.carSubmitBtn.textContent = "Збереження авто...";
    } else if (state.uploadingCount > 0) {
      els.carSubmitBtn.disabled = true;
      els.carSubmitBtn.textContent = "Завантаження медіа...";
    } else {
      els.carSubmitBtn.disabled = false;
      els.carSubmitBtn.textContent = "Зберегти авто на майданчик";
    }
  }

  function handleActionError(prefix, err) {
    if (err && err.code === "AUTH_EXPIRED") {
      showLogin();
      showToast(err.message);
      return;
    }
    showToast(prefix + (err && err.message ? err.message : "Невідома помилка"));
  }

  function updateModeUi() {
    var sb = store.getSupabaseConfig();
    if (sb.configured) {
      els.modePill.textContent = "Хмара Supabase";
      els.modePill.classList.add("is-cloud");
      els.loginEmailWrap.hidden = false;
      els.loginEmail.required = true;
      els.loginLocalHint.hidden = true;
      els.localPassSetting.hidden = true;
      els.resetLocalBtn.hidden = true;
      if (els.syncCloudBtn) els.syncCloudBtn.hidden = true;
      if (els.cleanupStorageBtn) els.cleanupStorageBtn.hidden = false;
      if (els.syncNbuRatesBtn) els.syncNbuRatesBtn.hidden = false;
      els.cloudStatusText.textContent =
        "Підключено Supabase (" + sb.url + "). Усі зміни синхронізуються миттєво для всіх відвідувачів.";
    } else {
      els.modePill.textContent = "Локальний режим";
      els.modePill.classList.remove("is-cloud");
      els.loginEmailWrap.hidden = true;
      els.loginEmail.required = false;
      els.loginLocalHint.hidden = false;
      els.localPassSetting.hidden = false;
      els.resetLocalBtn.hidden = false;
      if (els.syncCloudBtn) els.syncCloudBtn.hidden = true;
      if (els.cleanupStorageBtn) els.cleanupStorageBtn.hidden = true;
      if (els.syncNbuRatesBtn) els.syncNbuRatesBtn.hidden = true;
    }
  }

  function isVideo(src) {
    return Boolean(store && typeof store.isVideoUrl === "function" && store.isVideoUrl(src));
  }

  function findFirstPhotoIndex(list) {
    for (var i = 0; i < list.length; i++) {
      if (!isVideo(list[i])) return i;
    }
    return -1;
  }

  var draggedPhotoIndex = -1;

  function movePhotoItem(fromIdx, toIdx) {
    if (
      fromIdx === toIdx ||
      fromIdx < 0 ||
      toIdx < 0 ||
      fromIdx >= state.photos.length ||
      toIdx >= state.photos.length
    ) {
      return;
    }
    var moved = state.photos.splice(fromIdx, 1)[0];
    state.photos.splice(toIdx, 0, moved);

    if (state.coverIndex === fromIdx) {
      state.coverIndex = toIdx;
    } else if (fromIdx < state.coverIndex && state.coverIndex <= toIdx) {
      state.coverIndex -= 1;
    } else if (toIdx <= state.coverIndex && state.coverIndex < fromIdx) {
      state.coverIndex += 1;
    }
    renderPhotoPreviews();
  }

  function clearPhotoDragClasses() {
    var nodes = Array.prototype.slice.call(els.carPhotosPreview.children || []);
    nodes.forEach(function (node) {
      node.classList.remove("is-dragging");
      node.classList.remove("is-drag-over");
    });
  }

  function renderPhotoPreviews() {
    els.carPhotosPreview.innerHTML = "";
    if (isVideo(state.photos[state.coverIndex])) {
      var firstImgIdx = findFirstPhotoIndex(state.photos);
      if (firstImgIdx >= 0) state.coverIndex = firstImgIdx;
    }

    state.photos.forEach(function (src, idx) {
      var videoItem = isVideo(src);
      var ytThumb = videoItem && store.getYouTubeThumbUrl ? store.getYouTubeThumbUrl(src) : null;
      var wrap = document.createElement("div");
      wrap.className = "photo-thumb" + (!videoItem && idx === state.coverIndex ? " is-cover" : "");
      wrap.draggable = true;
      wrap.setAttribute("data-index", String(idx));
      wrap.title = "Перетягніть мишкою або змініть порядок стрілками ◀ ▶";

      wrap.addEventListener("dragstart", function (e) {
        if (e.target && e.target.tagName === "BUTTON") {
          if (e.preventDefault) e.preventDefault();
          return;
        }
        draggedPhotoIndex = idx;
        wrap.classList.add("is-dragging");
        if (e.dataTransfer) {
          e.dataTransfer.effectAllowed = "move";
          try {
            e.dataTransfer.setData("text/plain", String(idx));
          } catch (err) {}
        }
      });

      wrap.addEventListener("dragover", function (e) {
        if (draggedPhotoIndex < 0 || draggedPhotoIndex === idx) return;
        if (e.preventDefault) e.preventDefault();
        if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
        wrap.classList.add("is-drag-over");
      });

      wrap.addEventListener("dragleave", function () {
        wrap.classList.remove("is-drag-over");
      });

      wrap.addEventListener("drop", function (e) {
        if (e.preventDefault) e.preventDefault();
        wrap.classList.remove("is-drag-over");
        var fromIdx = draggedPhotoIndex;
        if (fromIdx < 0 && e.dataTransfer) {
          var raw = e.dataTransfer.getData("text/plain");
          if (raw !== "") fromIdx = Number(raw);
        }
        draggedPhotoIndex = -1;
        clearPhotoDragClasses();
        if (fromIdx >= 0 && !isNaN(fromIdx)) {
          movePhotoItem(fromIdx, idx);
        }
      });

      wrap.addEventListener("dragend", function () {
        draggedPhotoIndex = -1;
        clearPhotoDragClasses();
      });

      if (videoItem && !ytThumb) {
        var videoEl = document.createElement("video");
        videoEl.src = src;
        videoEl.muted = true;
        videoEl.playsInline = true;
        videoEl.preload = "metadata";
        videoEl.draggable = false;
        wrap.appendChild(videoEl);
      } else {
        var img = document.createElement("img");
        img.src = ytThumb || src;
        img.alt = (videoItem ? "Відео авто " : "Фото авто ") + (idx + 1);
        img.draggable = false;
        wrap.appendChild(img);
      }

      if (videoItem) {
        var badge = document.createElement("span");
        badge.className = "photo-thumb__badge";
        badge.textContent = ytThumb ? "▶ YouTube" : "▶ Відео";
        wrap.appendChild(badge);
      }

      var bar = document.createElement("div");
      bar.className = "photo-thumb__actions";

      if (videoItem) {
        var typeTag = document.createElement("span");
        typeTag.className = "thumb-btn";
        typeTag.textContent = "Відеофайл";
        bar.appendChild(typeTag);
      } else {
        var coverBtn = document.createElement("button");
        coverBtn.type = "button";
        coverBtn.className = "thumb-btn thumb-btn--cover";
        coverBtn.textContent = idx === state.coverIndex ? "★ Головне" : "Зробити гол.";
        coverBtn.addEventListener("click", function (e) {
          if (e && e.stopPropagation) e.stopPropagation();
          state.coverIndex = idx;
          renderPhotoPreviews();
        });
        bar.appendChild(coverBtn);
      }

      var delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "thumb-btn thumb-btn--del";
      delBtn.textContent = "✕";
      delBtn.addEventListener("click", function (e) {
        if (e && e.stopPropagation) e.stopPropagation();
        state.photos.splice(idx, 1);
        if (idx < state.coverIndex) {
          state.coverIndex -= 1;
        } else if (idx === state.coverIndex || state.coverIndex >= state.photos.length) {
          var nextImgIdx = findFirstPhotoIndex(state.photos);
          state.coverIndex = nextImgIdx >= 0 ? nextImgIdx : 0;
        } else if (isVideo(state.photos[state.coverIndex])) {
          var fallbackImgIdx = findFirstPhotoIndex(state.photos);
          state.coverIndex = fallbackImgIdx >= 0 ? fallbackImgIdx : 0;
        }
        renderPhotoPreviews();
      });

      bar.appendChild(delBtn);
      wrap.appendChild(bar);

      if (state.photos.length > 1) {
        var moveBar = document.createElement("div");
        moveBar.className = "photo-thumb__move";

        var leftBtn = document.createElement("button");
        leftBtn.type = "button";
        leftBtn.className = "thumb-move-btn";
        leftBtn.textContent = "◀";
        leftBtn.title = "Перемістити лівіше";
        leftBtn.setAttribute("aria-label", "Перемістити фото лівіше");
        leftBtn.disabled = idx === 0;
        leftBtn.addEventListener("click", function (e) {
          if (e && e.stopPropagation) e.stopPropagation();
          movePhotoItem(idx, idx - 1);
        });

        var rightBtn = document.createElement("button");
        rightBtn.type = "button";
        rightBtn.className = "thumb-move-btn";
        rightBtn.textContent = "▶";
        rightBtn.title = "Перемістити правіше";
        rightBtn.setAttribute("aria-label", "Перемістити фото правіше");
        rightBtn.disabled = idx === state.photos.length - 1;
        rightBtn.addEventListener("click", function (e) {
          if (e && e.stopPropagation) e.stopPropagation();
          movePhotoItem(idx, idx + 1);
        });

        moveBar.appendChild(leftBtn);
        moveBar.appendChild(rightBtn);
        wrap.appendChild(moveBar);
      }

      els.carPhotosPreview.appendChild(wrap);
    });
  }

  function formatAdminUsd(num) {
    return String(Math.round(Number(num) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " $";
  }

  function parseOptionalPrice(raw) {
    var trimmed = String(raw == null ? "" : raw).trim();
    if (!trimmed) return null;
    var val = Number(trimmed);
    return !isNaN(val) && val > 0 ? val : null;
  }

  function resolveCarPricing() {
    var nextPrice = Number(els.carPrice && els.carPrice.value) || 0;
    var manualOldRaw = parseOptionalPrice(els.carOldPrice ? els.carOldPrice.value : "");
    var editingId = els.carId ? String(els.carId.value || "").trim() : "";
    var origPrice = state.editingOriginalPriceUsd;
    var origOldPrice = state.editingOriginalOldPriceUsd;

    var oldPriceEditedManually = editingId
      ? manualOldRaw !== origOldPrice
      : manualOldRaw != null;

    var resolvedOld = manualOldRaw;
    var isAutoAssigned = false;

    if (editingId && !oldPriceEditedManually && origPrice > 0 && nextPrice > 0) {
      if (nextPrice < origPrice) {
        resolvedOld = origPrice;
        isAutoAssigned = true;
      } else if (nextPrice > origPrice) {
        resolvedOld = null;
      }
    }

    if (!(resolvedOld != null && resolvedOld > nextPrice && nextPrice > 0)) {
      resolvedOld = null;
      isAutoAssigned = false;
    }

    return {
      priceUsd: nextPrice,
      oldPriceUsd: resolvedOld,
      isAutoAssigned: isAutoAssigned
    };
  }

  function updateDiscountPreview() {
    if (!els.carDiscountPreview) return;
    var pricing = resolveCarPricing();
    els.carDiscountPreview.innerHTML = "";
    if (!pricing.oldPriceUsd) {
      els.carDiscountPreview.hidden = true;
      return;
    }

    var prefix = pricing.isAutoAssigned
      ? "Автоматично покаже знижку: "
      : "На сайті покаже зі знижкою: ";
    var strike = document.createElement("s");
    strike.textContent = formatAdminUsd(pricing.oldPriceUsd);
    var savings = formatAdminUsd(pricing.oldPriceUsd - pricing.priceUsd);

    els.carDiscountPreview.appendChild(document.createTextNode(prefix));
    els.carDiscountPreview.appendChild(strike);
    els.carDiscountPreview.appendChild(
      document.createTextNode(" → " + formatAdminUsd(pricing.priceUsd) + " (знижка " + savings + ")")
    );
    els.carDiscountPreview.hidden = false;
  }

  var brandCombo = null;
  var modelCombo = null;
  var adminCombos = [];

  function normalizeCatalogLabel(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function findCaseInsensitiveMatch(list, value) {
    var lower = normalizeCatalogLabel(value).toLowerCase();
    if (!lower || !Array.isArray(list)) return null;
    for (var i = 0; i < list.length; i++) {
      if (String(list[i] || "").toLowerCase() === lower) return list[i];
    }
    return null;
  }

  function findCatalogBrandKey(catalog, brand) {
    return findCaseInsensitiveMatch(Object.keys(catalog || {}), brand);
  }

  function mergeCatalogSources() {
    var args = Array.prototype.slice.call(arguments);
    var result = {};
    args.forEach(function (src) {
      if (!src || typeof src !== "object") return;
      if (store && typeof store.mergeCustomCatalog === "function") {
        result = store.mergeCustomCatalog(result, src);
      } else {
        Object.keys(src).forEach(function (k) {
          var existingKey = findCatalogBrandKey(result, k);
          var key = existingKey || normalizeCatalogLabel(k);
          if (!key) return;
          if (!Array.isArray(result[key])) result[key] = [];
          (Array.isArray(src[k]) ? src[k] : []).forEach(function (m) {
            var cleanModel = normalizeCatalogLabel(m);
            if (cleanModel && !findCaseInsensitiveMatch(result[key], cleanModel)) {
              result[key].push(cleanModel);
            }
          });
        });
      }
    });
    return result;
  }

  function getMergedVehicleCatalog() {
    var baseCatalog = window.LUBE_AVTO_VEHICLE_CATALOG || {};
    var customCatalog = state.config && state.config.customCatalog ? state.config.customCatalog : {};
    var carsCatalog = {};
    (Array.isArray(state.cars) ? state.cars : []).forEach(function (car) {
      var b = normalizeCatalogLabel(car && car.brand);
      var m = normalizeCatalogLabel(car && car.model);
      if (!b) return;
      if (!carsCatalog[b]) carsCatalog[b] = [];
      if (m && !findCaseInsensitiveMatch(carsCatalog[b], m)) {
        carsCatalog[b].push(m);
      }
    });
    return mergeCatalogSources(baseCatalog, customCatalog, carsCatalog);
  }

  function compareVehicleLabels(a, b) {
    return String(a || "").localeCompare(String(b || ""), "en", { sensitivity: "base", numeric: true });
  }

  function getSortedBrands() {
    var catalog = getMergedVehicleCatalog();
    return Object.keys(catalog).sort(compareVehicleLabels);
  }

  function getSortedModelsForBrand(brand) {
    var cleanBrand = normalizeCatalogLabel(brand);
    if (!cleanBrand) return [];
    var catalog = getMergedVehicleCatalog();
    var matchedKey = findCatalogBrandKey(catalog, cleanBrand);
    var models = matchedKey && Array.isArray(catalog[matchedKey]) ? catalog[matchedKey].slice() : [];
    return models.sort(compareVehicleLabels);
  }

  function buildSettingsPayload(baseCfg, patch) {
    var cfg = baseCfg || {};
    var rates = cfg.rates || {};
    var customCatalog = mergeCatalogSources(cfg.customCatalog, patch && patch.customCatalog);
    var payload = {
      companyName: cfg.companyName || "Любе Авто Мостиська",
      city: cfg.city || "",
      addressNote: cfg.addressNote || "",
      workHours: cfg.workHours || "",
      phoneDisplay: cfg.phoneDisplay || "",
      phoneHref: cfg.phoneHref || "",
      telegramUsername: cfg.telegramUsername || "",
      telegramUrl: cfg.telegramUrl || "",
      rates: {
        usdToUah: Number(rates.usdToUah) || 44.93,
        eurToUsd: Number(rates.eurToUsd) || 1.11044
      },
      ratesAutoSync: cfg.ratesAutoSync !== false,
      ratesSource: cfg.ratesSource || "НБУ",
      ratesExchangeDate: cfg.ratesExchangeDate || "",
      ratesUpdatedAt: cfg.ratesUpdatedAt || "",
      customCatalog: customCatalog
    };

    if (patch && typeof patch === "object") {
      Object.keys(patch).forEach(function (key) {
        if (key === "customCatalog") return;
        if (key === "rates" && patch.rates && typeof patch.rates === "object") {
          payload.rates = {
            usdToUah: Number(patch.rates.usdToUah) || payload.rates.usdToUah,
            eurToUsd: Number(patch.rates.eurToUsd) || payload.rates.eurToUsd
          };
          return;
        }
        payload[key] = patch[key];
      });
    }
    return payload;
  }

  function persistCustomVehicleEntry(rawBrand, rawModel) {
    var brand = normalizeCatalogLabel(rawBrand);
    var model = normalizeCatalogLabel(rawModel);
    if (!brand) return Promise.resolve();

    var addPatch = {};
    addPatch[brand] = model ? [model] : [];
    var prevConfig = state.config || (store && store.getBaseConfig ? store.getBaseConfig() : {});
    var nextPayload = buildSettingsPayload(prevConfig, { customCatalog: addPatch });
    state.config = Object.assign({}, prevConfig, nextPayload);

    if (!store || typeof store.saveSettings !== "function") {
      return Promise.resolve();
    }
    return store.saveSettings(nextPayload);
  }

  function closeAllAdminCombos(exceptCombo) {
    adminCombos.forEach(function (combo) {
      if (combo !== exceptCombo) combo.close();
    });
  }

  function createAdminCombobox(opts) {
    if (!opts || !opts.comboboxEl || !opts.triggerEl || !opts.hiddenInputEl) return null;

    var isDisabled = Boolean(opts.triggerEl.disabled);

    function syncTriggerDisplay() {
      var val = normalizeCatalogLabel(opts.hiddenInputEl.value);
      if (isDisabled) {
        opts.triggerTextEl.textContent = opts.disabledPlaceholder || opts.placeholder;
        opts.triggerEl.classList.add("is-placeholder", "is-disabled");
        opts.triggerEl.disabled = true;
        return;
      }
      opts.triggerEl.disabled = false;
      opts.triggerEl.classList.remove("is-disabled");
      if (val) {
        opts.triggerTextEl.textContent = val;
        opts.triggerEl.classList.remove("is-placeholder");
      } else {
        opts.triggerTextEl.textContent = opts.placeholder;
        opts.triggerEl.classList.add("is-placeholder");
      }
    }

    function close() {
      if (opts.popoverEl.hidden) return;
      opts.popoverEl.hidden = true;
      opts.triggerEl.setAttribute("aria-expanded", "false");
      opts.comboboxEl.classList.remove("is-dropdown-open");
      if (opts.searchInputEl && opts.searchPlaceholder) {
        opts.searchInputEl.placeholder = opts.searchPlaceholder;
      }
    }

    function render(queryText) {
      var items = opts.getItems() || [];
      var cleanQuery = normalizeCatalogLabel(queryText);
      var lowerQuery = cleanQuery.toLowerCase();
      var currentLower = normalizeCatalogLabel(opts.hiddenInputEl.value).toLowerCase();

      var filtered = items.filter(function (item) {
        if (!lowerQuery) return true;
        return String(item || "").toLowerCase().indexOf(lowerQuery) !== -1;
      });

      opts.listEl.innerHTML = "";
      if (filtered.length === 0) {
        var emptyLi = document.createElement("li");
        emptyLi.className = "admin-combo-empty";
        emptyLi.textContent = cleanQuery
          ? "Нічого не знайдено — додайте нижче"
          : (opts.emptyListText || "Список порожній — додайте новий запис нижче");
        opts.listEl.appendChild(emptyLi);
      } else {
        filtered.forEach(function (item) {
          var isSelected = Boolean(currentLower && String(item).toLowerCase() === currentLower);
          var li = document.createElement("li");
          li.className = "admin-combo-item" + (isSelected ? " is-selected" : "");
          li.setAttribute("role", "option");
          li.setAttribute("aria-selected", String(isSelected));

          var nameSpan = document.createElement("span");
          nameSpan.className = "admin-combo-item__name";
          nameSpan.textContent = item;
          li.appendChild(nameSpan);

          if (isSelected) {
            var checkSpan = document.createElement("span");
            checkSpan.className = "admin-combo-item__check";
            checkSpan.textContent = "✓";
            li.appendChild(checkSpan);
          }

          li.addEventListener("click", function () {
            selectValue(item);
          });
          opts.listEl.appendChild(li);
        });
      }

      var exactMatch = findCaseInsensitiveMatch(items, cleanQuery);
      if (opts.addRowEl && opts.addBtnEl) {
        if (cleanQuery && !exactMatch) {
          opts.addBtnEl.textContent = "+ Додати " + opts.entityLabelGenitive + " «" + cleanQuery + "»";
          opts.addBtnEl.setAttribute("data-mode", "create");
          opts.addRowEl.hidden = false;
        } else if (!cleanQuery) {
          opts.addBtnEl.textContent = "+ Додати нову " + opts.entityLabelAccusative + "...";
          opts.addBtnEl.setAttribute("data-mode", "focus");
          opts.addRowEl.hidden = false;
        } else {
          opts.addRowEl.hidden = true;
        }
      }

      return { filtered: filtered, exactMatch: exactMatch, cleanQuery: cleanQuery };
    }

    function selectValue(val) {
      var clean = normalizeCatalogLabel(val);
      var prev = normalizeCatalogLabel(opts.hiddenInputEl.value);
      opts.hiddenInputEl.value = clean;
      opts.triggerEl.classList.remove("is-invalid");
      syncTriggerDisplay();
      close();
      if (typeof opts.onSelect === "function") {
        opts.onSelect(clean, prev);
      }
    }

    function open() {
      if (isDisabled) return;
      closeAllAdminCombos(api);
      opts.popoverEl.hidden = false;
      opts.triggerEl.setAttribute("aria-expanded", "true");
      opts.comboboxEl.classList.add("is-dropdown-open");
      if (opts.searchInputEl) {
        opts.searchInputEl.value = "";
        if (opts.searchPlaceholder) opts.searchInputEl.placeholder = opts.searchPlaceholder;
      }
      render("");
      var selectedEl = opts.listEl ? opts.listEl.querySelector(".admin-combo-item.is-selected") : null;
      if (selectedEl && typeof selectedEl.scrollIntoView === "function") {
        selectedEl.scrollIntoView({ block: "nearest" });
      }
      if (opts.searchInputEl) {
        setTimeout(function () {
          opts.searchInputEl.focus();
        }, 0);
      }
    }

    function handleAddFromInput() {
      var raw = opts.searchInputEl ? opts.searchInputEl.value : "";
      var clean = normalizeCatalogLabel(raw);
      if (!clean) {
        if (opts.searchInputEl) {
          if (opts.addFocusPlaceholder) opts.searchInputEl.placeholder = opts.addFocusPlaceholder;
          opts.searchInputEl.focus();
        }
        return;
      }
      var existing = findCaseInsensitiveMatch(opts.getItems(), clean);
      if (existing) {
        selectValue(existing);
        return;
      }
      if (typeof opts.onAdd === "function") {
        var resolved = opts.onAdd(clean) || clean;
        selectValue(resolved);
      } else {
        selectValue(clean);
      }
    }

    opts.triggerEl.addEventListener("click", function () {
      if (isDisabled) return;
      if (opts.popoverEl.hidden) open();
      else close();
    });

    if (opts.searchInputEl) {
      opts.searchInputEl.addEventListener("input", function () {
        render(opts.searchInputEl.value);
      });

      opts.searchInputEl.addEventListener("keydown", function (e) {
        if (e.key === "Escape") {
          e.preventDefault();
          close();
          opts.triggerEl.focus();
          return;
        }
        if (e.key === "Enter") {
          e.preventDefault();
          var res = render(opts.searchInputEl.value);
          if (res.exactMatch) {
            selectValue(res.exactMatch);
          } else if (res.cleanQuery && res.filtered.length === 0) {
            handleAddFromInput();
          } else if (res.cleanQuery && res.filtered.length === 1) {
            selectValue(res.filtered[0]);
          }
        }
      });
    }

    if (opts.addBtnEl) {
      opts.addBtnEl.addEventListener("click", handleAddFromInput);
    }

    var api = {
      open: open,
      close: close,
      render: function () {
        render(opts.searchInputEl ? opts.searchInputEl.value : "");
      },
      isOpen: function () {
        return !opts.popoverEl.hidden;
      },
      setValue: function (val) {
        opts.hiddenInputEl.value = normalizeCatalogLabel(val);
        opts.triggerEl.classList.remove("is-invalid");
        syncTriggerDisplay();
      },
      setDisabled: function (disabled) {
        isDisabled = Boolean(disabled);
        if (isDisabled) {
          close();
          opts.hiddenInputEl.value = "";
          opts.triggerEl.classList.remove("is-invalid");
        }
        syncTriggerDisplay();
      },
      getValue: function () {
        return normalizeCatalogLabel(opts.hiddenInputEl.value);
      }
    };

    adminCombos.push(api);
    syncTriggerDisplay();
    return api;
  }

  function initVehicleComboboxes() {
    adminCombos = [];
    brandCombo = createAdminCombobox({
      comboboxEl: els.brandCombobox,
      triggerEl: els.brandTrigger,
      triggerTextEl: els.brandTriggerText,
      hiddenInputEl: els.carBrand,
      popoverEl: els.brandPopover,
      searchInputEl: els.brandSearch,
      listEl: els.brandList,
      addRowEl: els.brandAddRow,
      addBtnEl: els.brandAddBtn,
      placeholder: "Оберіть марку",
      searchPlaceholder: "Знайти марку...",
      addFocusPlaceholder: "Введіть назву нової марки...",
      emptyListText: "Марок не знайдено",
      entityLabelGenitive: "марку",
      entityLabelAccusative: "марку",
      getItems: getSortedBrands,
      onSelect: function (nextBrand, prevBrand) {
        if (!modelCombo) return;
        var changed = nextBrand.toLowerCase() !== String(prevBrand || "").toLowerCase();
        modelCombo.setDisabled(!nextBrand);
        if (changed) {
          modelCombo.setValue("");
        }
      },
      onAdd: function (newBrand) {
        var clean = normalizeCatalogLabel(newBrand);
        persistCustomVehicleEntry(clean, "")
          .then(function () {
            showToast("Марку «" + clean + "» додано до списку");
          })
          .catch(function (err) {
            showToast("Марку «" + clean + "» вибрано, але не вдалося зберегти в хмару: " + (err && err.message ? err.message : ""));
          });
        return clean;
      }
    });

    modelCombo = createAdminCombobox({
      comboboxEl: els.modelCombobox,
      triggerEl: els.modelTrigger,
      triggerTextEl: els.modelTriggerText,
      hiddenInputEl: els.carModel,
      popoverEl: els.modelPopover,
      searchInputEl: els.modelSearch,
      listEl: els.modelList,
      addRowEl: els.modelAddRow,
      addBtnEl: els.modelAddBtn,
      placeholder: "Оберіть модель",
      disabledPlaceholder: "Спочатку оберіть марку",
      searchPlaceholder: "Знайти модель...",
      addFocusPlaceholder: "Введіть назву нової моделі...",
      emptyListText: "Для цієї марки ще немає моделей — додайте першу нижче",
      entityLabelGenitive: "модель",
      entityLabelAccusative: "модель",
      getItems: function () {
        var currentBrand = brandCombo ? brandCombo.getValue() : els.carBrand.value;
        return getSortedModelsForBrand(currentBrand);
      },
      onAdd: function (newModel) {
        var currentBrand = brandCombo ? brandCombo.getValue() : els.carBrand.value;
        var cleanModel = normalizeCatalogLabel(newModel);
        var catalog = getMergedVehicleCatalog();
        var canonicalBrand = findCatalogBrandKey(catalog, currentBrand) || normalizeCatalogLabel(currentBrand);
        if (!canonicalBrand) return cleanModel;

        persistCustomVehicleEntry(canonicalBrand, cleanModel)
          .then(function () {
            showToast("Модель «" + canonicalBrand + " " + cleanModel + "» додано до списку");
          })
          .catch(function (err) {
            showToast("Модель «" + cleanModel + "» вибрано, але не вдалося зберегти в хмару: " + (err && err.message ? err.message : ""));
          });
        return cleanModel;
      }
    });
  }

  function resetCarForm() {
    els.carForm.reset();
    els.carId.value = "";
    if (brandCombo) brandCombo.setValue("");
    else if (els.carBrand) els.carBrand.value = "";
    if (modelCombo) {
      modelCombo.setValue("");
      modelCombo.setDisabled(true);
    } else if (els.carModel) {
      els.carModel.value = "";
    }
    closeAllAdminCombos(null);
    els.carYear.value = String(new Date().getFullYear() - 5);
    els.carMileage.value = "150";
    if (els.carOldPrice) els.carOldPrice.value = "";
    state.editingOriginalPriceUsd = null;
    state.editingOriginalOldPriceUsd = null;
    els.carFormTitle.textContent = "Додати нове авто";
    els.carFormCancel.hidden = true;
    state.photos = [];
    state.coverIndex = 0;
    renderPhotoPreviews();
    updateDiscountPreview();
  }

  function loadCarIntoForm(car) {
    els.carId.value = car.id;
    if (brandCombo) {
      brandCombo.setValue(car.brand || "");
    } else {
      els.carBrand.value = car.brand;
    }
    if (modelCombo) {
      modelCombo.setDisabled(!normalizeCatalogLabel(car.brand));
      modelCombo.setValue(car.model || "");
    } else {
      els.carModel.value = car.model;
    }
    closeAllAdminCombos(null);
    els.carTitle.value = car.title;
    els.carYear.value = String(car.year);
    els.carMileage.value = String(car.mileageThousandKm);
    els.carPrice.value = String(car.priceUsd);
    state.editingOriginalPriceUsd = Number(car.priceUsd) || 0;
    state.editingOriginalOldPriceUsd =
      car.oldPriceUsd != null && Number(car.oldPriceUsd) > Number(car.priceUsd) && Number(car.priceUsd) > 0
        ? Number(car.oldPriceUsd)
        : null;
    if (els.carOldPrice) {
      els.carOldPrice.value =
        state.editingOriginalOldPriceUsd != null ? String(state.editingOriginalOldPriceUsd) : "";
    }
    els.carFuel.value = car.fuel;
    els.carStatus.value = car.status;
    els.carEngineLabel.value = car.engineLabel;
    els.carEngineCc.value = car.engineCc != null ? String(car.engineCc) : "";
    els.carVehicleType.value = car.vehicleType || "passenger";
    els.carTransmission.value = car.transmission;
    els.carDrive.value = car.drive;
    els.carBodyType.value = car.bodyType;
    els.carColor.value = car.color;
    els.carDesc.value = car.description;

    state.photos = Array.isArray(car.images) && car.images.length ? car.images.slice() : car.image ? [car.image] : [];
    var coverPos = state.photos.indexOf(car.image);
    state.coverIndex = coverPos >= 0 ? coverPos : 0;
    renderPhotoPreviews();

    els.carFormTitle.textContent = "Редагування: " + car.title;
    els.carFormCancel.hidden = false;
    updateDiscountPreview();
    els.carForm.scrollIntoView({ behavior: "smooth" });
  }

  function renderCarsList() {
    var q = String(els.carsSearch.value || "").trim().toLowerCase();
    els.tabCarsCount.textContent = String(state.cars.length);
    els.carsList.innerHTML = "";

    var filtered = state.cars.filter(function (c) {
      if (!q) return true;
      return [c.title, c.brand, c.model, c.status, String(c.year)].join(" ").toLowerCase().indexOf(q) !== -1;
    });

    if (filtered.length === 0) {
      var empty = document.createElement("p");
      empty.className = "panel-desc";
      empty.textContent = "Авто не знайдено.";
      els.carsList.appendChild(empty);
      return;
    }

    filtered.forEach(function (car) {
      var item = document.createElement("div");
      item.className = "admin-car-item";

      var img = document.createElement("img");
      img.className = "admin-car-item__img";
      img.src = car.image;
      img.alt = car.title;
      img.onerror = function () {
        if (img._fallbackApplied) return;
        img._fallbackApplied = true;
        img.src = "assets/img/hero.jpg";
      };
      item.appendChild(img);

      var body = document.createElement("div");
      body.className = "admin-car-item__body";

      var title = document.createElement("h3");
      title.className = "admin-car-item__title";
      title.textContent = car.title;

      var mediaList = Array.isArray(car.images) ? car.images : [car.image];
      var videoCnt = mediaList.filter(isVideo).length;
      var photoCnt = mediaList.length - videoCnt;
      var meta = document.createElement("div");
      meta.className = "admin-car-item__meta";
      meta.textContent =
        car.year + " р. · " + car.mileageText + " · " + car.fuel +
        " · Фото: " + photoCnt + (videoCnt > 0 ? " · Відео: " + videoCnt : "");

      var price = document.createElement("div");
      price.className = "admin-car-item__price";
      if (car.oldPriceUsd != null && Number(car.oldPriceUsd) > Number(car.priceUsd) && Number(car.priceUsd) > 0) {
        var oldPriceSpan = document.createElement("span");
        oldPriceSpan.className = "admin-car-item__old-price";
        oldPriceSpan.textContent = formatAdminUsd(car.oldPriceUsd);
        price.appendChild(oldPriceSpan);
      }
      var curPriceSpan = document.createElement("span");
      curPriceSpan.textContent = formatAdminUsd(car.priceUsd);
      price.appendChild(curPriceSpan);

      body.appendChild(title);
      body.appendChild(meta);
      body.appendChild(price);
      item.appendChild(body);

      var controls = document.createElement("div");
      controls.className = "admin-car-item__controls";

      var statusSelect = document.createElement("select");
      statusSelect.className = "status-select";
      ["В наявності", "В дорозі", "Бронь", "Продано"].forEach(function (st) {
        var opt = document.createElement("option");
        opt.value = st;
        opt.textContent = st;
        if (st === car.status) opt.selected = true;
        statusSelect.appendChild(opt);
      });
      statusSelect.addEventListener("change", function () {
        var updated = Object.assign({}, car, { status: statusSelect.value });
        store
          .upsertCar(updated, state.cars)
          .then(function () {
            return refreshState();
          })
          .then(function () {
            showToast("Статус оновлено");
          })
          .catch(function (err) {
            handleActionError("Помилка: ", err);
          });
      });

      var btnRow = document.createElement("div");
      btnRow.className = "item-btn-row";

      var editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.className = "btn btn--outline btn--sm";
      editBtn.textContent = "Редагувати";
      editBtn.addEventListener("click", function () {
        loadCarIntoForm(car);
      });

      var delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "btn btn--danger-outline btn--sm";
      delBtn.textContent = "Видалити";
      delBtn.addEventListener("click", function () {
        if (!window.confirm("Видалити " + car.title + " з майданчика?")) return;
        store
          .deleteCar(car.id, state.cars)
          .then(function () {
            if (els.carId.value === car.id) resetCarForm();
            return refreshState();
          })
          .then(function () {
            showToast("Авто видалено");
          })
          .catch(function (err) {
            handleActionError("Помилка: ", err);
          });
      });

      btnRow.appendChild(editBtn);
      btnRow.appendChild(delBtn);
      controls.appendChild(statusSelect);
      controls.appendChild(btnRow);
      item.appendChild(controls);
      els.carsList.appendChild(item);
    });
  }

  function populateSettingsForm() {
    var cfg = state.config || {};
    els.setPhoneDisplay.value = cfg.phoneDisplay || "";
    els.setPhoneHref.value = cfg.phoneHref || "";
    els.setTelegramUrl.value = cfg.telegramUrl || "";
    els.setWorkHours.value = cfg.workHours || "";
    els.setCity.value = cfg.city || "";
    els.setRateUsd.value = cfg.rates && cfg.rates.usdToUah ? String(cfg.rates.usdToUah) : "44.93";
    els.setRateEur.value = cfg.rates && cfg.rates.eurToUsd ? String(cfg.rates.eurToUsd) : "1.11044";
    if (els.setRatesAutoSync) {
      els.setRatesAutoSync.checked = cfg.ratesAutoSync !== false;
    }
    if (els.ratesSyncStatus) {
      if (cfg.ratesAutoSync === false) {
        els.ratesSyncStatus.textContent = "Автооновлення вимкнено (ручний режим)";
      } else if (cfg.ratesExchangeDate) {
        els.ratesSyncStatus.textContent =
          "Джерело: " + (cfg.ratesSource || "НБУ") + " (за " + cfg.ratesExchangeDate + ") · Автооновлення увімкнено";
      } else {
        els.ratesSyncStatus.textContent = "Джерело: НБУ · Автооновлення увімкнено";
      }
    }
    els.setLocalPassword.value = "";
  }

  function refreshState() {
    return store.loadPublicState().then(function (data) {
      state.config = data.config;
      state.cars = data.cars;
      renderCarsList();
      populateSettingsForm();
      adminCombos.forEach(function (combo) {
        if (combo.isOpen()) combo.render();
      });
      var sb = store.getSupabaseConfig();
      if (sb.configured) {
        if (els.syncCloudBtn) {
          els.syncCloudBtn.hidden = Boolean(data.hasCloudRows);
        }
        if (els.cloudStatusText) {
          if (data.hasCloudRows) {
            els.cloudStatusText.textContent =
              "Підключено Supabase (" +
              sb.url +
              "). У хмарі активних авто: " +
              state.cars.length +
              ". Усі зміни зберігаються напряму в базі.";
          } else {
            els.cloudStatusText.textContent =
              "Supabase підключено (" +
              sb.url +
              "), але таблиця в хмарі ще порожня. Натисніть нижче «Перенести локальні авто в Supabase», щоб зберегти ваші авто і медіа в базу.";
          }
        }
      }
    });
  }

  var autoOrphanCleanupDone = false;

  function showDashboard() {
    els.loginView.hidden = true;
    els.dashboardView.hidden = false;
    els.logoutBtn.hidden = false;
    refreshState().then(function () {
      var sb = store.getSupabaseConfig();
      if (sb.configured && !autoOrphanCleanupDone && store.cleanupOrphanedStorageFiles) {
        autoOrphanCleanupDone = true;
        store
          .cleanupOrphanedStorageFiles({ minAgeMs: 120000 })
          .then(function (res) {
            if (res && res.deleted > 0) {
              showToast(
                "Автоматично прибрано зайвих дублікатів у Storage: " +
                  res.deleted +
                  " (" +
                  formatBytesMb(res.freedBytes) +
                  ")"
              );
            }
          })
          .catch(function () {});
      }
    });
  }

  function showLogin() {
    els.loginView.hidden = false;
    els.dashboardView.hidden = true;
    els.logoutBtn.hidden = true;
  }

  function bindEvents() {
    els.loginForm.addEventListener("submit", function (e) {
      e.preventDefault();
      els.loginError.hidden = true;
      store
        .login({
          email: els.loginEmail.value,
          password: els.loginPassword.value
        })
        .then(function () {
          els.loginPassword.value = "";
          showDashboard();
        })
        .catch(function (err) {
          els.loginError.textContent = err.message || "Помилка входу";
          els.loginError.hidden = false;
        });
    });

    els.logoutBtn.addEventListener("click", function () {
      store.logout();
      showLogin();
    });

    els.tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        var target = tab.getAttribute("data-tab");
        els.tabs.forEach(function (t) {
          var active = t === tab;
          t.classList.toggle("is-active", active);
          t.setAttribute("aria-selected", String(active));
        });
        els.panelCars.hidden = target !== "cars";
        els.panelSettings.hidden = target !== "settings";
        els.panelDeploy.hidden = target !== "deploy";
      });
    });

    els.carPhotosInput.addEventListener("change", function (e) {
      var files = Array.prototype.slice.call(e.target.files || []);
      if (files.length === 0) return;

      var hasMovFile = files.some(function (f) {
        var name = String((f && f.name) || "");
        var type = String((f && f.type) || "");
        return /\.mov$/i.test(name) || type.indexOf("quicktime") !== -1;
      });

      state.uploadingCount += files.length;
      updateSubmitBtnState();

      Promise.all(
        files.map(function (file) {
          return store.uploadMedia ? store.uploadMedia(file) : store.uploadPhoto(file);
        })
      )
        .then(function (urls) {
          state.photos = state.photos.concat(urls);
          renderPhotoPreviews();
          els.carPhotosInput.value = "";
          showToast(
            hasMovFile
              ? "Додано файлів: " + urls.length + " (порада: формат .mp4 краще сумісний із браузерами, ніж .mov)"
              : "Додано файлів: " + urls.length
          );
        })
        .catch(function (err) {
          showToast("Помилка медіа: " + err.message);
        })
        .then(function () {
          state.uploadingCount = Math.max(0, state.uploadingCount - files.length);
          updateSubmitBtnState();
        });
    });

    els.addPhotoUrlBtn.addEventListener("click", function () {
      var url = String(els.carPhotoUrl.value || "").trim();
      if (!url) return;
      state.photos.push(url);
      els.carPhotoUrl.value = "";
      renderPhotoPreviews();
    });

    els.carFormCancel.addEventListener("click", resetCarForm);
    els.carPrice.addEventListener("input", updateDiscountPreview);
    if (els.carOldPrice) els.carOldPrice.addEventListener("input", updateDiscountPreview);

    els.carForm.addEventListener("submit", function (e) {
      e.preventDefault();
      if (state.uploadingCount > 0) {
        showToast("Зачекайте завершення завантаження фото/відео");
        return;
      }
      if (state.isSavingCar) return;

      var brand = String(els.carBrand.value || "").trim();
      var model = String(els.carModel.value || "").trim();
      if (!brand) {
        if (els.brandTrigger) {
          els.brandTrigger.classList.add("is-invalid");
          els.brandTrigger.focus();
        }
        if (brandCombo) brandCombo.open();
        showToast("Оберіть або додайте марку авто");
        return;
      }
      if (!model) {
        if (els.modelTrigger) {
          els.modelTrigger.classList.add("is-invalid");
          els.modelTrigger.focus();
        }
        if (modelCombo) modelCombo.open();
        showToast("Оберіть або додайте модель авто");
        return;
      }
      var title = String(els.carTitle.value || "").trim() || (brand + " " + model).trim();
      var mileageNum = Number(els.carMileage.value) || 0;
      var fuel = els.carFuel.value;

      var chosenCover = state.photos[state.coverIndex];
      var firstPhotoIdx = findFirstPhotoIndex(state.photos);
      var firstYtThumb = "";
      for (var mIdx = 0; mIdx < state.photos.length; mIdx++) {
        var ytCandidate = store.getYouTubeThumbUrl ? store.getYouTubeThumbUrl(state.photos[mIdx]) : null;
        if (ytCandidate) {
          firstYtThumb = ytCandidate;
          break;
        }
      }
      var hasCustomMedia = state.photos.length > 0;
      var cover =
        (chosenCover && !isVideo(chosenCover) ? chosenCover : "") ||
        (firstPhotoIdx >= 0 ? state.photos[firstPhotoIdx] : "") ||
        firstYtThumb ||
        "assets/img/car-audi-a3.png";
      var images = hasCustomMedia ? state.photos.slice() : [cover];

      var editingId = els.carId.value;
      var existingCar = null;
      if (editingId) {
        for (var cIdx = 0; cIdx < state.cars.length; cIdx++) {
          if (state.cars[cIdx] && state.cars[cIdx].id === editingId) {
            existingCar = state.cars[cIdx];
            break;
          }
        }
      }

      var nextSortOrder = 0;
      if (existingCar && typeof existingCar.sortOrder === "number" && !isNaN(existingCar.sortOrder)) {
        nextSortOrder = existingCar.sortOrder;
      } else if (state.cars.length > 0) {
        var minSort = 0;
        for (var sIdx = 0; sIdx < state.cars.length; sIdx++) {
          var val = Number(state.cars[sIdx] && state.cars[sIdx].sortOrder);
          if (!isNaN(val) && val < minSort) minSort = val;
        }
        nextSortOrder = minSort - 1;
      }

      var id =
        editingId ||
        (brand + "-" + model + "-" + els.carYear.value + "-" + Date.now().toString(36))
          .toLowerCase()
          .replace(/[^a-z0-9-]+/g, "-");

      var pricing = resolveCarPricing();
      var carPayload = {
        id: id,
        brand: brand,
        model: model,
        title: title,
        year: Number(els.carYear.value),
        mileageThousandKm: mileageNum,
        mileageText: mileageNum + " тис. км",
        priceUsd: pricing.priceUsd,
        oldPriceUsd: pricing.oldPriceUsd,
        fuel: fuel,
        fuelType: FUEL_TO_TYPE[fuel] || "petrol",
        engineCc: els.carEngineCc.value ? Number(els.carEngineCc.value) : null,
        engineLabel: String(els.carEngineLabel.value || "").trim(),
        transmission: String(els.carTransmission.value || "").trim(),
        drive: String(els.carDrive.value || "").trim(),
        bodyType: String(els.carBodyType.value || "").trim(),
        vehicleType: els.carVehicleType.value || "passenger",
        color: String(els.carColor.value || "").trim(),
        status: els.carStatus.value || "В наявності",
        image: cover,
        images: images,
        description: String(els.carDesc.value || "").trim(),
        sortOrder: nextSortOrder
      };

      state.isSavingCar = true;
      updateSubmitBtnState();

      store
        .upsertCar(carPayload, state.cars)
        .then(function () {
          resetCarForm();
          return refreshState();
        })
        .then(function () {
          showToast(
            hasCustomMedia
              ? "Авто збережено на майданчик"
              : "Авто збережено зі стандартною обкладинкою (додайте власні фото)"
          );
        })
        .catch(function (err) {
          handleActionError("Помилка збереження: ", err);
        })
        .then(function () {
          state.isSavingCar = false;
          updateSubmitBtnState();
        });
    });

    els.carsSearch.addEventListener("input", renderCarsList);

    els.settingsForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var prevCfg = state.config || {};
      var nextUsd = Number(els.setRateUsd.value) || 44.93;
      var nextEur = Number(els.setRateEur.value) || 1.11044;
      var autoSyncEnabled = els.setRatesAutoSync ? Boolean(els.setRatesAutoSync.checked) : true;
      var ratesEditedManually =
        !prevCfg.rates ||
        Math.abs(nextUsd - Number(prevCfg.rates.usdToUah)) > 0.0001 ||
        Math.abs(nextEur - Number(prevCfg.rates.eurToUsd)) > 0.000001;

      var patch = buildSettingsPayload(prevCfg, {
        phoneDisplay: els.setPhoneDisplay.value.trim(),
        phoneHref: els.setPhoneHref.value.trim(),
        telegramUrl: els.setTelegramUrl.value.trim(),
        workHours: els.setWorkHours.value.trim(),
        city: els.setCity.value.trim(),
        rates: {
          usdToUah: nextUsd,
          eurToUsd: nextEur
        },
        ratesAutoSync: autoSyncEnabled,
        ratesSource: !autoSyncEnabled || ratesEditedManually ? "Вручну" : (prevCfg.ratesSource || "НБУ"),
        ratesExchangeDate: !autoSyncEnabled || ratesEditedManually ? "" : (prevCfg.ratesExchangeDate || ""),
        ratesUpdatedAt: prevCfg.ratesUpdatedAt || ""
      });

      try {
        if (els.setLocalPassword.value.trim()) {
          store.setLocalPassword(els.setLocalPassword.value.trim());
        }
      } catch (err) {
        showToast(err.message);
        return;
      }

      store
        .saveSettings(patch)
        .then(function () {
          return refreshState();
        })
        .then(function () {
          showToast("Контакти та курси збережено");
        })
        .catch(function (err) {
          handleActionError("Помилка: ", err);
        });
    });

    if (els.syncNbuRatesBtn) {
      els.syncNbuRatesBtn.addEventListener("click", function () {
        if (!store.syncNbuRatesNow) return;
        els.syncNbuRatesBtn.disabled = true;
        els.syncNbuRatesBtn.textContent = "Оновлення з НБУ...";
        store
          .syncNbuRatesNow()
          .then(function (res) {
            return refreshState().then(function () {
              showToast(
                "Курс НБУ оновлено (" +
                  (res.exchangeDate || "") +
                  "): 1 $ = " +
                  res.usdToUah +
                  " ₴"
              );
            });
          })
          .catch(function (err) {
            handleActionError("Помилка НБУ: ", err);
          })
          .then(function () {
            els.syncNbuRatesBtn.disabled = false;
            els.syncNbuRatesBtn.textContent = "Оновити курс з НБУ зараз";
          });
      });
    }

    if (els.syncCloudBtn) {
      els.syncCloudBtn.addEventListener("click", function () {
        if (!window.confirm("Перенести всі локальні авто, фото та налаштування в базу Supabase?")) return;
        els.syncCloudBtn.disabled = true;
        els.syncCloudBtn.textContent = "Перенесення у хмару...";
        store
          .syncLocalDataToCloud()
          .then(function (result) {
            return refreshState().then(function () {
              if (result && result.skipped) {
                showToast("Каталог уже в Supabase — зайвих перенесень не потрібно");
              } else {
                showToast("Перенесено авто у Supabase: " + result.count);
              }
            });
          })
          .catch(function (err) {
            handleActionError("Помилка міграції: ", err);
          })
          .then(function () {
            els.syncCloudBtn.disabled = false;
            els.syncCloudBtn.textContent = "Перенести локальні авто в Supabase";
          });
      });
    }

    if (els.cleanupStorageBtn) {
      els.cleanupStorageBtn.addEventListener("click", function () {
        els.cleanupStorageBtn.disabled = true;
        els.cleanupStorageBtn.textContent = "Очищення Storage...";
        store
          .cleanupOrphanedStorageFiles({ minAgeMs: 5000 })
          .then(function (res) {
            if (res.deleted > 0) {
              showToast(
                "Видалено зайвих файлів: " +
                  res.deleted +
                  " (звільнено " +
                  formatBytesMb(res.freedBytes) +
                  ")"
              );
            } else {
              showToast("Зайвих файлів у Storage не знайдено");
            }
          })
          .catch(function (err) {
            handleActionError("Помилка очищення: ", err);
          })
          .then(function () {
            els.cleanupStorageBtn.disabled = false;
            els.cleanupStorageBtn.textContent = "Очистити зайві файли в Storage";
          });
      });
    }

    els.exportDataJsBtn.addEventListener("click", function () {
      var code = store.buildExportDataJs(state.config, state.cars);
      var blob = new Blob([code], { type: "application/javascript;charset=utf-8" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = "data.js";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast("Файл data.js завантажено");
    });

    els.resetLocalBtn.addEventListener("click", function () {
      if (!window.confirm("Повернути стандартний список авто та контактів з data.js?")) return;
      store.resetLocalData().then(function () {
        resetCarForm();
        return refreshState();
      }).then(function () {
        showToast("Локальні зміни скинуто");
      });
    });
  }

  function init() {
    cacheElements();
    initVehicleComboboxes();
    updateModeUi();
    resetCarForm();
    bindEvents();

    document.addEventListener("click", function (e) {
      if (!e.target || !e.target.closest || !e.target.closest(".admin-combobox")) {
        closeAllAdminCombos(null);
      }
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        closeAllAdminCombos(null);
      }
    });

    var sess = store.getSession();
    var sb = store.getSupabaseConfig();
    if (sess && ((sb.configured && sess.mode === "supabase") || (!sb.configured && sess.mode === "local"))) {
      showDashboard();
    } else {
      showLogin();
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
