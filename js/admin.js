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
    coverIndex: 0
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
    els.carTitle = document.getElementById("car-title");
    els.carYear = document.getElementById("car-year");
    els.carMileage = document.getElementById("car-mileage");
    els.carPrice = document.getElementById("car-price");
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
    els.localPassSetting = document.getElementById("local-pass-setting");
    els.setLocalPassword = document.getElementById("set-local-password");

    els.exportDataJsBtn = document.getElementById("export-data-js-btn");
    els.resetLocalBtn = document.getElementById("reset-local-btn");
    els.cloudStatusText = document.getElementById("cloud-status-text");
    els.toast = document.getElementById("admin-toast");
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

      if (videoItem && !ytThumb) {
        var videoEl = document.createElement("video");
        videoEl.src = src;
        videoEl.muted = true;
        videoEl.playsInline = true;
        videoEl.preload = "metadata";
        wrap.appendChild(videoEl);
      } else {
        var img = document.createElement("img");
        img.src = ytThumb || src;
        img.alt = (videoItem ? "Відео авто " : "Фото авто ") + (idx + 1);
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
        coverBtn.addEventListener("click", function () {
          state.coverIndex = idx;
          renderPhotoPreviews();
        });
        bar.appendChild(coverBtn);
      }

      var delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "thumb-btn thumb-btn--del";
      delBtn.textContent = "✕";
      delBtn.addEventListener("click", function () {
        state.photos.splice(idx, 1);
        var nextImgIdx = findFirstPhotoIndex(state.photos);
        if (state.coverIndex >= state.photos.length || isVideo(state.photos[state.coverIndex])) {
          state.coverIndex = nextImgIdx >= 0 ? nextImgIdx : 0;
        }
        renderPhotoPreviews();
      });

      bar.appendChild(delBtn);
      wrap.appendChild(bar);
      els.carPhotosPreview.appendChild(wrap);
    });
  }

  function resetCarForm() {
    els.carForm.reset();
    els.carId.value = "";
    els.carYear.value = String(new Date().getFullYear() - 5);
    els.carMileage.value = "150";
    els.carFormTitle.textContent = "Додати нове авто";
    els.carFormCancel.hidden = true;
    state.photos = [];
    state.coverIndex = 0;
    renderPhotoPreviews();
  }

  function loadCarIntoForm(car) {
    els.carId.value = car.id;
    els.carBrand.value = car.brand;
    els.carModel.value = car.model;
    els.carTitle.value = car.title;
    els.carYear.value = String(car.year);
    els.carMileage.value = String(car.mileageThousandKm);
    els.carPrice.value = String(car.priceUsd);
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
      price.textContent = String(car.priceUsd).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " $";

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
            showToast("Помилка: " + err.message);
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
            showToast("Помилка: " + err.message);
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
    els.setRateUsd.value = cfg.rates && cfg.rates.usdToUah ? String(cfg.rates.usdToUah) : "41.5";
    els.setRateEur.value = cfg.rates && cfg.rates.eurToUsd ? String(cfg.rates.eurToUsd) : "1.11044";
    els.setLocalPassword.value = "";
  }

  function refreshState() {
    return store.loadPublicState().then(function (data) {
      state.config = data.config;
      state.cars = data.cars;
      renderCarsList();
      populateSettingsForm();
    });
  }

  function showDashboard() {
    els.loginView.hidden = true;
    els.dashboardView.hidden = false;
    els.logoutBtn.hidden = false;
    refreshState();
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

      Promise.all(
        files.map(function (file) {
          return store.uploadMedia ? store.uploadMedia(file) : store.uploadPhoto(file);
        })
      )
        .then(function (urls) {
          state.photos = state.photos.concat(urls);
          renderPhotoPreviews();
          els.carPhotosInput.value = "";
          showToast("Додано файлів: " + urls.length);
        })
        .catch(function (err) {
          showToast("Помилка медіа: " + err.message);
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

    els.carForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var brand = String(els.carBrand.value || "").trim();
      var model = String(els.carModel.value || "").trim();
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
      var cover =
        (chosenCover && !isVideo(chosenCover) ? chosenCover : "") ||
        (firstPhotoIdx >= 0 ? state.photos[firstPhotoIdx] : "") ||
        firstYtThumb ||
        "assets/img/car-audi-a3.png";
      var images = state.photos.length ? state.photos.slice() : [cover];

      var id =
        els.carId.value ||
        (brand + "-" + model + "-" + els.carYear.value + "-" + Date.now().toString(36))
          .toLowerCase()
          .replace(/[^a-z0-9-]+/g, "-");

      var carPayload = {
        id: id,
        brand: brand,
        model: model,
        title: title,
        year: Number(els.carYear.value),
        mileageThousandKm: mileageNum,
        mileageText: mileageNum + " тис. км",
        priceUsd: Number(els.carPrice.value) || 0,
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
        sortOrder: 0
      };

      store
        .upsertCar(carPayload, state.cars)
        .then(function () {
          resetCarForm();
          return refreshState();
        })
        .then(function () {
          showToast("Авто збережено на майданчику");
        })
        .catch(function (err) {
          showToast("Помилка збереження: " + err.message);
        });
    });

    els.carsSearch.addEventListener("input", renderCarsList);

    els.settingsForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var patch = {
        phoneDisplay: els.setPhoneDisplay.value.trim(),
        phoneHref: els.setPhoneHref.value.trim(),
        telegramUrl: els.setTelegramUrl.value.trim(),
        workHours: els.setWorkHours.value.trim(),
        city: els.setCity.value.trim(),
        rates: {
          usdToUah: Number(els.setRateUsd.value) || 41.5,
          eurToUsd: Number(els.setRateEur.value) || 1.11044
        }
      };

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
          showToast("Помилка: " + err.message);
        });
    });

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
    updateModeUi();
    resetCarForm();
    bindEvents();

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
