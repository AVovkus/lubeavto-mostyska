/**
 * Початковий довідник марок і моделей авто для кабінету менеджера
 * (синхронізовано з фільтрами https://lubeavto.com.ua/store/instore).
 * Нові марки й моделі можна також додавати прямо в інтерфейсі кабінету менеджера.
 */
(function (root) {
  "use strict";

  root.LUBE_AVTO_VEHICLE_CATALOG = {
    "Acura": ["RDX", "ZDX"],
    "Alfa Romeo": ["Stelvio"],
    "Aprilia": ["RS"],
    "Audi": [
      "80", "A3", "A3 Sportback", "A4", "A4 Allroad", "A5", "A5 Sportback",
      "A6", "A6 Allroad", "A7 Sportback", "A8", "e-tron", "e-tron GT",
      "e-tron S", "e-tron Sportback", "Q3", "Q5", "Q5 Sportback", "Q7", "Q8",
      "RS Q8", "S3", "S4", "S5", "S8", "SQ5", "SQ7", "SQ8", "TT",
      "Q6 e-tron", "Q8 e-tron", "Q8 Sportback e-tron"
    ],
    "Bentley": ["Bentayga"],
    "BMW": [
      "iX1", "228", "3 Series", "3 Series GT", "316", "320", "328", "330",
      "335", "340", "4 Series", "4 Series Gran Coupe", "430", "5 Series",
      "5 Series GT", "520", "528", "530", "6 Series GT", "640", "7 Series",
      "730", "740", "8 Series Gran Coupe", "I3", "i4", "i7", "iX", "M5", "M8",
      "M8 Gran Coupe", "X1", "X2", "X3", "X3 M", "X4", "X5", "X5 M", "X6", "X7"
    ],
    "Buick": ["Encore", "Encore GX", "Regal", "Envista"],
    "BYD": ["Song Plus", "Sea Lion 06"],
    "Cadillac": ["CT6", "XT5", "XT6"],
    "Chery": ["Tiggo 4"],
    "Chevrolet": [
      "Aveo", "Blazer", "Bolt EUV", "Bolt EV", "Captiva", "Corvette",
      "Equinox", "Malibu", "Tahoe", "Trax", "Volt"
    ],
    "Chrysler": ["200", "Pacifica"],
    "Citroen": [
      "C-Crosser", "C3", "C4 Picasso", "C4 SpaceTourer", "C5",
      "C5 Aircross", "DS4", "Jumper", "e-Jumpy", "е-Dispatch"
    ],
    "Daewoo": ["Sens"],
    "DAF": ["46"],
    "Dodge": ["Challenger", "Charger", "Durango", "Journey", "Hornet"],
    "DS": ["7 Crossback"],
    "Ducati": ["Monster 1200"],
    "Fiat": ["500e", "500L", "Doblo", "Qubo", "Sedici", "Talento пасс.", "Tipo"],
    "Ford": [
      "Bronco", "Bronco Sport", "C-Max", "EcoSport", "Edge", "Escape",
      "Explorer", "F-150", "Fiesta", "Focus", "Fusion", "KA", "Kuga",
      "Maverick", "Mondeo", "Mustang Mach-E", "Tourneo Custom", "Transit",
      "Transit Connect"
    ],
    "Geely": ["Geometry A", "Maple", "MK"],
    "Harley-Davidson": ["Fat Bob"],
    "Honda": ["Accord", "Civic", "Clarity", "CR-V", "Insight", "M-NV", "Pilot", "NC 750"],
    "Hyundai": [
      "Elantra", "i30", "Ioniq", "Ioniq 5", "ix35", "Kona", "Kona Electric",
      "Palisade", "Santa FE", "Sonata", "Tucson", "Venue", "Ioniq 6"
    ],
    "Indian": ["Chieftain"],
    "Infiniti": ["Q50", "Q60", "QX30", "QX50", "QX55", "QX60", "QX80"],
    "Jaguar": ["E-Pace", "F-Pace", "I-Pace", "XE", "XF"],
    "Jeep": ["Cherokee", "Compass", "Grand Cherokee", "Patriot", "Renegade", "Wrangler"],
    "Kia": [
      "EV6", "K5", "Niro", "Optima", "Seltos", "Sorento", "Soul",
      "Sportage", "Stinger", "EV5", "EV9", "Soul EV"
    ],
    "KTM": ["1290 Super Adventure"],
    "Land Rover": [
      "Defender", "Discovery", "Discovery Sport", "Range Rover",
      "Range Rover Evoque", "Range Rover Sport", "Range Rover Velar"
    ],
    "Lexus": ["ES", "GS", "IS", "LS", "LX", "NX", "RX", "RZ", "UX", "TX"],
    "Lincoln": ["Corsair", "MKC", "MKZ", "Nautilus", "Navigator"],
    "Lucid": ["Air"],
    "Maserati": ["Quattroporte"],
    "Maxus": ["e-Deliver 3"],
    "Mazda": ["3", "323", "5", "6", "CX-3", "CX-30", "CX-5", "CX-50", "CX-7", "CX-9", "MX-30", "CX-90"],
    "McLaren": ["720S"],
    "Mercedes-Benz": [
      "A 200", "A 210", "A 220", "A-Class", "B 200", "B-Class",
      "C 180", "C 200", "C 220", "C 300", "C 350", "C 43 AMG", "C-Class",
      "Citan пас.", "CLA 250", "CLA-Class", "CLS 220", "CLS 250", "CLS 320",
      "CLS-Class", "E 220", "E 250", "E 300", "E 43 AMG", "E-Class", "EQB",
      "GL 350", "GL-Class", "GLA-Class", "GLB-Class", "GLC 220", "GLC 300",
      "GLC-Class", "GLE 250", "GLE 350", "GLE 43 AMG", "GLE 500", "GLE-Class",
      "GLK 250", "GLS", "GLS 350", "M-Class", "Maybach GLS 600", "ML 250",
      "ML 350", "S 450", "S 500", "S 550", "S-Class", "Sprinter",
      "Sprinter 419 пасс.", "V 220", "V-Class", "Vito", "Vito 110",
      "EQE SUV", "GLE-Class Coupe"
    ],
    "Mini": ["Clubman", "Countryman"],
    "Mitsubishi": [
      "ASX", "Eclipse Cross", "Grandis", "Mirage", "Outlander",
      "Outlander PHEV", "Outlander Sport", "Outlander XL", "Pajero Wagon", "RVR"
    ],
    "Nissan": [
      "Ariya", "Juke", "Kicks", "Leaf", "Maxima", "Micra", "Murano",
      "Note", "Pathfinder", "Qashqai", "Qashqai+2", "Rogue", "Rogue Sport",
      "Sentra", "TIIDA", "X-Trail"
    ],
    "Opel": [
      "Antara", "Astra", "Astra GTC", "Astra J", "Astra Sports Tourer",
      "Corsa", "Insignia", "Insignia Sports Tourer", "Meriva", "Movano",
      "Tigra", "Vectra", "Vivaro", "Zafira"
    ],
    "Peugeot": ["107", "2008", "207 SW", "3008", "307", "308", "308 SW", "5008", "508", "807", "Boxer"],
    "Porsche": ["911", "Cayenne", "Macan", "Panamera", "Taycan", "Taycan Cross Turismo", "718 Boxster", "Macan Electric"],
    "Ram": ["1500", "Promaster City"],
    "Renault": [
      "Grand Scenic", "Kangoo", "Koleos", "Logan", "Master", "Megane",
      "Megane E-Tech Electric", "Megane Scenic", "Modus", "Scenic", "Trafic"
    ],
    "Samsung": ["QM5", "QM6"],
    "Seat": ["Altea XL", "Exeo", "Ibiza", "Leon"],
    "Skoda": ["Enyaq iV", "Fabia", "Karoq", "Kodiaq", "Octavia", "Octavia Scout", "Roomster", "Spaceback", "Superb"],
    "Subaru": ["Ascent", "Crosstrek", "Forester", "Impreza", "Legacy", "Outback", "WRX", "Solterra"],
    "Suzuki": ["Alto", "Boulevard"],
    "Tesla": ["Cybertruck", "Model 3", "Model S", "Model X", "Model Y"],
    "Toyota": [
      "Aqua", "Avensis", "C-HR", "Camry", "Corolla", "Corolla Cross",
      "Corolla Verso", "Crown", "Highlander", "Land Cruiser 200",
      "Land Cruiser Prado", "Land Cruiser Prado 150", "Land Cruiser Prado 95",
      "RAV4", "RAV4 EV", "Supra", "Venza", "Yaris"
    ],
    "Volkswagen": [
      "Arteon", "Atlas", "Atlas Cross Sport", "Beetle", "Caddy", "Crafter",
      "e-Golf", "Golf", "Golf GTI", "Golf Plus", "Golf R", "Golf Sportsvan",
      "Golf V", "Golf VIII", "GTI", "ID.4", "Jetta", "Lavida", "Passat",
      "Passat B6", "Passat B7", "Passat B8", "Passat CC", "Polo", "Scirocco",
      "T6.1 (Transporter) пасс.", "Taigun", "Taos", "Tiguan",
      "Tiguan Allspace", "Touareg", "Touran", "Transporter",
      "CC / Passat CC", "ID. UNYX", "Lavida XR"
    ],
    "Volvo": ["C40 Recharge", "S60", "S90", "V50", "XC40", "XC40 Recharge", "XC60", "XC60 Recharge", "XC90", "XC90 Recharge"],
    "Yamaha": ["Tricker"],
    "ZEEKR": ["X"],
    "ЗАЗ": ["Sens"]
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
