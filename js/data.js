/**
 * Конфігурація сайту та база автомобілів майданчика «Любе Авто Мостиська».
 * Щоб змінити контакти, курс валют або додати нове авто — редагуйте цей файл.
 * Повний список локацій аукціонів (534 майданчики) зберігається у файлі js/locations.js.
 */
window.LUBE_AVTO_CONFIG = {
  companyName: "Любе Авто Мостиська",
  city: "м. Мостиська, Львівська обл.",
  addressNote: "Майданчик біля кордону (детальну локацію уточнюйте телефоном)",
  workHours: "Пн–Сб: 09:00 – 19:00, Нд: за домовленістю",

  // Вкажіть реальний номер телефону (у міжнародному форматі для дзвінка) та Telegram
  phoneDisplay: "+38 (067) 000-00-00",
  phoneHref: "tel:+380670000000",
  telegramUsername: "lubeavto_mostyska",
  telegramUrl: "https://t.me/lubeavto_mostyska",

  // Курси валют (курс EUR/USD = 1.11044 відповідає розрахункам калькулятора Любе Авто)
  rates: {
    usdToUah: 41.5,
    eurToUsd: 1.11044
  },

  // Пароль для локального тестування кабінету менеджера admin.html (якщо Supabase не підключено)
  adminLocalPassword: "lubeavto2026",

  // Опційне підключення безкоштовної бази Supabase (заповніть після створення проєкту на supabase.com)
  supabase: {
    url: "",
    anonKey: "",
    bucket: "car-photos"
  }
};

/**
 * Автомобілі в наявності на майданчику.
 * Для додавання нового авто скопіюйте один об'єкт у масив нижче та покладіть фото в assets/img/.
 */
window.CARS_DATA = [
  {
    id: "audi-a3-2014",
    brand: "Audi",
    model: "A3",
    title: "Audi A3",
    year: 2014,
    mileageThousandKm: 136,
    mileageText: "136 тис. км",
    priceUsd: 11999,
    fuel: "Дизель",
    fuelType: "diesel",
    engineCc: 1968,
    engineLabel: "2.0 TDI",
    transmission: "Автомат (S-tronic)",
    drive: "Передній",
    bodyType: "Седан",
    vehicleType: "passenger",
    color: "Сірий металік",
    status: "В наявності",
    image: "assets/img/car-audi-a3.png",
    images: ["assets/img/car-audi-a3.png"],
    description:
      "Динамічний та економічний седан бізнес-класу на майданчику у Мостиськах. Охайний салон, перевірений пробіг, повністю готовий до огляду та тест-драйву."
  },
  {
    id: "mercedes-benz-gle-2015",
    brand: "Mercedes-Benz",
    model: "GLE",
    title: "MERCEDES-BENZ GLE",
    year: 2015,
    mileageThousandKm: 198,
    mileageText: "198 тис. км",
    priceUsd: 26900,
    fuel: "Дизель",
    fuelType: "diesel",
    engineCc: 2987,
    engineLabel: "3.0 CDI",
    transmission: "Автомат",
    drive: "Повний (4MATIC)",
    bodyType: "Кросовер",
    vehicleType: "suv",
    color: "Білий",
    status: "В наявності",
    image: "assets/img/car-mercedes-gle.png",
    images: ["assets/img/car-mercedes-gle.png"],
    description:
      "Преміальний повнопривідний позашляховик у білому кольорі. Комфортна підвіска, багата комплектація та впевнений тяговитий дизельний двигун."
  },
  {
    id: "peugeot-3008-2014",
    brand: "Peugeot",
    model: "3008",
    title: "Peugeot 3008",
    year: 2014,
    mileageThousandKm: 176,
    mileageText: "176 тис. км",
    priceUsd: 9700,
    fuel: "Дизель",
    fuelType: "diesel",
    engineCc: 1560,
    engineLabel: "1.6 HDi",
    transmission: "Механіка / Робот",
    drive: "Передній",
    bodyType: "Кросовер / Мінівен",
    vehicleType: "crossover",
    color: "Білий",
    status: "В наявності",
    image: "assets/img/car-peugeot-3008.png",
    images: ["assets/img/car-peugeot-3008.png"],
    description:
      "Практичний та дуже економічний сімейний кросовер з просторим салоном і великим багажником. Ідеальний баланс ціни, комфорту та витрати палива."
  }
];
