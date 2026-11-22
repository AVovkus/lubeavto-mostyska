(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.LubeAvtoCalculator = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var EUR_TO_USD = 1.11;
  var CAD_RATE_PAY = 0.7176;
  var DEFAULT_USD_TO_UAH = 41.5;

  var AUCTIONS = {
    copart: {
      id: "copart",
      label: "Copart",
      isCanada: false,
      docsMode: "states",
      wireRate: 0.01,
      nonVatFee: 0
    },
    iaai: {
      id: "iaai",
      label: "IAAI",
      isCanada: false,
      docsMode: "states",
      wireRate: 0.01,
      nonVatFee: 0
    },
    impact_canada: {
      id: "impact_canada",
      label: "IMPACT Canada",
      isCanada: true,
      docsMode: "fixed_350",
      wireRate: 0.02,
      nonVatFee: 250
    },
    copart_canada: {
      id: "copart_canada",
      label: "Copart Canada",
      isCanada: true,
      docsMode: "fixed_350",
      wireRate: 0.02,
      nonVatFee: 250
    },
    manheim: {
      id: "manheim",
      label: "Manheim",
      isCanada: false,
      docsMode: "fixed_250_locked",
      wireRate: 0.01,
      nonVatFee: 0
    },
    crashed_toys: {
      id: "crashed_toys",
      label: "CrashedToys",
      isCanada: false,
      docsMode: "states",
      wireRate: 0.01,
      nonVatFee: 0
    },
    adesa: {
      id: "adesa",
      label: "Adesa",
      isCanada: false,
      docsMode: "fixed_250",
      wireRate: 0.01,
      nonVatFee: 0
    },
    acv_auction: {
      id: "acv_auction",
      label: "ACVauction",
      isCanada: false,
      docsMode: "fixed_250",
      wireRate: 0.01,
      nonVatFee: 0
    }
  };

  // Точні таблиці аукціонних зборів із lubeavto.com.ua (верхня межа порога [ціна, базовий збір])
  var AUCTION_TABLES = {
    copart: [[49,71],[99,71],[199,145],[299,180],[349,205],[399,220],[449,245],[499,255],[549,280],[599,290],[699,305],[799,330],[899,350],[999,365],[1199,405],[1299,425],[1399,440],[1499,455],[1599,480],[1699,495],[1799,515],[1999,535],[2399,555],[2499,590],[2999,625],[3499,670],[3999,720],[4499,780],[4999,805],[5999,855],[6499,915],[6999,935],[7499,970],[7999,990],[8499,1030],[8999,1050],[9999,1050],[10499,1080],[10999,1080],[11499,1080],[11999,1090],[12499,1105],[14999,1120]],
    iaai: [[49,81],[99,81],[199,155],[299,190],[349,215],[399,230],[449,255],[499,265],[549,290],[599,300],[699,315],[799,340],[899,360],[999,375],[1199,415],[1299,435],[1399,450],[1499,465],[1599,490],[1699,505],[1799,525],[1999,545],[2399,565],[2499,600],[2999,635],[3499,680],[3999,730],[4499,790],[4999,815],[5999,865],[6499,925],[6999,945],[7499,980],[7999,1000],[8499,1040],[8999,1060],[9999,1060],[10499,1090],[10999,1090],[11499,1090],[11999,1100],[12499,1115],[14999,1130]],
    crashed_toys: [[49,160],[99,175],[199,249],[299,284],[349,319],[399,312],[449,324],[499,329],[549,354],[599,359],[699,379],[799,414],[899,439],[999,459],[1199,509],[1299,544],[1399,544],[1499,569],[1599,589],[1699,619],[1799,634],[1999,684],[2399,729],[2499,729],[2999,799],[3499,924],[3999,929],[4499,949],[4999,959],[5499,1019],[5999,1054],[6499,1119],[6999,1149],[7499,1169],[7999,1289],[8999,1304],[9999,1329]],
    impact_canada: [[49,118.4],[99,203.8],[199,239.68],[299,254.03],[399,282.73],[499,293.5],[599,300.67],[699,325.79],[799,336.55],[999,343.73],[1199,378.89],[1399,382.48],[1499,393.24],[1599,429.12],[1699,443.48],[1799,457.83],[1999,465],[2499,482.94],[2999,518.82],[3499,540.35],[3999,558.29],[4999,583.41],[5999,601.35],[7499,633.64],[7999,651.58],[9999,658.76],[14999,694.64],[19999,730.52],[24999,759.22]],
    copart_canada: [[49,88.98],[99,99.75],[199,149.26],[299,163.61],[399,185.14],[499,195.9],[599,210.26],[699,235.37],[799,248.29],[899,253.31],[999,253.31],[1199,292.78],[1299,296.37],[1399,296.37],[1499,307.13],[1599,343.01],[1699,357.36],[1799,371.72],[1999,378.89],[2399,396.83],[2499,396.83],[2999,432.71],[3499,454.24],[3999,472.18],[4499,572.64],[4999,590.58],[5999,590.58],[7499,647.99],[7999,658.76],[8499,683.87],[8999,683.87],[9999,683.87],[10499,687.46],[10999,687.46],[11499,687.46],[11999,687.46],[12499,687.46],[14999,687.46]],
    manheim: [[1000,225],[3000,280],[5000,340],[7000,390],[9000,425],[11000,465],[13000,495],[15000,525],[17000,555],[19000,585],[21000,610],[23000,630],[25000,655],[27000,685],[30000,710],[32500,735],[35000,760],[37500,785],[40000,810],[45000,835],[50000,885],[60000,935],[70000,1035],[80000,1135],[90000,1235],[100000,1335],[110000,1435],[999999999,1555]],
    adesa: [[299,100],[499,150],[799,185],[999,200],[1999,275],[3999,300],[5999,350],[7999,400],[9999,425],[14999,450],[19999,500],[39999,550],[49999,600],[999999999,650]],
    acv_auction: [[499,220],[999,290],[1499,320],[1999,360],[2499,420],[2999,430],[3999,510],[4999,545],[5999,550],[6999,600],[7999,620],[8999,650],[9999,665],[12499,700],[14999,720],[16999,750],[19999,775],[24999,800],[59999,820]]
  };

  var VEHICLE_TYPES = {
    passenger: { id: "passenger", label: "Легковий", usaMultiplier: 1.0, klaipedaLviv: 800 },
    crossover: { id: "crossover", label: "Кросовер", usaMultiplier: 1.0, klaipedaLviv: 900 },
    suv: { id: "suv", label: "Позашляховик", usaMultiplier: 2.0, klaipedaLviv: 1200 },
    moto: { id: "moto", label: "Мотоцикл", usaMultiplier: 0.6, klaipedaLviv: 450 },
    van: { id: "van", label: "Бус / Пікап", usaMultiplier: 0.6, klaipedaLviv: 450 }
  };

  var SEA_FREIGHT_KLAIPEDA = {
    "New York, NY": 850,
    "SAVANNAH,GA": 900,
    "Florida, FL": 900,
    "CHICAGO,IL": 1000,
    "HOUSTON,TX": 1000,
    "LOSANGELES,CA": 1575,
    "OAKLAND, CA": 1575,
    "Montreal, CA": 1575,
    "VANCOUVER,CA": 2400
  };

  var SEA_FREIGHT_ODESSA = {
    "New York, NY": 1250,
    "SAVANNAH,GA": 1300,
    "CHICAGO,IL": 1650,
    "HOUSTON,TX": 1650,
    "LOSANGELES,CA": 2500,
    "Florida, FL": null,
    "OAKLAND, CA": null,
    "Montreal, CA": null,
    "VANCOUVER,CA": null
  };

  function clampNumber(value, min, max, fallback) {
    var num = Number(value);
    if (!Number.isFinite(num)) return fallback;
    if (typeof min === "number" && num < min) return min;
    if (typeof max === "number" && num > max) return max;
    return num;
  }

  function lookupStrictLt(table, targetPrice) {
    for (var i = 0; i < table.length; i++) {
      if (targetPrice < table[i][0]) {
        return table[i][1];
      }
    }
    return table[table.length - 1][1];
  }

  /**
   * Розраховує точний аукціонний збір за таблицею аукціону та ціною лота.
   */
  function getAuctionFee(auctionId, priceUsd) {
    var price = clampNumber(priceUsd, 0, 10000000, 0);
    var table = AUCTION_TABLES[auctionId] || AUCTION_TABLES.copart;

    if (auctionId === "copart") {
      if (price === 15000) return 1180;
      if (price > 14999) return Math.round(price * 0.06 + 290);
      return Math.round(lookupStrictLt(table, price) + 60);
    }

    if (auctionId === "iaai") {
      if (price === 15000) return 1180;
      if (price > 14999) return Math.round(price * 0.06 + 290);
      if (price <= 99) return 131;
      return Math.round(lookupStrictLt(table, price) + 60);
    }

    if (auctionId === "impact_canada" || auctionId === "copart_canada") {
      var priceCad = price / CAD_RATE_PAY;
      return Math.round(lookupStrictLt(table, priceCad));
    }

    if (auctionId === "crashed_toys") {
      if (price > 9999) return Math.round(price * 0.06 + 693);
      return Math.round(lookupStrictLt(table, price));
    }

    return Math.round(lookupStrictLt(table, price));
  }

  /**
   * Віковий коефіцієнт (перевірено на калькуляторі: 2027->1, 2019->6, 2018->7, 2009 і старше->15).
   */
  function getAgeFactor(yearValue, referenceYear) {
    if (yearValue === "2009" || String(yearValue) === "2009 і старше") return 15;
    var refYear = clampNumber(referenceYear, 2020, 2100, 2026);
    var yr = clampNumber(Math.round(Number(yearValue) || 2019), 1980, refYear + 1, 2019);
    var age = refYear - yr - 1;
    if (age < 1) return 1;
    if (age > 15) return 15;
    return age;
  }

  function getExportDocsFee(auctionId, docsState) {
    var auction = AUCTIONS[auctionId] || AUCTIONS.copart;
    if (auction.docsMode === "fixed_350") return 350;
    if (auction.docsMode === "fixed_250" || auction.docsMode === "fixed_250_locked") return 250;
    return docsState === "closed" ? 200 : 150;
  }

  function getSeaFreight(params) {
    var arrivalPort = params.arrivalPort === "odessa" ? "odessa" : "klaipeda";
    var departurePort = params.departurePort || "New York, NY";
    var fuelType = params.fuelType || "petrol";
    var vehicleType = params.vehicleType || "passenger";
    var isElectricOrHybrid = fuelType === "electric" || fuelType === "hybrid";

    if (arrivalPort === "odessa") {
      var mappedOdessa =
        typeof params.seaOdessaUsd === "number"
          ? params.seaOdessaUsd
          : SEA_FREIGHT_ODESSA[departurePort];
      if (!params.odessaSupported || mappedOdessa == null) {
        return { amount: null, available: false, portLabel: departurePort };
      }
      var odessaBase = clampNumber(mappedOdessa, 500, 5000, 1250);
      var odessaAmount = odessaBase;
      if (vehicleType === "suv") odessaAmount = odessaBase * 2;
      else if (vehicleType === "crossover") odessaAmount = odessaBase + 100;
      if (isElectricOrHybrid && !params.noElectricSeaSurcharge) {
        odessaAmount += 150;
      }
      return { amount: odessaAmount, available: true, portLabel: departurePort };
    }

    var base =
      typeof params.seaKlaipedaUsd === "number"
        ? params.seaKlaipedaUsd
        : SEA_FREIGHT_KLAIPEDA[departurePort] || 850;
    var amount = base;

    if (vehicleType === "suv") {
      amount = base * 2;
    } else if (vehicleType === "crossover") {
      amount = base + 100;
    }

    if (isElectricOrHybrid && !params.noElectricSeaSurcharge) {
      amount += 150;
    }

    return { amount: amount, available: true, portLabel: departurePort };
  }

  /**
   * Повний розрахунок за точними формулами калькулятора Любе Авто.
   */
  function calculateAuctionImport(input) {
    var p = input || {};
    var arrivalPort =
      p.arrivalPort === ""
        ? ""
        : p.arrivalPort === "odessa"
        ? "odessa"
        : "klaipeda";

    var vehicleKey =
      p.vehicleType === ""
        ? ""
        : VEHICLE_TYPES[p.vehicleType]
        ? p.vehicleType
        : "passenger";
    var vehicle = vehicleKey
      ? VEHICLE_TYPES[vehicleKey]
      : { id: "", label: "", usaMultiplier: 1.0, klaipedaLviv: 0 };

    var fuelType =
      p.fuelType === ""
        ? ""
        : ["petrol", "diesel", "electric", "hybrid"].indexOf(p.fuelType) !== -1
        ? p.fuelType
        : "petrol";

    var auctionKey =
      p.auction === ""
        ? ""
        : AUCTIONS[p.auction]
        ? p.auction
        : "copart";
    var auction = auctionKey
      ? AUCTIONS[auctionKey]
      : { id: "", label: "", isCanada: false, docsMode: "states", wireRate: 0.01, nonVatFee: 0 };

    var lotPrice = clampNumber(p.price, 0, 10000000, 0);
    var auctionFee = auctionKey ? getAuctionFee(auctionKey, lotPrice) : 0;

    var hasLocation = p.locationSelected !== false;
    var baseUsaDelivery = hasLocation ? clampNumber(p.baseUsaDeliveryUsd, 0, 50000, 245) : 0;
    var deliveryUsa = hasLocation ? Math.round(baseUsaDelivery * vehicle.usaMultiplier) : 0;

    var exportDocs = 0;
    if (auctionKey) {
      if (auction.docsMode !== "states") {
        exportDocs = getExportDocsFee(auctionKey, "open");
      } else if (p.docsState === "open" || p.docsState === "closed") {
        exportDocs = getExportDocsFee(auctionKey, p.docsState);
      } else if (p.docsState === undefined) {
        exportDocs = getExportDocsFee(auctionKey, "open");
      }
    } else if (p.docsState === "open" || p.docsState === "closed") {
      exportDocs = p.docsState === "closed" ? 200 : 150;
    }

    var departurePort = hasLocation
      ? arrivalPort === "odessa" && p.portOdessa
        ? p.portOdessa
        : p.portKlaipeda || "New York, NY"
      : "";

    var seaInfo =
      hasLocation && arrivalPort
        ? getSeaFreight({
            arrivalPort: arrivalPort,
            departurePort: departurePort,
            fuelType: fuelType || "petrol",
            vehicleType: vehicleKey || "passenger",
            odessaSupported: p.odessaSupported !== false,
            seaKlaipedaUsd: p.seaKlaipedaUsd,
            seaOdessaUsd: p.seaOdessaUsd,
            noElectricSeaSurcharge: Boolean(p.noElectricSeaSurcharge)
          })
        : { amount: 0, available: true, portLabel: departurePort };

    var seaFreight = seaInfo.available ? seaInfo.amount : 0;

    // Портові та європейські збори активуються після вибору порту прибуття
    var unloadKlaipeda = arrivalPort === "klaipeda" ? 400 : 0;
    var klaipedaLviv = arrivalPort === "klaipeda" ? vehicle.klaipedaLviv : 0;
    var deliveryToCustoms = arrivalPort === "klaipeda" ? 80 : 0;
    var odessaUnloadBroker = arrivalPort === "odessa" ? 670 : 0;
    var brokerFee = arrivalPort === "klaipeda" ? 250 : 0;

    var borderSpecialFee = arrivalPort ? 110 : 0;
    var nonVatFee = auction.nonVatFee;
    var lubeCommission = arrivalPort ? 600 : 0;

    // Точні формули митних платежів Любе Авто
    var eurToUsd = clampNumber(p.eurToUsd, 0.5, 2.5, EUR_TO_USD);
    var usdToUah = clampNumber(p.usdToUah, 10, 200, DEFAULT_USD_TO_UAH);
    var referenceYear = clampNumber(p.referenceYear, 2020, 2100, 2026);

    var canCalcCustoms = lotPrice > 0 && fuelType !== "";
    var customsValue = canCalcCustoms ? (lotPrice + auctionFee + 1600) * 1.01 : 0;
    var importDutyExact = !canCalcCustoms || fuelType === "electric" ? 0 : customsValue * 0.10;
    var importDuty = Math.round(importDutyExact);

    var hasYear = p.year !== "" && p.year !== null && p.year !== undefined;
    var ageCoeff = hasYear ? getAgeFactor(p.year, referenceYear) : 0;
    var hasEngineLiters = Number(p.engineLiters) > 0;
    var engineLiters = hasEngineLiters ? clampNumber(p.engineLiters, 0.1, 10, 2) : 0;
    var hasMotoCc = Number(p.motoCc) > 0;
    var motoCc = hasMotoCc ? clampNumber(p.motoCc, 50, 3000, 600) : 0;
    var hasBattery = Number(p.batteryKwh) > 0;
    var batteryKwh = hasBattery ? clampNumber(p.batteryKwh, 10, 250, 64) : 0;

    var exciseExact = 0;
    if (fuelType === "electric" && hasBattery) {
      exciseExact = batteryKwh * 1 * eurToUsd;
    } else if (fuelType && vehicleKey === "moto" && hasMotoCc) {
      var motoRate = motoCc <= 500 ? 0.062 : motoCc <= 800 ? 0.443 : 0.447;
      exciseExact = motoRate * motoCc * eurToUsd;
    } else if (fuelType === "diesel" && hasYear && hasEngineLiters) {
      var dieselRate = engineLiters <= 3.5 ? 75 : 150;
      exciseExact = dieselRate * engineLiters * ageCoeff * eurToUsd;
    } else if ((fuelType === "petrol" || fuelType === "hybrid") && hasYear && hasEngineLiters) {
      var petrolRate = engineLiters <= 3.0 ? 50 : 100;
      exciseExact = petrolRate * engineLiters * ageCoeff * eurToUsd;
    }

    var excise = Math.round(exciseExact);
    var vatExact = !canCalcCustoms
      ? 0
      : fuelType === "electric"
      ? customsValue * 0.20
      : (customsValue + importDutyExact + exciseExact) * 0.20;
    var vat = Math.round(vatExact);

    var feeBasis = lotPrice + auctionFee;
    var insuranceExact = feeBasis > 0 ? feeBasis * 0.01 : 0;
    var insuranceBase = Math.round(insuranceExact);
    var insuranceFee = p.insuranceEnabled !== false ? insuranceBase : 0;
    var insuranceRaw = p.insuranceEnabled !== false ? insuranceExact : 0;

    var wireExact = feeBasis > 0 ? feeBasis * auction.wireRate : 0;
    var wireBase = Math.round(wireExact);
    var wireTransferFee = p.wireEnabled ? wireBase : 0;
    var wireRaw = p.wireEnabled ? wireExact : 0;

    var totalUsd = Math.round(
      lotPrice +
      auctionFee +
      deliveryUsa +
      exportDocs +
      seaFreight +
      unloadKlaipeda +
      klaipedaLviv +
      deliveryToCustoms +
      odessaUnloadBroker +
      borderSpecialFee +
      exciseExact +
      importDutyExact +
      vatExact +
      brokerFee +
      nonVatFee +
      lubeCommission +
      insuranceRaw +
      wireRaw
    );

    return {
      arrivalPort: arrivalPort,
      vehicleType: vehicleKey,
      vehicleLabel: vehicle.label,
      fuelType: fuelType,
      auction: auctionKey,
      auctionLabel: auction.label,
      isCanada: auction.isCanada,
      docsMode: auction.docsMode,
      ageCoeff: ageCoeff,
      lotPrice: lotPrice,
      auctionFee: auctionFee,
      deliveryUsa: deliveryUsa,
      exportDocs: exportDocs,
      departurePort: departurePort,
      seaAvailable: seaInfo.available,
      seaFreight: seaFreight,
      unloadKlaipeda: unloadKlaipeda,
      klaipedaLviv: klaipedaLviv,
      deliveryToCustoms: deliveryToCustoms,
      odessaUnloadBroker: odessaUnloadBroker,
      borderSpecialFee: borderSpecialFee,
      customsValue: customsValue,
      excise: excise,
      importDuty: importDuty,
      vat: vat,
      brokerFee: brokerFee,
      nonVatFee: nonVatFee,
      lubeCommission: lubeCommission,
      insuranceBase: insuranceBase,
      insuranceFee: insuranceFee,
      wireBase: wireBase,
      wireRate: auction.wireRate,
      wireTransferFee: wireTransferFee,
      totalUsd: totalUsd,
      totalUah: Math.round(totalUsd * usdToUah),
      isCommercialWarning: vehicleKey === "van"
    };
  }

  return {
    EUR_TO_USD: EUR_TO_USD,
    AUCTIONS: AUCTIONS,
    VEHICLE_TYPES: VEHICLE_TYPES,
    getAuctionFee: getAuctionFee,
    getAgeFactor: getAgeFactor,
    getExportDocsFee: getExportDocsFee,
    calculateAuctionImport: calculateAuctionImport
  };
});
