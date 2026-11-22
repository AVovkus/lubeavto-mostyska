/**
 * Конфігурація сайту та початковий кеш авто майданчика «Любе Авто Мостиська».
 * Актуальний список авто та фото/відео завантажується наживо з бази Supabase.
 * Повний список локацій аукціонів (534 майданчики) зберігається у файлі js/locations.js.
 */
window.LUBE_AVTO_CONFIG = {
  companyName: "Любе Авто Мостиська",
  city: "м. Мостиська, Львівська обл.",
  addressNote: "Майданчик біля кордону (детальну локацію уточнюйте телефоном)",
  workHours: "Пн–Сб: 09:00 – 19:00, Нд: за домовленістю",

  phoneDisplay: "+38 (067) 000-00-00",
  phoneHref: "tel:+380670000000",
  telegramUsername: "lubeavto_mostyska",
  telegramUrl: "https://t.me/lubeavto_mostyska",

  rates: {
    usdToUah: 41.5,
    eurToUsd: 1.11044
  },

  adminLocalPassword: "lubeavto2026",

  supabase: {
    url: "https://dcmzwmlsgweegikmteem.supabase.co",
    anonKey: "sb_publishable_3vPXVBKdvlDtUGiAYmwbEQ_D5-0pz7l",
    bucket: "car-photos"
  }
};

/**
 * Базовий каталог авто (початкове відображення до відповіді Supabase).
 */
window.CARS_DATA = [
  {
    id: "ford-c-max-plugin-hybrid-2014-mwroovzu",
    brand: "FORD",
    model: "C-MAX Plugin Hybrid",
    title: "FORD C-MAX Plugin Hybrid",
    year: 2014,
    mileageThousandKm: 196,
    mileageText: "196 тис. км",
    priceUsd: 11000,
    fuel: "Гібрид",
    fuelType: "hybrid",
    engineCc: 2000,
    engineLabel: "2.0 - Plugin Hybrid",
    transmission: "автомат",
    drive: "Передній",
    bodyType: "хетчбек",
    vehicleType: "passenger",
    color: "синій",
    status: "В наявності",
    image: "https://dcmzwmlsgweegikmteem.supabase.co/storage/v1/object/public/car-photos/1795345903673-zdpjf9.jpg",
    images: [
      "https://dcmzwmlsgweegikmteem.supabase.co/storage/v1/object/public/car-photos/1795345903673-zdpjf9.jpg",
      "https://dcmzwmlsgweegikmteem.supabase.co/storage/v1/object/public/car-photos/1795345903675-6rva71.jpg",
      "https://dcmzwmlsgweegikmteem.supabase.co/storage/v1/object/public/car-photos/1795345903677-64ng4f.jpg",
      "https://dcmzwmlsgweegikmteem.supabase.co/storage/v1/object/public/car-photos/1795345903679-lvi85t.jpg",
      "https://dcmzwmlsgweegikmteem.supabase.co/storage/v1/object/public/car-photos/1795345903681-ijp12x.jpg",
      "https://dcmzwmlsgweegikmteem.supabase.co/storage/v1/object/public/car-photos/1795345903682-qa89o9.jpg",
      "https://dcmzwmlsgweegikmteem.supabase.co/storage/v1/object/public/car-photos/1795345903684-nsclbl.jpg",
      "https://dcmzwmlsgweegikmteem.supabase.co/storage/v1/object/public/car-photos/1795345903685-rt0aiv.jpg",
      "https://dcmzwmlsgweegikmteem.supabase.co/storage/v1/object/public/car-photos/1795345903808-r5jzdl.mp4"
    ],
    description: ""
  },
  {
    id: "kia-sportage-2017-mwrokc0z",
    brand: "KIA",
    model: "SPORTAGE",
    title: "KIA SPORTAGE",
    year: 2017,
    mileageThousandKm: 201,
    mileageText: "201 тис. км",
    priceUsd: 16500,
    fuel: "Дизель",
    fuelType: "diesel",
    engineCc: 2000,
    engineLabel: "2.0",
    transmission: "автомат",
    drive: "Передній",
    bodyType: "Кросовер",
    vehicleType: "crossover",
    color: "чорний",
    status: "В наявності",
    image: "https://dcmzwmlsgweegikmteem.supabase.co/storage/v1/object/public/car-photos/1795345908093-d1jh87.jpg",
    images: [
      "https://dcmzwmlsgweegikmteem.supabase.co/storage/v1/object/public/car-photos/1795345908093-d1jh87.jpg",
      "https://dcmzwmlsgweegikmteem.supabase.co/storage/v1/object/public/car-photos/1795345908096-doi7fi.jpg",
      "https://dcmzwmlsgweegikmteem.supabase.co/storage/v1/object/public/car-photos/1795345908098-e36577.jpg",
      "https://dcmzwmlsgweegikmteem.supabase.co/storage/v1/object/public/car-photos/1795345908100-6p2x6p.jpg",
      "https://dcmzwmlsgweegikmteem.supabase.co/storage/v1/object/public/car-photos/1795345908103-2fpwtx.jpg",
      "https://dcmzwmlsgweegikmteem.supabase.co/storage/v1/object/public/car-photos/1795345908105-1yp0av.jpg",
      "https://dcmzwmlsgweegikmteem.supabase.co/storage/v1/object/public/car-photos/1795345908107-2k7tvt.jpg",
      "https://dcmzwmlsgweegikmteem.supabase.co/storage/v1/object/public/car-photos/1795345908109-5rek75.jpg",
      "https://dcmzwmlsgweegikmteem.supabase.co/storage/v1/object/public/car-photos/1795345908217-n9dait.mp4"
    ],
    description: ""
  },
  {
    id: "bmw-i4-2025-mwrl22n9",
    brand: "BMW",
    model: "I4",
    title: "BMW I4",
    year: 2025,
    mileageThousandKm: 12,
    mileageText: "12 тис. км",
    priceUsd: 42900,
    fuel: "Електро",
    fuelType: "electric",
    engineCc: null,
    engineLabel: "",
    transmission: "автомат",
    drive: "задній  привід",
    bodyType: "Седан",
    vehicleType: "passenger",
    color: "графітовий",
    status: "В наявності",
    image: "https://dcmzwmlsgweegikmteem.supabase.co/storage/v1/object/public/car-photos/1795345912009-mt4gud.jpg",
    images: [
      "https://dcmzwmlsgweegikmteem.supabase.co/storage/v1/object/public/car-photos/1795345912009-mt4gud.jpg",
      "https://dcmzwmlsgweegikmteem.supabase.co/storage/v1/object/public/car-photos/1795345912011-fy07xy.jpg",
      "https://dcmzwmlsgweegikmteem.supabase.co/storage/v1/object/public/car-photos/1795345912013-ysqslm.jpg",
      "https://dcmzwmlsgweegikmteem.supabase.co/storage/v1/object/public/car-photos/1795345912015-0b3dn7.jpg",
      "https://dcmzwmlsgweegikmteem.supabase.co/storage/v1/object/public/car-photos/1795345912017-vhb6sn.jpg",
      "https://dcmzwmlsgweegikmteem.supabase.co/storage/v1/object/public/car-photos/1795345912019-yye121.jpg",
      "https://dcmzwmlsgweegikmteem.supabase.co/storage/v1/object/public/car-photos/1795345912021-4wu1ac.jpg",
      "https://dcmzwmlsgweegikmteem.supabase.co/storage/v1/object/public/car-photos/1795345912022-pyl6xp.jpg",
      "https://dcmzwmlsgweegikmteem.supabase.co/storage/v1/object/public/car-photos/1795345912024-mt8x7j.jpg"
    ],
    description: "Стан нового авто\nТоп комплектація!!"
  },
  {
    id: "audi-a3-2014",
    brand: "Audi",
    model: "A3",
    title: "Audi A3",
    year: 2014,
    mileageThousandKm: 136,
    mileageText: "136 тис. км",
    priceUsd: 12000,
    fuel: "Дизель",
    fuelType: "diesel",
    engineCc: 1800,
    engineLabel: "1,8",
    transmission: "Автомат (S-tronic)",
    drive: "Передній",
    bodyType: "Седан",
    vehicleType: "passenger",
    color: "Сірий металік",
    status: "В наявності",
    image: "assets/img/car-audi-a3.png",
    images: [
      "assets/img/car-audi-a3.png",
      "https://dcmzwmlsgweegikmteem.supabase.co/storage/v1/object/public/car-photos/1795345912665-2l13ex.jpg",
      "https://dcmzwmlsgweegikmteem.supabase.co/storage/v1/object/public/car-photos/1795345912667-hmubel.jpg",
      "https://dcmzwmlsgweegikmteem.supabase.co/storage/v1/object/public/car-photos/1795345912668-bbndy5.jpg",
      "https://dcmzwmlsgweegikmteem.supabase.co/storage/v1/object/public/car-photos/1795345912670-0b6dp9.jpg",
      "https://dcmzwmlsgweegikmteem.supabase.co/storage/v1/object/public/car-photos/1795345912672-bfyfin.jpg",
      "https://dcmzwmlsgweegikmteem.supabase.co/storage/v1/object/public/car-photos/1795345912673-vjwix9.jpg",
      "https://dcmzwmlsgweegikmteem.supabase.co/storage/v1/object/public/car-photos/1795345912674-tb17ks.jpg",
      "https://dcmzwmlsgweegikmteem.supabase.co/storage/v1/object/public/car-photos/1795345912675-3qdapv.jpg",
      "https://dcmzwmlsgweegikmteem.supabase.co/storage/v1/object/public/car-photos/1795345912677-bq4xq7.jpg"
    ],
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
    images: [
      "assets/img/car-mercedes-gle.png",
      "https://dcmzwmlsgweegikmteem.supabase.co/storage/v1/object/public/car-photos/1795345913176-p11yhu.jpg",
      "https://dcmzwmlsgweegikmteem.supabase.co/storage/v1/object/public/car-photos/1795345913181-redeuf.jpg",
      "https://dcmzwmlsgweegikmteem.supabase.co/storage/v1/object/public/car-photos/1795345913183-3ypm8k.jpg",
      "https://dcmzwmlsgweegikmteem.supabase.co/storage/v1/object/public/car-photos/1795345913185-i9nvbz.jpg",
      "https://dcmzwmlsgweegikmteem.supabase.co/storage/v1/object/public/car-photos/1795345913187-8jpg69.jpg",
      "https://dcmzwmlsgweegikmteem.supabase.co/storage/v1/object/public/car-photos/1795345913188-ocx13d.jpg",
      "https://dcmzwmlsgweegikmteem.supabase.co/storage/v1/object/public/car-photos/1795345913190-lvq0j2.jpg",
      "https://dcmzwmlsgweegikmteem.supabase.co/storage/v1/object/public/car-photos/1795345913192-blglgm.jpg",
      "https://dcmzwmlsgweegikmteem.supabase.co/storage/v1/object/public/car-photos/1795345913323-408yj3.mp4"
    ],
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
    images: [
      "assets/img/car-peugeot-3008.png",
      "https://dcmzwmlsgweegikmteem.supabase.co/storage/v1/object/public/car-photos/1795345917311-37kedn.jpg",
      "https://dcmzwmlsgweegikmteem.supabase.co/storage/v1/object/public/car-photos/1795345917314-c3en05.jpg",
      "https://dcmzwmlsgweegikmteem.supabase.co/storage/v1/object/public/car-photos/1795345917318-ywpv0v.jpg",
      "https://dcmzwmlsgweegikmteem.supabase.co/storage/v1/object/public/car-photos/1795345917322-v1zw0y.jpg",
      "https://dcmzwmlsgweegikmteem.supabase.co/storage/v1/object/public/car-photos/1795345917323-x8i7so.jpg",
      "https://dcmzwmlsgweegikmteem.supabase.co/storage/v1/object/public/car-photos/1795345917325-5ky7kt.jpg",
      "https://dcmzwmlsgweegikmteem.supabase.co/storage/v1/object/public/car-photos/1795345917327-bfynpk.jpg",
      "https://dcmzwmlsgweegikmteem.supabase.co/storage/v1/object/public/car-photos/1795345917385-bgrvp7.mov"
    ],
    description:
      "Практичний та дуже економічний сімейний кросовер з просторим салоном і великим багажником. Ідеальний баланс ціни, комфорту та витрати палива."
  }
];
