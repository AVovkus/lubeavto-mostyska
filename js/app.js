(function () {
  "use strict";

  var config = window.LUBE_AVTO_CONFIG || {};
  var cars = Array.isArray(window.CARS_DATA) ? window.CARS_DATA : [];
  var locations = Array.isArray(window.AUCTION_LOCATIONS) ? window.AUCTION_LOCATIONS : [];
  var calcEngine = window.LubeAvtoCalculator;

  var state = {
    filters: {
      brand: "all",
      fuel: "all",
      yearMin: 0,
      yearMax: 0,
      priceMin: 0,
      priceMax: 0,
      yearTouched: false,
      priceTouched: false,
      sort: "default"
    },
    bounds: {
      minYear: 2010,
      maxYear: 2026,
      minPrice: 0,
      maxPrice: 50000
    },
    lastCalculation: null,
    lastFocusedEl: null,
    modalGallery: [],
    modalGalleryIndex: 0
  };

  var els = {};
  var customSelects = [];

  function formatSpaceNumber(num) {
    var rounded = Math.round(Number(num) || 0);
    return String(rounded).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  }

  function formatUsdBadge(num) {
    return Math.round(Number(num) || 0) + "$";
  }

  function formatUsdSpaced(num) {
    return formatSpaceNumber(num) + "$";
  }

  function formatUsdShowcase(num) {
    return formatSpaceNumber(num) + " $";
  }

  function formatUah(num) {
    return "≈ " + formatSpaceNumber(num) + " ₴";
  }

  function showToast(message) {
    if (!els.toast) return;
    els.toast.textContent = message;
    els.toast.hidden = false;
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(function () {
      els.toast.hidden = true;
    }, 3200);
  }

  function cacheElements() {
    els.headerPhone = document.getElementById("header-phone-link");
    els.headerTg = document.getElementById("header-telegram-link");
    els.mobilePhone = document.getElementById("mobile-phone-link");
    els.mobileTg = document.getElementById("mobile-telegram-link");
    els.footerPhone = document.getElementById("footer-phone-link");
    els.footerTg = document.getElementById("footer-tg-link");
    els.footerCity = document.getElementById("footer-city");
    els.footerHours = document.getElementById("footer-hours");
    els.currentYear = document.getElementById("current-year");

    els.burgerBtn = document.getElementById("burger-btn");
    els.mobileMenu = document.getElementById("mobile-menu");
    els.navLinks = document.querySelectorAll("[data-nav]");

    els.filterBrand = document.getElementById("filter-brand");
    els.filterFuel = document.getElementById("filter-fuel");
    els.filterYearSlot = document.getElementById("filter-year-slot");
    els.filterYearDisplay = document.getElementById("filter-year-display");
    els.filterYearFill = document.getElementById("filter-year-fill");
    els.filterYearMin = document.getElementById("filter-year-min");
    els.filterYearMax = document.getElementById("filter-year-max");
    els.filterPriceSlot = document.getElementById("filter-price-slot");
    els.filterPriceDisplay = document.getElementById("filter-price-display");
    els.filterPriceFill = document.getElementById("filter-price-fill");
    els.filterPriceMin = document.getElementById("filter-price-min");
    els.filterPriceMax = document.getElementById("filter-price-max");
    els.filterSort = document.getElementById("filter-sort");
    els.carsCount = document.getElementById("cars-count");
    els.resetFiltersBtn = document.getElementById("reset-filters-btn");
    els.emptyResetBtn = document.getElementById("empty-reset-btn");
    els.carsGrid = document.getElementById("cars-grid");
    els.carsEmpty = document.getElementById("cars-empty");

    els.modal = document.getElementById("car-modal");
    els.modalClose = document.getElementById("modal-close-btn");
    els.modalImg = document.getElementById("modal-car-img");
    els.modalVideo = document.getElementById("modal-car-video");
    els.modalIframe = document.getElementById("modal-car-iframe");
    els.modalGalleryPrev = document.getElementById("modal-gallery-prev");
    els.modalGalleryNext = document.getElementById("modal-gallery-next");
    els.modalGalleryThumbs = document.getElementById("modal-gallery-thumbs");
    els.modalStatus = document.getElementById("modal-car-status");
    els.modalTitle = document.getElementById("modal-car-title");
    els.modalPriceUsd = document.getElementById("modal-car-price-usd");
    els.modalPriceUah = document.getElementById("modal-car-price-uah");
    els.modalSpecs = document.getElementById("modal-car-specs");
    els.modalDesc = document.getElementById("modal-car-desc");
    els.modalPhone = document.getElementById("modal-phone-btn");
    els.modalTg = document.getElementById("modal-tg-btn");

    // 3-column Lube Avto calculator elements
    els.calcForm = document.getElementById("calc-form");
    els.calcRecalcBtn = document.getElementById("calc-recalc-btn");
    els.calcClearBtn = document.getElementById("calc-clear-btn");

    els.calcArrivalPort = document.getElementById("calc-arrival-port");
    els.calcVehicleType = document.getElementById("calc-vehicle-type");
    els.calcFuelType = document.getElementById("calc-fuel-type");
    els.calcYear = document.getElementById("calc-year");
    els.calcEngineLitersWrap = document.getElementById("calc-engine-liters-wrap");
    els.calcEngineLiters = document.getElementById("calc-engine-liters");
    els.calcMotoCcWrap = document.getElementById("calc-moto-cc-wrap");
    els.calcMotoCc = document.getElementById("calc-moto-cc");
    els.calcBatteryWrap = document.getElementById("calc-battery-wrap");
    els.calcBatteryKwh = document.getElementById("calc-battery-kwh");
    els.calcPrice = document.getElementById("calc-price");

    els.calcAuction = document.getElementById("calc-auction");
    els.calcLocation = document.getElementById("calc-location");
    els.locationCombobox = document.getElementById("location-combobox");
    els.locationTrigger = document.getElementById("location-trigger");
    els.locationTriggerText = document.getElementById("location-trigger-text");
    els.locationPopover = document.getElementById("location-popover");
    els.locationSearch = document.getElementById("location-search");
    els.locationList = document.getElementById("location-list");
    els.calcCustomUsaWrap = document.getElementById("calc-custom-usa-wrap");
    els.calcCustomUsaFee = document.getElementById("calc-custom-usa-fee");
    els.calcCustomPort = document.getElementById("calc-custom-port");
    els.calcDocs = document.getElementById("calc-docs");

    els.resAuctionFee = document.getElementById("res-auction-fee");
    els.resDeliveryUsa = document.getElementById("res-delivery-usa");
    els.resExportDocs = document.getElementById("res-export-docs");
    els.labelSeaFreight = document.getElementById("label-sea-freight");
    els.resSeaFreight = document.getElementById("res-sea-freight");

    els.rowUnloadKlaipeda = document.getElementById("row-unload-klaipeda");
    els.resUnloadKlaipeda = document.getElementById("res-unload-klaipeda");
    els.rowKlaipedaLviv = document.getElementById("row-klaipeda-lviv");
    els.resKlaipedaLviv = document.getElementById("res-klaipeda-lviv");
    els.rowDeliveryCustoms = document.getElementById("row-delivery-customs");
    els.resDeliveryCustoms = document.getElementById("res-delivery-customs");
    els.rowOdessaUnload = document.getElementById("row-odessa-unload");
    els.resOdessaUnload = document.getElementById("res-odessa-unload");

    els.resBorderSpec = document.getElementById("res-border-spec");
    els.resExcise = document.getElementById("res-excise");
    els.resImportDuty = document.getElementById("res-import-duty");
    els.resVat = document.getElementById("res-vat");
    els.rowNonVatFee = document.getElementById("row-non-vat-fee");
    els.resNonVatFee = document.getElementById("res-non-vat-fee");
    els.rowBrokerFee = document.getElementById("row-broker-fee");
    els.resBrokerFee = document.getElementById("res-broker-fee");
    els.resLubeCommission = document.getElementById("res-lube-commission");
    els.calcInsurance = document.getElementById("calc-insurance");
    els.resInsurance = document.getElementById("res-insurance");

    els.calcCommercialWarning = document.getElementById("calc-commercial-warning");
    els.calcOdessaWarning = document.getElementById("calc-odessa-warning");

    els.calcWireFee = document.getElementById("calc-wire-fee");
    els.labelWireFee = document.getElementById("label-wire-fee");
    els.resWireFee = document.getElementById("res-wire-fee");
    els.resTotalUsd = document.getElementById("res-total-usd");
    els.resTotalUah = document.getElementById("res-total-uah");

    els.copyEstimateBtn = document.getElementById("copy-estimate-btn");
    els.sendCalcTgBtn = document.getElementById("send-calc-tg-btn");
    els.aboutCity = document.getElementById("about-city");
    els.aboutAddressNote = document.getElementById("about-address-note");
    els.aboutHours = document.getElementById("about-work-hours");
    els.aboutPhone = document.getElementById("about-phone-link");
    els.aboutServicesPhone = document.getElementById("about-services-phone-btn");
    els.lotHeroPhone = document.getElementById("lot-hero-phone-btn");
    els.lotCtaPhone = document.getElementById("lot-cta-phone-btn");
    els.aboutTg = document.getElementById("about-tg-link");
    els.aboutLiveCars = document.getElementById("about-live-cars");
    els.lotHeroMetaText = document.getElementById("lot-hero-meta-text");
    els.toast = document.getElementById("toast");
  }

  function hasLotDom() {
    return Boolean(els.carsGrid && els.filterBrand && els.filterFuel && els.filterSort);
  }

  function hasCalcDom() {
    return Boolean(els.calcForm && els.calcYear && els.calcEngineLiters);
  }

  function sanitizeHref(rawUrl, allowedProtocols, fallback) {
    var val = String(rawUrl || "").trim();
    if (!val) return fallback;
    if (/^(assets\/|\.?\/)/i.test(val)) return val;
    var protoMatch = val.match(/^([a-z][a-z0-9+.-]*):/i);
    if (!protoMatch) return fallback;
    var proto = protoMatch[1].toLowerCase();
    return allowedProtocols.indexOf(proto) !== -1 ? val : fallback;
  }

  function appendQueryParam(url, key, value) {
    var base = String(url || "");
    var sep = base.indexOf("?") !== -1 ? "&" : "?";
    return base + sep + encodeURIComponent(key) + "=" + encodeURIComponent(value);
  }

  function hydrateAboutStats() {
    if (els.aboutLiveCars) els.aboutLiveCars.textContent = String(cars.length);
  }

  function hydrateContacts() {
    var phoneHref = sanitizeHref(config.phoneHref, ["tel"], "tel:+380677002300");
    var phoneDisplay = config.phoneDisplay || "+38 (067) 700 2300";
    var tgUrl = sanitizeHref(config.telegramUrl, ["https", "http"], "https://t.me/+380677002300");

    [els.headerPhone, els.mobilePhone, els.modalPhone, els.aboutServicesPhone, els.lotHeroPhone, els.lotCtaPhone].forEach(function (el) {
      if (el) el.href = phoneHref;
    });

    [els.footerPhone, els.aboutPhone].forEach(function (el) {
      if (!el) return;
      el.href = phoneHref;
      el.textContent = phoneDisplay;
    });

    [els.headerTg, els.mobileTg, els.footerTg, els.sendCalcTgBtn, els.aboutTg].forEach(function (el) {
      if (el) el.href = tgUrl;
    });

    if (els.footerCity && config.city) {
      els.footerCity.textContent = config.city;
    }
    if (els.footerHours && config.workHours) {
      els.footerHours.textContent = config.workHours;
    }
    if (els.aboutCity && config.city) {
      els.aboutCity.textContent = config.city;
    }
    if (els.aboutAddressNote && config.addressNote) {
      els.aboutAddressNote.textContent = config.addressNote;
    }
    if (els.aboutHours && config.workHours) {
      els.aboutHours.textContent = config.workHours;
    }
    if (els.lotHeroMetaText && (config.city || config.workHours)) {
      var shortCity = config.city ? String(config.city).split(",")[0].trim() : "м. Мостиська";
      els.lotHeroMetaText.textContent = shortCity + " · " + (config.workHours || "Пн–Нд: 10:00 – 18:00");
    }
    if (els.currentYear) {
      els.currentYear.textContent = String(new Date().getFullYear());
    }
    hydrateAboutStats();
  }

  function resetSelectToAllOption(selectEl) {
    if (!selectEl) return;
    var allOption = null;
    var opts = Array.prototype.slice.call(selectEl.options || selectEl.children || []);
    for (var i = 0; i < opts.length; i++) {
      if (opts[i].value === "all") {
        allOption = opts[i];
        break;
      }
    }
    selectEl.innerHTML = "";
    if (allOption) {
      selectEl.appendChild(allOption);
    } else {
      var fallbackOpt = document.createElement("option");
      fallbackOpt.value = "all";
      fallbackOpt.textContent = "Усі";
      selectEl.appendChild(fallbackOpt);
    }
    selectEl.value = "all";
  }

  function initFilterOptions() {
    if (!hasLotDom()) return;
    var prevBrand = String(els.filterBrand ? els.filterBrand.value || "all" : "all").toLowerCase();
    var prevFuel = String(els.filterFuel ? els.filterFuel.value || "all" : "all").toLowerCase();

    resetSelectToAllOption(els.filterBrand);
    resetSelectToAllOption(els.filterFuel);

    var brandMap = {};
    var fuelMap = {};

    cars.forEach(function (car) {
      var rawBrand = String(car.brand || "").trim();
      var brandKey = rawBrand.toLowerCase();
      if (brandKey && !brandMap[brandKey]) brandMap[brandKey] = rawBrand;

      var rawFuel = String(car.fuel || "").trim();
      var fuelKey = rawFuel.toLowerCase();
      if (fuelKey && !fuelMap[fuelKey]) fuelMap[fuelKey] = rawFuel;
    });

    var brandKeys = Object.keys(brandMap).sort(function (a, b) {
      return brandMap[a].localeCompare(brandMap[b], "uk");
    });
    var fuelKeys = Object.keys(fuelMap).sort(function (a, b) {
      return fuelMap[a].localeCompare(fuelMap[b], "uk");
    });

    brandKeys.forEach(function (key) {
      var opt = document.createElement("option");
      opt.value = key;
      opt.textContent = brandMap[key];
      els.filterBrand.appendChild(opt);
    });

    fuelKeys.forEach(function (key) {
      var opt = document.createElement("option");
      opt.value = key;
      opt.textContent = fuelMap[key];
      els.filterFuel.appendChild(opt);
    });

    if (els.filterBrand) {
      els.filterBrand.value = brandMap[prevBrand] ? prevBrand : "all";
      state.filters.brand = els.filterBrand.value;
    }
    if (els.filterFuel) {
      els.filterFuel.value = fuelMap[prevFuel] ? prevFuel : "all";
      state.filters.fuel = els.filterFuel.value;
    }

    syncFilterBounds();
  }

  function computeCatalogBounds() {
    if (!cars || cars.length === 0) {
      return { minYear: 2010, maxYear: 2026, minPrice: 0, maxPrice: 50000 };
    }
    var minY = Infinity;
    var maxY = -Infinity;
    var minP = Infinity;
    var maxP = -Infinity;

    cars.forEach(function (car) {
      var y = Number(car.year) || new Date().getFullYear();
      var p = Number(car.priceUsd) || 0;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      if (p < minP) minP = p;
      if (p > maxP) maxP = p;
    });

    minP = Math.floor(minP / 100) * 100;
    maxP = Math.ceil(maxP / 100) * 100;
    return { minYear: minY, maxYear: maxY, minPrice: minP, maxPrice: maxP };
  }

  function updateSingleDualRange(minInput, maxInput, fillEl, displayEl, minVal, maxVal, minBound, maxBound, formatter) {
    if (minInput) {
      minInput.value = String(minVal);
      minInput.style.zIndex =
        maxBound > minBound && minVal >= maxBound - (maxBound - minBound) * 0.25 && minVal === maxVal
          ? "4"
          : "2";
    }
    if (maxInput) {
      maxInput.value = String(maxVal);
      maxInput.style.zIndex = "3";
    }
    if (fillEl) {
      var span = maxBound - minBound;
      var leftPct = span > 0 ? ((minVal - minBound) / span) * 100 : 0;
      var rightPct = span > 0 ? ((maxVal - minBound) / span) * 100 : 100;
      leftPct = Math.max(0, Math.min(100, leftPct));
      rightPct = Math.max(leftPct, Math.min(100, rightPct));
      fillEl.style.left = leftPct + "%";
      fillEl.style.width = (rightPct - leftPct) + "%";
    }
    if (displayEl) {
      displayEl.textContent = minVal === maxVal ? formatter(minVal) : formatter(minVal) + " — " + formatter(maxVal);
    }
  }

  function updateDualRangeUI() {
    var b = state.bounds;
    var f = state.filters;
    updateSingleDualRange(
      els.filterYearMin,
      els.filterYearMax,
      els.filterYearFill,
      els.filterYearDisplay,
      f.yearMin,
      f.yearMax,
      b.minYear,
      b.maxYear,
      function (v) { return String(v); }
    );
    updateSingleDualRange(
      els.filterPriceMin,
      els.filterPriceMax,
      els.filterPriceFill,
      els.filterPriceDisplay,
      f.priceMin,
      f.priceMax,
      b.minPrice,
      b.maxPrice,
      formatUsdSpaced
    );
  }

  function syncFilterBounds() {
    var b = computeCatalogBounds();
    state.bounds = b;

    if (els.filterYearMin && els.filterYearMax) {
      els.filterYearMin.min = String(b.minYear);
      els.filterYearMin.max = String(b.maxYear);
      els.filterYearMin.step = "1";
      els.filterYearMax.min = String(b.minYear);
      els.filterYearMax.max = String(b.maxYear);
      els.filterYearMax.step = "1";
      var sameYear = b.minYear >= b.maxYear;
      els.filterYearMin.disabled = sameYear;
      els.filterYearMax.disabled = sameYear;
    }

    if (els.filterPriceMin && els.filterPriceMax) {
      els.filterPriceMin.min = String(b.minPrice);
      els.filterPriceMin.max = String(b.maxPrice);
      els.filterPriceMin.step = "100";
      els.filterPriceMax.min = String(b.minPrice);
      els.filterPriceMax.max = String(b.maxPrice);
      els.filterPriceMax.step = "100";
      var samePrice = b.minPrice >= b.maxPrice;
      els.filterPriceMin.disabled = samePrice;
      els.filterPriceMax.disabled = samePrice;
    }

    if (!state.filters.yearTouched) {
      state.filters.yearMin = b.minYear;
      state.filters.yearMax = b.maxYear;
    } else {
      state.filters.yearMin = Math.max(b.minYear, Math.min(b.maxYear, state.filters.yearMin));
      state.filters.yearMax = Math.max(state.filters.yearMin, Math.min(b.maxYear, state.filters.yearMax));
    }

    if (!state.filters.priceTouched) {
      state.filters.priceMin = b.minPrice;
      state.filters.priceMax = b.maxPrice;
    } else {
      state.filters.priceMin = Math.max(b.minPrice, Math.min(b.maxPrice, state.filters.priceMin));
      state.filters.priceMax = Math.max(state.filters.priceMin, Math.min(b.maxPrice, state.filters.priceMax));
    }

    updateDualRangeUI();
  }

  function initCalculatorSelects() {
    if (!hasCalcDom()) return;
    // 1. Роки випуску: плейсхолдер + 2027 .. 2010 + 2009 і старше
    els.calcYear.innerHTML = "";
    var yearPlaceholder = document.createElement("option");
    yearPlaceholder.value = "";
    yearPlaceholder.textContent = "Рік випуску";
    yearPlaceholder.selected = true;
    els.calcYear.appendChild(yearPlaceholder);

    for (var y = 2027; y >= 2010; y--) {
      var yearOpt = document.createElement("option");
      yearOpt.value = String(y);
      yearOpt.textContent = String(y);
      els.calcYear.appendChild(yearOpt);
    }
    var oldOpt = document.createElement("option");
    oldOpt.value = "2009";
    oldOpt.textContent = "2009 і старше";
    els.calcYear.appendChild(oldOpt);
    els.calcYear.value = "";

    // 2. Об'єм двигуна (плейсхолдер + 0.1 .. 10.0)
    els.calcEngineLiters.innerHTML = "";
    var engPlaceholder = document.createElement("option");
    engPlaceholder.value = "";
    engPlaceholder.textContent = "Об'єм двигуна (л)";
    engPlaceholder.selected = true;
    els.calcEngineLiters.appendChild(engPlaceholder);

    for (var tenths = 1; tenths <= 100; tenths++) {
      var liters = tenths / 10;
      var label = Number.isInteger(liters) ? String(liters) : liters.toFixed(1);
      var engOpt = document.createElement("option");
      engOpt.value = label;
      engOpt.textContent = label + " л";
      els.calcEngineLiters.appendChild(engOpt);
    }
    els.calcEngineLiters.value = "";

    // 3. Локація доставки — спочатку не обрана
    clearLocationSelection(true);
    renderLocationList("");
  }

  function renderLocationList(query) {
    if (!els.locationList) return;
    var q = String(query || "").trim().toLowerCase();
    var currentId = els.calcLocation.value;
    els.locationList.innerHTML = "";

    var filtered = locations.filter(function (loc) {
      if (!q) return true;
      var haystack = [loc.name, loc.portKlaipeda || "", loc.portOdessa || ""].join(" ").toLowerCase();
      return haystack.indexOf(q) !== -1;
    });

    if (filtered.length === 0) {
      var empty = document.createElement("li");
      empty.className = "la-combo-empty";
      empty.textContent = "Нічого не знайдено. Оберіть «Інший майданчик».";
      els.locationList.appendChild(empty);
      return;
    }

    filtered.forEach(function (loc) {
      var li = document.createElement("li");
      li.className = "la-combo-item" + (loc.id === currentId ? " is-selected" : "");
      li.setAttribute("role", "option");
      li.setAttribute("aria-selected", String(loc.id === currentId));
      li.setAttribute("data-loc-id", loc.id);

      var main = document.createElement("div");
      main.className = "la-combo-item__main";

      var nameEl = document.createElement("span");
      nameEl.className = "la-combo-item__name";
      nameEl.textContent = loc.name;

      var portEl = document.createElement("span");
      portEl.className = "la-combo-item__port";
      portEl.textContent = loc.isCustom
        ? "Власний тариф і порт"
        : "Порт: " + loc.portKlaipeda + (loc.odessaSupported ? " · Одеса OK" : "");

      main.appendChild(nameEl);
      main.appendChild(portEl);

      var priceEl = document.createElement("span");
      priceEl.className = "la-combo-item__price";
      priceEl.textContent = loc.isCustom ? "Вручну" : loc.deliveryUsd + "$";

      li.appendChild(main);
      li.appendChild(priceEl);

      li.addEventListener("click", function () {
        selectLocation(loc, false);
      });

      els.locationList.appendChild(li);
    });
  }

  function clearLocationSelection(silent) {
    els.calcLocation.value = "";
    if (els.locationTriggerText) {
      els.locationTriggerText.textContent = "Оберіть майданчик";
    }
    if (els.locationTrigger) {
      els.locationTrigger.classList.add("is-placeholder");
    }
    closeLocationPopover();
    if (!silent) {
      renderLocationList("");
      updateCalculator();
    }
  }

  function selectLocation(loc, silent) {
    if (!loc) return;
    els.calcLocation.value = loc.id;
    if (els.locationTriggerText) {
      els.locationTriggerText.textContent = loc.name;
    }
    if (els.locationTrigger) {
      els.locationTrigger.classList.remove("is-placeholder");
    }
    closeLocationPopover();
    if (!silent) {
      renderLocationList(els.locationSearch ? els.locationSearch.value : "");
      updateCalculator();
    }
  }

  function closeAllDropdowns(exceptPopover) {
    if (els.locationPopover && els.locationPopover !== exceptPopover) {
      els.locationPopover.hidden = true;
      if (els.locationTrigger) els.locationTrigger.setAttribute("aria-expanded", "false");
      if (els.locationCombobox) els.locationCombobox.classList.remove("is-dropdown-open");
    }
    customSelects.forEach(function (cs) {
      if (cs.popover === exceptPopover) return;
      cs.popover.hidden = true;
      cs.trigger.setAttribute("aria-expanded", "false");
      if (cs.container) cs.container.classList.remove("is-dropdown-open");
    });
  }

  function createDropdownArrowSvg() {
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "la-combo-trigger__arrow");
    svg.setAttribute("width", "12");
    svg.setAttribute("height", "12");
    svg.setAttribute("viewBox", "0 0 12 12");
    svg.setAttribute("fill", "none");
    svg.setAttribute("aria-hidden", "true");
    var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", "M8.5 2L3.5 6L8.5 10V2Z");
    path.setAttribute("fill", "#FB6720");
    svg.appendChild(path);
    return svg;
  }

  function renderCustomSelectOptions(cs, query) {
    var q = String(query || "").trim().toLowerCase();
    var currentVal = cs.select.value;
    var opts = Array.prototype.slice.call(cs.select.options || cs.select.children || []);
    cs.list.innerHTML = "";

    var matched = opts.filter(function (opt) {
      if (!cs.isFilter && opt.value === "") return false;
      if (!q) return true;
      return String(opt.textContent || "").toLowerCase().indexOf(q) !== -1;
    });

    if (matched.length === 0) {
      var empty = document.createElement("li");
      empty.className = "la-combo-empty";
      empty.textContent = "Нічого не знайдено";
      cs.list.appendChild(empty);
      return;
    }

    matched.forEach(function (opt) {
      var isSelected = opt.value === currentVal;
      var li = document.createElement("li");
      li.className = "la-combo-item" + (isSelected ? " is-selected" : "");
      li.setAttribute("role", "option");
      li.setAttribute("aria-selected", String(isSelected));

      var nameEl = document.createElement("span");
      nameEl.className = "la-combo-item__name";
      nameEl.textContent = opt.textContent;
      li.appendChild(nameEl);

      if (isSelected) {
        var check = document.createElement("span");
        check.className = "la-combo-item__check";
        check.textContent = "✓";
        li.appendChild(check);
      }

      li.addEventListener("click", function (e) {
        e.stopPropagation();
        cs.select.value = opt.value;
        cs.popover.hidden = true;
        cs.trigger.setAttribute("aria-expanded", "false");
        if (cs.container) cs.container.classList.remove("is-dropdown-open");
        syncCustomSelect(cs);
        cs.select.dispatchEvent(new Event("change", { bubbles: true }));
      });

      cs.list.appendChild(li);
    });
  }

  function syncCustomSelect(cs) {
    var opts = Array.prototype.slice.call(cs.select.options || cs.select.children || []);
    var current = opts[0] || null;
    for (var i = 0; i < opts.length; i++) {
      if (opts[i].value === cs.select.value) {
        current = opts[i];
        break;
      }
    }
    cs.triggerText.textContent = current ? current.textContent : "";
    var isDisabled = Boolean(cs.select.disabled);
    cs.trigger.disabled = isDisabled;
    cs.trigger.classList.toggle("is-disabled", isDisabled);
    cs.trigger.classList.toggle("is-placeholder", !cs.isFilter && cs.select.value === "");
    renderCustomSelectOptions(cs, cs.searchInput ? cs.searchInput.value : "");
  }

  function syncAllCustomSelects() {
    customSelects.forEach(syncCustomSelect);
  }

  function enhanceCustomSelect(selectEl, opts) {
    if (!selectEl || selectEl._customEnhanced || !selectEl.parentNode) return;
    if (typeof document.createElementNS !== "function") return;
    var options = opts || {};

    var container =
      selectEl.closest(".la-row-box") ||
      selectEl.closest(".la-field") ||
      selectEl.closest(".filter-slot") ||
      selectEl.closest(".la-custom-usa__field") ||
      selectEl.parentNode;

    selectEl._customEnhanced = true;
    selectEl.classList.add("la-native-select-hidden");
    selectEl.tabIndex = -1;

    var trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className =
      "la-combo-trigger" + (options.isFilter ? " la-combo-trigger--filter" : "");
    trigger.setAttribute("aria-haspopup", "listbox");
    trigger.setAttribute("aria-expanded", "false");

    var triggerText = document.createElement("span");
    triggerText.className = "la-combo-trigger__text";
    trigger.appendChild(triggerText);
    trigger.appendChild(createDropdownArrowSvg());

    selectEl.parentNode.insertBefore(trigger, selectEl.nextSibling);

    var popover = document.createElement("div");
    popover.className = "la-combo-popover";
    popover.hidden = true;

    var searchInput = null;
    if (options.searchable) {
      var searchWrap = document.createElement("div");
      searchWrap.className = "la-combo-search-wrap";
      searchInput = document.createElement("input");
      searchInput.type = "search";
      searchInput.className = "la-combo-search";
      searchInput.placeholder = options.searchPlaceholder || "Пошук...";
      searchInput.autocomplete = "off";
      searchWrap.appendChild(searchInput);
      popover.appendChild(searchWrap);
    }

    var list = document.createElement("ul");
    list.className = "la-combo-list";
    list.setAttribute("role", "listbox");
    popover.appendChild(list);

    container.appendChild(popover);

    var cs = {
      select: selectEl,
      container: container,
      trigger: trigger,
      triggerText: triggerText,
      popover: popover,
      searchInput: searchInput,
      list: list,
      isFilter: Boolean(options.isFilter)
    };
    customSelects.push(cs);

    function openPopover() {
      if (cs.select.disabled) return;
      closeAllDropdowns(popover);
      popover.hidden = false;
      trigger.setAttribute("aria-expanded", "true");
      container.classList.add("is-dropdown-open");
      if (searchInput) {
        searchInput.value = "";
        renderCustomSelectOptions(cs, "");
        searchInput.focus();
      } else {
        renderCustomSelectOptions(cs, "");
      }
    }

    function closePopover() {
      popover.hidden = true;
      trigger.setAttribute("aria-expanded", "false");
      container.classList.remove("is-dropdown-open");
    }

    trigger.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (popover.hidden) openPopover();
      else closePopover();
    });

    // Клік по <label class="filter-slot"> або <label for="..."> відкриває наш кастомний список
    if (container && container.tagName === "LABEL") {
      container.addEventListener("click", function (e) {
        if (popover.contains(e.target) || trigger.contains(e.target)) return;
        e.preventDefault();
        if (popover.hidden) openPopover();
        else closePopover();
      });
    } else if (selectEl.id && typeof container.querySelector === "function") {
      var linkedLabel = container.querySelector('label[for="' + selectEl.id + '"]');
      if (linkedLabel) {
        linkedLabel.addEventListener("click", function (e) {
          e.preventDefault();
          e.stopPropagation();
          if (popover.hidden) openPopover();
          else closePopover();
        });
      }
    }

    if (searchInput) {
      searchInput.addEventListener("click", function (e) {
        e.stopPropagation();
      });
      searchInput.addEventListener("input", function (e) {
        e.stopPropagation();
        renderCustomSelectOptions(cs, e.target.value);
      });
      searchInput.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
          e.preventDefault();
          var first = list.querySelector(".la-combo-item");
          if (first) first.click();
        }
      });
    }

    selectEl.addEventListener("change", function () {
      syncCustomSelect(cs);
    });

    syncCustomSelect(cs);
  }

  function initCustomSelects() {
    enhanceCustomSelect(els.filterBrand, { isFilter: true });
    enhanceCustomSelect(els.filterFuel, { isFilter: true });
    enhanceCustomSelect(els.filterSort, { isFilter: true });

    enhanceCustomSelect(els.calcArrivalPort);
    enhanceCustomSelect(els.calcVehicleType);
    enhanceCustomSelect(els.calcFuelType);
    enhanceCustomSelect(els.calcYear, { searchable: true, searchPlaceholder: "Введіть рік..." });
    enhanceCustomSelect(els.calcEngineLiters, { searchable: true, searchPlaceholder: "Наприклад: 2 або 3.5..." });
    enhanceCustomSelect(els.calcAuction);
    enhanceCustomSelect(els.calcCustomPort);
    enhanceCustomSelect(els.calcDocs);
  }

  function openLocationPopover() {
    if (!els.locationPopover || !els.locationTrigger) return;
    closeAllDropdowns(els.locationPopover);
    els.locationPopover.hidden = false;
    els.locationTrigger.setAttribute("aria-expanded", "true");
    if (els.locationCombobox) els.locationCombobox.classList.add("is-dropdown-open");
    if (els.locationSearch) {
      els.locationSearch.value = "";
      renderLocationList("");
      els.locationSearch.focus();
    }
  }

  function closeLocationPopover() {
    if (!els.locationPopover || !els.locationTrigger || els.locationPopover.hidden) return;
    els.locationPopover.hidden = true;
    els.locationTrigger.setAttribute("aria-expanded", "false");
    if (els.locationCombobox) els.locationCombobox.classList.remove("is-dropdown-open");
  }

  function getFilteredCars() {
    var f = state.filters;
    var brandFilter = String(f.brand || "all").trim().toLowerCase();
    var fuelFilter = String(f.fuel || "all").trim().toLowerCase();
    var list = cars.filter(function (car) {
      if (brandFilter !== "all" && String(car.brand || "").trim().toLowerCase() !== brandFilter) return false;
      if (fuelFilter !== "all" && String(car.fuel || "").trim().toLowerCase() !== fuelFilter) return false;
      if (f.yearMin > 0 && car.year < f.yearMin) return false;
      if (f.yearMax > 0 && car.year > f.yearMax) return false;
      if (f.priceMin > 0 && car.priceUsd < f.priceMin) return false;
      if (f.priceMax > 0 && car.priceUsd > f.priceMax) return false;
      return true;
    });

    if (f.sort === "price-asc") {
      list.sort(function (a, b) { return a.priceUsd - b.priceUsd; });
    } else if (f.sort === "price-desc") {
      list.sort(function (a, b) { return b.priceUsd - a.priceUsd; });
    } else if (f.sort === "year-desc") {
      list.sort(function (a, b) { return b.year - a.year; });
    } else if (f.sort === "mileage-asc") {
      list.sort(function (a, b) { return a.mileageThousandKm - b.mileageThousandKm; });
    }

    return list;
  }

  function getStatusModifier(status) {
    var normalized = String(status || "").trim().toLowerCase();
    if (normalized === "бронь" || normalized === "заброньовано") return "reserved";
    if (normalized === "продано") return "sold";
    if (normalized === "в дорозі") return "transit";
    return "";
  }

  function extractYouTubeId(src) {
    if (window.LubeAvtoStore && typeof window.LubeAvtoStore.extractYouTubeId === "function") {
      return window.LubeAvtoStore.extractYouTubeId(src);
    }
    var match = String(src || "").match(
      /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/i
    );
    return match ? match[1] : null;
  }

  function isVideoUrl(src) {
    if (window.LubeAvtoStore && typeof window.LubeAvtoStore.isVideoUrl === "function") {
      return window.LubeAvtoStore.isVideoUrl(src);
    }
    var str = String(src || "").trim();
    if (!str) return false;
    if (/^data:video\//i.test(str) || extractYouTubeId(str) || /^blob:/i.test(str)) return true;
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

  function getCarImages(car) {
    var list = [];
    if (Array.isArray(car.images)) {
      car.images.forEach(function (src) {
        if (src && list.indexOf(src) === -1) list.push(src);
      });
    }
    if (Array.isArray(car.videos)) {
      car.videos.forEach(function (src) {
        if (src && list.indexOf(src) === -1) list.push(src);
      });
    }
    if (car.image && !isVideoUrl(car.image) && list.indexOf(car.image) === -1 && list.length === 0) {
      list.unshift(car.image);
    }
    if (list.length === 0) {
      list.push(car.image || "assets/img/hero.jpg");
    }
    return list;
  }

  function getCardCoverImage(car) {
    if (car.image && !isVideoUrl(car.image)) return car.image;
    var mediaList = getCarImages(car);
    for (var i = 0; i < mediaList.length; i++) {
      if (!isVideoUrl(mediaList[i])) return mediaList[i];
    }
    for (var j = 0; j < mediaList.length; j++) {
      var ytThumb = getYouTubeThumbUrl(mediaList[j]);
      if (ytThumb) return ytThumb;
    }
    return "assets/img/hero.jpg";
  }

  function createCarCard(car) {
    var card = document.createElement("article");
    card.className = "car-card";
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", car.title + ", " + car.year + " рік, " + formatUsdShowcase(car.priceUsd));

    var media = document.createElement("div");
    media.className = "car-card__media";

    var mediaList = getCarImages(car);
    var hasVideo = mediaList.some(isVideoUrl);

    var img = document.createElement("img");
    img.className = "car-card__img";
    img.src = getCardCoverImage(car);
    img.alt = car.title + " — " + car.year + " р.";
    img.loading = "lazy";
    img.onerror = function () {
      if (img._fallbackApplied) return;
      img._fallbackApplied = true;
      img.src = "assets/img/hero.jpg";
    };
    media.appendChild(img);

    if (car.status) {
      var badge = document.createElement("span");
      var statusMod = getStatusModifier(car.status);
      badge.className = "car-card__badge" + (statusMod ? " car-card__badge--" + statusMod : "");
      badge.textContent = car.status;
      media.appendChild(badge);
    }

    if (hasVideo) {
      var videoTag = document.createElement("span");
      videoTag.className = "car-card__video-tag";
      videoTag.textContent = "▶ Відео";
      media.appendChild(videoTag);
    }

    var body = document.createElement("div");
    body.className = "car-card__body";

    var title = document.createElement("h2");
    title.className = "car-card__title";
    title.textContent = car.title;

    var specs = document.createElement("div");
    specs.className = "car-card__specs";

    var yearLine = document.createElement("div");
    yearLine.textContent = "Рік - " + car.year;

    var mileageLine = document.createElement("div");
    mileageLine.textContent = "Пробіг - " + car.mileageText;

    specs.appendChild(yearLine);
    specs.appendChild(mileageLine);

    var tags = document.createElement("div");
    tags.className = "car-card__tags";
    [car.fuel, car.engineLabel, car.transmission].forEach(function (label) {
      if (!label) return;
      var chip = document.createElement("span");
      chip.className = "car-tag";
      chip.textContent = label;
      tags.appendChild(chip);
    });

    var footer = document.createElement("div");
    footer.className = "car-card__footer";

    var more = document.createElement("span");
    more.className = "car-card__more";
    more.textContent = "Детальніше →";

    var price = document.createElement("div");
    price.className = "car-card__price";
    price.textContent = formatUsdShowcase(car.priceUsd);

    footer.appendChild(more);
    footer.appendChild(price);

    body.appendChild(title);
    body.appendChild(specs);
    body.appendChild(tags);
    body.appendChild(footer);

    card.appendChild(media);
    card.appendChild(body);

    function openHandler() {
      openCarModal(car);
    }

    card.addEventListener("click", openHandler);
    card.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openHandler();
      }
    });

    return card;
  }

  function updateFilterHighlight() {
    var b = state.bounds;
    var f = state.filters;
    var yearActive = f.yearMin > b.minYear || f.yearMax < b.maxYear;
    var priceActive = f.priceMin > b.minPrice || f.priceMax < b.maxPrice;

    var controls = [
      { slot: els.filterBrand ? els.filterBrand.closest(".filter-slot") : null, active: f.brand !== "all" },
      { slot: els.filterFuel ? els.filterFuel.closest(".filter-slot") : null, active: f.fuel !== "all" },
      { slot: els.filterYearSlot, active: yearActive },
      { slot: els.filterPriceSlot, active: priceActive },
      { slot: els.filterSort ? els.filterSort.closest(".filter-slot") : null, active: f.sort !== "default" }
    ];

    var anyActive = false;
    controls.forEach(function (item) {
      if (item.slot) item.slot.classList.toggle("is-filtered", item.active);
      if (item.active) anyActive = true;
    });

    if (els.resetFiltersBtn) {
      els.resetFiltersBtn.hidden = !anyActive;
    }
  }

  function renderCars() {
    if (!hasLotDom()) return;
    var list = getFilteredCars();
    els.carsGrid.innerHTML = "";

    list.forEach(function (car) {
      els.carsGrid.appendChild(createCarCard(car));
    });

    var hasResults = list.length > 0;
    els.carsGrid.hidden = !hasResults;
    if (els.carsEmpty) els.carsEmpty.hidden = hasResults;

    if (els.carsCount) {
      els.carsCount.textContent =
        "Показано " + list.length + " із " + cars.length + " авто на майданчику";
    }

    updateFilterHighlight();
  }

  function resetFilters() {
    if (!hasLotDom()) return;
    state.filters = {
      brand: "all",
      fuel: "all",
      yearMin: state.bounds.minYear,
      yearMax: state.bounds.maxYear,
      priceMin: state.bounds.minPrice,
      priceMax: state.bounds.maxPrice,
      yearTouched: false,
      priceTouched: false,
      sort: "default"
    };
    if (els.filterBrand) els.filterBrand.value = "all";
    if (els.filterFuel) els.filterFuel.value = "all";
    if (els.filterSort) els.filterSort.value = "default";
    updateDualRangeUI();
    syncAllCustomSelects();
    renderCars();
  }

  function stopModalMedia() {
    if (els.modalVideo) {
      if (typeof els.modalVideo.pause === "function") els.modalVideo.pause();
      if (typeof els.modalVideo.removeAttribute === "function") {
        els.modalVideo.removeAttribute("src");
        if (typeof els.modalVideo.load === "function") els.modalVideo.load();
      } else {
        els.modalVideo.src = "";
      }
      els.modalVideo.hidden = true;
    }
    if (els.modalIframe) {
      if (typeof els.modalIframe.removeAttribute === "function") {
        els.modalIframe.removeAttribute("src");
      } else {
        els.modalIframe.src = "";
      }
      els.modalIframe.hidden = true;
    }
  }

  function renderModalGallery() {
    var images = state.modalGallery;
    if (!images || images.length === 0) return;

    var idx = state.modalGalleryIndex;
    if (idx < 0) idx = images.length - 1;
    if (idx >= images.length) idx = 0;
    state.modalGalleryIndex = idx;

    var activeSrc = images[idx];
    var ytEmbed = getYouTubeEmbedUrl(activeSrc);
    var activeIsVideo = isVideoUrl(activeSrc);

    stopModalMedia();

    if (ytEmbed && els.modalIframe) {
      if (els.modalImg) els.modalImg.hidden = true;
      els.modalIframe.src = ytEmbed;
      els.modalIframe.hidden = false;
    } else if (activeIsVideo && els.modalVideo) {
      if (els.modalImg) els.modalImg.hidden = true;
      els.modalVideo.src = activeSrc;
      els.modalVideo.hidden = false;
    } else if (els.modalImg) {
      els.modalImg._fallbackApplied = false;
      els.modalImg.onerror = function () {
        if (els.modalImg._fallbackApplied) return;
        els.modalImg._fallbackApplied = true;
        els.modalImg.src = "assets/img/hero.jpg";
      };
      els.modalImg.src = activeSrc;
      els.modalImg.hidden = false;
    }

    var hasMultiple = images.length > 1;
    if (els.modalGalleryPrev) els.modalGalleryPrev.hidden = !hasMultiple;
    if (els.modalGalleryNext) els.modalGalleryNext.hidden = !hasMultiple;

    if (els.modalGalleryThumbs) {
      els.modalGalleryThumbs.innerHTML = "";
      els.modalGalleryThumbs.hidden = !hasMultiple;

      if (hasMultiple) {
        var activeThumbBtn = null;
        images.forEach(function (src, thumbIdx) {
          var itemIsVideo = isVideoUrl(src);
          var ytThumb = itemIsVideo ? getYouTubeThumbUrl(src) : null;
          var btn = document.createElement("button");
          btn.type = "button";
          btn.className =
            "modal-thumb" +
            (itemIsVideo ? " modal-thumb--video" : "") +
            (thumbIdx === idx ? " is-active" : "");
          btn.setAttribute(
            "aria-label",
            (itemIsVideo ? "Відео " : "Фото ") + (thumbIdx + 1) + " з " + images.length
          );

          if (itemIsVideo && !ytThumb) {
            var thumbVid = document.createElement("video");
            thumbVid.src = src;
            thumbVid.muted = true;
            thumbVid.playsInline = true;
            thumbVid.preload = "metadata";
            btn.appendChild(thumbVid);
          } else {
            var thumbImg = document.createElement("img");
            thumbImg.src = ytThumb || src;
            thumbImg.alt = "";
            btn.appendChild(thumbImg);
          }

          if (itemIsVideo) {
            var playBadge = document.createElement("span");
            playBadge.className = "modal-thumb__play";
            playBadge.textContent = "▶";
            btn.appendChild(playBadge);
          }

          btn.addEventListener("click", function () {
            state.modalGalleryIndex = thumbIdx;
            renderModalGallery();
          });

          if (thumbIdx === idx) activeThumbBtn = btn;
          els.modalGalleryThumbs.appendChild(btn);
        });

        if (activeThumbBtn && typeof requestAnimationFrame === "function") {
          requestAnimationFrame(function () {
            if (!els.modalGalleryThumbs) return;
            var targetLeft =
              activeThumbBtn.offsetLeft -
              els.modalGalleryThumbs.clientWidth / 2 +
              activeThumbBtn.offsetWidth / 2;
            els.modalGalleryThumbs.scrollLeft = Math.max(0, targetLeft);
          });
        }
      }
    }
  }

  function stepModalGallery(delta) {
    if (!state.modalGallery || state.modalGallery.length <= 1) return;
    state.modalGalleryIndex += delta;
    renderModalGallery();
  }

  function openCarModal(car) {
    state.lastFocusedEl = document.activeElement;
    var rateUah = (config.rates && config.rates.usdToUah) || 41.5;

    state.modalGallery = getCarImages(car);
    state.modalGalleryIndex = 0;
    els.modalImg.alt = car.title;
    renderModalGallery();

    var statusText = car.status || "В наявності";
    var modalStatusMod = getStatusModifier(statusText);
    els.modalStatus.className = "modal-badge" + (modalStatusMod ? " modal-badge--" + modalStatusMod : "");
    els.modalStatus.textContent = statusText;
    els.modalTitle.textContent = car.title;
    els.modalPriceUsd.textContent = formatUsdShowcase(car.priceUsd);
    els.modalPriceUah.textContent = formatUah(car.priceUsd * rateUah);
    els.modalDesc.textContent = car.description || "";

    var specRows = [
      { label: "Рік випуску", value: String(car.year) },
      { label: "Пробіг", value: car.mileageText },
      { label: "Двигун", value: car.engineLabel || (car.engineCc ? car.engineCc + " см³" : "") },
      { label: "Паливо", value: car.fuel },
      { label: "Коробка", value: car.transmission },
      { label: "Привід", value: car.drive },
      { label: "Кузов", value: car.bodyType },
      { label: "Колір", value: car.color }
    ];

    els.modalSpecs.innerHTML = "";
    specRows.forEach(function (row) {
      if (!row.value) return;
      var wrap = document.createElement("div");
      wrap.className = "modal-specs__item";
      var dt = document.createElement("dt");
      dt.textContent = row.label;
      var dd = document.createElement("dd");
      dd.textContent = row.value;
      wrap.appendChild(dt);
      wrap.appendChild(dd);
      els.modalSpecs.appendChild(wrap);
    });

    var baseTg = sanitizeHref(config.telegramUrl, ["https", "http"], "https://t.me/+380677002300");
    var message =
      "Доброго дня! Цікавить " +
      car.title +
      " (" +
      car.year +
      " р., " +
      formatUsdShowcase(car.priceUsd) +
      ") на майданчику у Мостиськах.";
    els.modalTg.href = appendQueryParam(baseTg, "text", message);

    els.modal.hidden = false;
    document.body.style.overflow = "hidden";
    els.modalClose.focus();
  }

  function closeCarModal() {
    if (els.modal.hidden) return;
    stopModalMedia();
    els.modal.hidden = true;
    document.body.style.overflow = "";
    if (state.lastFocusedEl && typeof state.lastFocusedEl.focus === "function") {
      state.lastFocusedEl.focus();
    }
  }

  function getSelectedLocation() {
    var id = els.calcLocation.value;
    if (!id) return null;
    for (var i = 0; i < locations.length; i++) {
      if (locations[i].id === id) return locations[i];
    }
    return null;
  }

  function syncCalculatorControlsState() {
    var fuel = els.calcFuelType.value;
    var vehicle = els.calcVehicleType.value;
    var isElectric = fuel === "electric";
    var isMoto = vehicle === "moto";

    els.calcYear.disabled = isElectric;
    els.calcBatteryWrap.hidden = !isElectric;
    els.calcMotoCcWrap.hidden = isElectric || !isMoto;
    els.calcEngineLitersWrap.hidden = isElectric || isMoto;

    var loc = getSelectedLocation();
    els.calcCustomUsaWrap.hidden = !(loc && loc.isCustom);

    var auctionMeta =
      (calcEngine && calcEngine.AUCTIONS && calcEngine.AUCTIONS[els.calcAuction.value]) || null;
    if (auctionMeta) {
      var locked = auctionMeta.docsMode !== "states";
      els.calcDocs.disabled = locked;
    } else {
      els.calcDocs.disabled = false;
    }

    syncAllCustomSelects();
  }

  function buildEstimateText(res) {
    var fuelLabels = {
      petrol: "Бензин",
      diesel: "Дизель",
      electric: "Електро",
      hybrid: "Гібрид"
    };
    var loc = getSelectedLocation();
    var engineStr =
      res.fuelType === "electric"
        ? "Батарея: " + (els.calcBatteryKwh.value || 0) + " кВт·год"
        : res.vehicleType === "moto"
        ? "Об'єм: " + (els.calcMotoCc.value || 0) + " см³"
        : "Об'єм: " + (els.calcEngineLiters.value || "—") + " л, " + (els.calcYear.value || "—") + " р.";

    var portName = res.arrivalPort === "odessa" ? "Одеса" : res.arrivalPort === "klaipeda" ? "Клайпеда" : "Не обрано";

    var lines = [
      "Розрахунок авто з аукціону — Любе Авто Мостиська",
      "Аукціон: " + (res.auctionLabel || "Не обрано") + (loc ? " (" + loc.name + ")" : ""),
      "Авто: " + (res.vehicleLabel || "Не обрано") + ", " + (fuelLabels[res.fuelType] || "Не обрано") + " (" + engineStr + ")",
      "Порт прибуття: " + portName,
      "— Ціна лота: " + formatUsdBadge(res.lotPrice),
      "— Аукціонний збір: " + formatUsdBadge(res.auctionFee),
      "— Доставка по США: " + formatUsdBadge(res.deliveryUsa),
      "— Документи на експорт: " + formatUsdBadge(res.exportDocs),
      "— Доставка з США" + (res.departurePort ? " (" + res.departurePort + ")" : "") + ": " + (res.seaAvailable ? formatUsdBadge(res.seaFreight) : "недоступно")
    ];

    if (res.arrivalPort === "odessa") {
      lines.push("— Вигрузка з порту Одеса + брокер: " + formatUsdBadge(res.odessaUnloadBroker));
    } else {
      lines.push(
        "— Вигрузка Клайпеда: " + formatUsdBadge(res.unloadKlaipeda),
        "— Доставка Клайпеда - Львів: " + formatUsdBadge(res.klaipedaLviv),
        "— Доставка на митницю: " + formatUsdBadge(res.deliveryToCustoms),
        "— Брокерські послуги: " + formatUsdBadge(res.brokerFee)
      );
    }

    lines.push(
      "— Кордон та спец. транспорт: " + formatUsdBadge(res.borderSpecialFee),
      "— Акциз: " + formatUsdBadge(res.excise),
      "— Ввізне мито: " + formatUsdBadge(res.importDuty),
      "— ПДВ: " + formatUsdBadge(res.vat)
    );

    if (res.nonVatFee > 0) {
      lines.push("— Фінансовий збір за НЕ сплату ПДВ: " + formatUsdBadge(res.nonVatFee));
    }

    lines.push("— Комісія ЛюбеАвто: " + formatUsdBadge(res.lubeCommission));
    if (res.insuranceFee > 0) lines.push("— Страхування: " + formatUsdBadge(res.insuranceFee));
    if (res.wireTransferFee > 0) lines.push("— Комісія за переказ коштів: " + formatUsdBadge(res.wireTransferFee));

    lines.push("ВСЬОГО ЦІНА З ДОСТАВКОЮ: " + formatUsdSpaced(res.totalUsd) + " (" + formatUah(res.totalUah) + ")");
    return lines.join("\n");
  }

  function updateCalculator() {
    if (!hasCalcDom() || !calcEngine) return;
    syncCalculatorControlsState();

    var loc = getSelectedLocation();
    var arrivalPort = els.calcArrivalPort.value;
    var baseUsaDelivery = loc ? (loc.isCustom ? Number(els.calcCustomUsaFee.value) : loc.deliveryUsd) : 0;
    var departurePortKlaipeda = loc ? (loc.isCustom ? els.calcCustomPort.value : loc.portKlaipeda) : "";
    var departurePortOdessa = loc ? (loc.isCustom ? els.calcCustomPort.value : loc.portOdessa) : "";

    var res = calcEngine.calculateAuctionImport({
      arrivalPort: arrivalPort,
      vehicleType: els.calcVehicleType.value,
      fuelType: els.calcFuelType.value,
      year: els.calcYear.value,
      engineLiters: Number(els.calcEngineLiters.value),
      motoCc: Number(els.calcMotoCc.value),
      batteryKwh: Number(els.calcBatteryKwh.value),
      price: Number(els.calcPrice.value),
      auction: els.calcAuction.value,
      docsState: els.calcDocs.value,
      locationSelected: Boolean(loc),
      baseUsaDeliveryUsd: baseUsaDelivery,
      portKlaipeda: departurePortKlaipeda,
      portOdessa: departurePortOdessa,
      odessaSupported: !loc ? true : loc.isCustom ? true : loc.odessaSupported,
      seaKlaipedaUsd: !loc || loc.isCustom ? undefined : loc.seaKlaipedaUsd,
      seaOdessaUsd: !loc || loc.isCustom ? undefined : loc.seaOdessaUsd,
      noElectricSeaSurcharge: Boolean(loc && loc.noElectricSeaSurcharge),
      insuranceEnabled: els.calcInsurance.checked,
      wireEnabled: els.calcWireFee.checked,
      usdToUah: (config.rates && config.rates.usdToUah) || 41.5,
      eurToUsd: (config.rates && config.rates.eurToUsd) || 1.11044
    });

    state.lastCalculation = res;

    els.resAuctionFee.textContent = formatUsdBadge(res.auctionFee);
    els.resDeliveryUsa.textContent = formatUsdBadge(res.deliveryUsa);
    els.resExportDocs.textContent = formatUsdBadge(res.exportDocs);

    els.labelSeaFreight.textContent = res.departurePort
      ? "Доставка з США - " + res.departurePort
      : "Доставка з США";
    els.resSeaFreight.textContent = res.seaAvailable ? formatUsdBadge(res.seaFreight) : "Н/Д";

    var isOdessa = res.arrivalPort === "odessa";
    els.rowUnloadKlaipeda.hidden = isOdessa;
    els.rowKlaipedaLviv.hidden = isOdessa;
    els.rowDeliveryCustoms.hidden = isOdessa;
    els.rowBrokerFee.hidden = isOdessa;
    els.rowOdessaUnload.hidden = !isOdessa;

    els.resUnloadKlaipeda.textContent = formatUsdBadge(res.unloadKlaipeda);
    els.resKlaipedaLviv.textContent = formatUsdBadge(res.klaipedaLviv);
    els.resDeliveryCustoms.textContent = formatUsdBadge(res.deliveryToCustoms);
    els.resOdessaUnload.textContent = formatUsdBadge(res.odessaUnloadBroker);

    els.resBorderSpec.textContent = formatUsdBadge(res.borderSpecialFee);
    els.resExcise.textContent = formatUsdBadge(res.excise);
    els.resImportDuty.textContent = formatUsdBadge(res.importDuty);
    els.resVat.textContent = formatUsdBadge(res.vat);

    els.rowNonVatFee.hidden = res.nonVatFee <= 0;
    els.resNonVatFee.textContent = formatUsdBadge(res.nonVatFee);
    els.resBrokerFee.textContent = formatUsdBadge(res.brokerFee);
    els.resLubeCommission.textContent = formatUsdBadge(res.lubeCommission);
    els.resInsurance.textContent = formatUsdBadge(res.insuranceBase);

    els.labelWireFee.textContent = res.isCanada
      ? "Комісія за переказ коштів в Канаду"
      : "Комісія за переказ коштів в США";
    els.resWireFee.textContent = formatUsdBadge(res.wireBase);

    els.calcCommercialWarning.hidden = !res.isCommercialWarning;
    els.calcOdessaWarning.hidden = res.seaAvailable;

    els.resTotalUsd.textContent = res.seaAvailable ? formatUsdSpaced(res.totalUsd) : "Недоступно";
    els.resTotalUah.textContent = res.seaAvailable ? formatUah(res.totalUah) : "Оберіть порт Клайпеда";

    var baseTg = sanitizeHref(config.telegramUrl, ["https", "http"], "https://t.me/+380677002300");
    els.sendCalcTgBtn.href = appendQueryParam(baseTg, "text", buildEstimateText(res));
  }

  function clearCalculator() {
    els.calcArrivalPort.value = "";
    els.calcVehicleType.value = "";
    els.calcFuelType.value = "";
    els.calcYear.value = "";
    els.calcEngineLiters.value = "";
    els.calcMotoCc.value = "";
    els.calcBatteryKwh.value = "";
    els.calcPrice.value = "";
    els.calcAuction.value = "";
    clearLocationSelection(true);
    renderLocationList("");
    els.calcDocs.value = "";
    els.calcInsurance.checked = true;
    els.calcWireFee.checked = false;
    updateCalculator();
    showToast("Поля калькулятора очищено");
  }

  function copyEstimate() {
    if (!state.lastCalculation) return;
    var text = buildEstimateText(state.lastCalculation);

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(text)
        .then(function () {
          showToast("Розрахунок скопійовано в буфер обміну");
        })
        .catch(function () {
          fallbackCopy(text);
        });
    } else {
      fallbackCopy(text);
    }
  }

  function fallbackCopy(text) {
    var area = document.createElement("textarea");
    area.value = text;
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    try {
      document.execCommand("copy");
      showToast("Розрахунок скопійовано в буфер обміну");
    } catch (e) {
      showToast("Не вдалося скопіювати автоматично");
    }
    document.body.removeChild(area);
  }

  function setActiveNav(sectionName) {
    els.navLinks.forEach(function (link) {
      link.classList.toggle("is-active", link.getAttribute("data-nav") === sectionName);
    });
  }

  function bindEvents() {
    if (hasLotDom()) {
      els.filterBrand.addEventListener("change", function (e) {
        state.filters.brand = e.target.value;
        renderCars();
      });
      els.filterFuel.addEventListener("change", function (e) {
        state.filters.fuel = e.target.value;
        renderCars();
      });

      function onYearRangeInput(changedEnd) {
        if (!els.filterYearMin || !els.filterYearMax) return;
        var minVal = Number(els.filterYearMin.value);
        var maxVal = Number(els.filterYearMax.value);
        if (changedEnd === "min" && minVal > maxVal) minVal = maxVal;
        if (changedEnd === "max" && maxVal < minVal) maxVal = minVal;
        state.filters.yearMin = minVal;
        state.filters.yearMax = maxVal;
        state.filters.yearTouched = true;
        updateDualRangeUI();
        renderCars();
      }

      function onPriceRangeInput(changedEnd) {
        if (!els.filterPriceMin || !els.filterPriceMax) return;
        var minVal = Number(els.filterPriceMin.value);
        var maxVal = Number(els.filterPriceMax.value);
        if (changedEnd === "min" && minVal > maxVal) minVal = maxVal;
        if (changedEnd === "max" && maxVal < minVal) maxVal = minVal;
        state.filters.priceMin = minVal;
        state.filters.priceMax = maxVal;
        state.filters.priceTouched = true;
        updateDualRangeUI();
        renderCars();
      }

      if (els.filterYearMin) {
        els.filterYearMin.addEventListener("input", function () { onYearRangeInput("min"); });
        els.filterYearMin.addEventListener("change", function () { onYearRangeInput("min"); });
      }
      if (els.filterYearMax) {
        els.filterYearMax.addEventListener("input", function () { onYearRangeInput("max"); });
        els.filterYearMax.addEventListener("change", function () { onYearRangeInput("max"); });
      }
      if (els.filterPriceMin) {
        els.filterPriceMin.addEventListener("input", function () { onPriceRangeInput("min"); });
        els.filterPriceMin.addEventListener("change", function () { onPriceRangeInput("min"); });
      }
      if (els.filterPriceMax) {
        els.filterPriceMax.addEventListener("input", function () { onPriceRangeInput("max"); });
        els.filterPriceMax.addEventListener("change", function () { onPriceRangeInput("max"); });
      }

      els.filterSort.addEventListener("change", function (e) {
        state.filters.sort = e.target.value;
        renderCars();
      });

      if (els.resetFiltersBtn) els.resetFiltersBtn.addEventListener("click", resetFilters);
      if (els.emptyResetBtn) els.emptyResetBtn.addEventListener("click", resetFilters);
    }

    if (hasCalcDom()) {
      els.calcForm.addEventListener("input", function (e) {
        if (e.target === els.locationSearch) return;
        updateCalculator();
      });
      els.calcForm.addEventListener("change", function (e) {
        if (e.target === els.locationSearch) return;
        updateCalculator();
      });
      if (els.calcWireFee) els.calcWireFee.addEventListener("change", updateCalculator);

      if (els.locationTrigger) {
        els.locationTrigger.addEventListener("click", function () {
          if (els.locationPopover.hidden) {
            openLocationPopover();
          } else {
            closeLocationPopover();
          }
        });
      }
      if (els.locationSearch) {
        els.locationSearch.addEventListener("input", function (e) {
          renderLocationList(e.target.value);
        });
        els.locationSearch.addEventListener("keydown", function (e) {
          if (e.key === "Enter") {
            e.preventDefault();
            var firstItem = els.locationList.querySelector(".la-combo-item");
            if (firstItem) firstItem.click();
          }
        });
      }
      if (els.calcRecalcBtn) {
        els.calcRecalcBtn.addEventListener("click", function () {
          updateCalculator();
          showToast("Розрахунок оновлено");
        });
      }
      if (els.calcClearBtn) els.calcClearBtn.addEventListener("click", clearCalculator);
      if (els.copyEstimateBtn) els.copyEstimateBtn.addEventListener("click", copyEstimate);
    }

    if (hasCalcDom() || hasLotDom()) {
      document.addEventListener("click", function (e) {
        var insideLocation = els.locationCombobox && els.locationCombobox.contains(e.target);
        var insideCustomSelect = customSelects.some(function (cs) {
          return cs.container && cs.container.contains(e.target);
        });
        if (!insideLocation && !insideCustomSelect) {
          closeAllDropdowns(null);
        }
      });
    }

    if (els.modal) {
      if (els.modalClose) els.modalClose.addEventListener("click", closeCarModal);
      if (els.modalGalleryPrev) {
        els.modalGalleryPrev.addEventListener("click", function () {
          stepModalGallery(-1);
        });
      }
      if (els.modalGalleryNext) {
        els.modalGalleryNext.addEventListener("click", function () {
          stepModalGallery(1);
        });
      }
      if (els.modalGalleryThumbs) {
        els.modalGalleryThumbs.addEventListener("wheel", function (e) {
          if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
            e.preventDefault();
            els.modalGalleryThumbs.scrollLeft += e.deltaY;
          }
        });
      }
      els.modal.addEventListener("click", function (e) {
        if (e.target === els.modal) closeCarModal();
      });
    }

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        if (els.modal && !els.modal.hidden) closeCarModal();
        closeAllDropdowns(null);
      } else if (els.modal && !els.modal.hidden) {
        if (e.key === "ArrowLeft") {
          stepModalGallery(-1);
        } else if (e.key === "ArrowRight") {
          stepModalGallery(1);
        }
      }
    });

    if (els.burgerBtn && els.mobileMenu) {
      els.burgerBtn.addEventListener("click", function () {
        var expanded = els.burgerBtn.getAttribute("aria-expanded") === "true";
        els.burgerBtn.setAttribute("aria-expanded", String(!expanded));
        els.mobileMenu.hidden = expanded;
      });
    }

    els.navLinks.forEach(function (link) {
      link.addEventListener("click", function () {
        setActiveNav(link.getAttribute("data-nav"));
        if (els.mobileMenu && !els.mobileMenu.hidden && els.burgerBtn) {
          els.mobileMenu.hidden = true;
          els.burgerBtn.setAttribute("aria-expanded", "false");
        }
      });
    });

    var lotEl = document.getElementById("lot");
    var calcEl = document.getElementById("calculator");
    if ("IntersectionObserver" in window && lotEl && calcEl) {
      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            setActiveNav(entry.target.id === "calculator" ? "calculator" : "lot");
          });
        },
        { rootMargin: "-40% 0px -45% 0px" }
      );
      observer.observe(lotEl);
      observer.observe(calcEl);
    }
  }

  function init() {
    cacheElements();
    var pageName = document.body && document.body.getAttribute("data-page");
    if (pageName) setActiveNav(pageName);

    hydrateContacts();
    if (hasLotDom()) initFilterOptions();
    if (hasCalcDom()) initCalculatorSelects();
    initCustomSelects();
    if (hasLotDom()) renderCars();
    if (hasCalcDom()) updateCalculator();
    bindEvents();

    if (window.LubeAvtoStore && typeof window.LubeAvtoStore.loadPublicState === "function") {
      window.LubeAvtoStore
        .loadPublicState()
        .then(function (loaded) {
          if (!loaded) return;
          if (loaded.config) config = loaded.config;
          if (Array.isArray(loaded.cars)) cars = loaded.cars;
          hydrateContacts();
          if (hasLotDom()) {
            initFilterOptions();
            syncAllCustomSelects();
            renderCars();
          }
          if (hasCalcDom()) {
            syncAllCustomSelects();
            updateCalculator();
          }
        })
        .catch(function (err) {
          if (typeof console !== "undefined" && console.warn) {
            console.warn("Не вдалося завантажити дані кабінету менеджера:", err);
          }
        });
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
