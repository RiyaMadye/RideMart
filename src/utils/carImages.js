// ============================================================
//  RideMart — Model-Specific Car Image Utility
//  Uses verified Unsplash photo IDs that are confirmed car images.
//  Each model maps to the most visually appropriate car type.
//  Usage: getCarImage(model, type) | getCarImages(model, type)
// ============================================================

// ----------------------------------------------------------------
// Verified Unsplash photo IDs — grouped by category
// These are high-quality car photos confirmed to load correctly
// ----------------------------------------------------------------
const P = {
  // Large SUVs / 4x4
  suv_large_1: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=800&q=80', // offroad SUV
  suv_large_2: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80', // black large SUV night
  suv_large_3: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=800&q=80', // white SUV side
  suv_large_4: 'https://images.unsplash.com/photo-1553440569-bcc63803a83d?auto=format&fit=crop&w=800&q=80', // dark SUV road

  // Compact SUVs / Crossovers
  suv_compact_1: 'https://images.unsplash.com/photo-1532974297617-c0f05fe48bff?auto=format&fit=crop&w=800&q=80', // modern compact SUV
  suv_compact_2: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&w=800&q=80', // red compact SUV forest
  suv_compact_3: 'https://images.unsplash.com/photo-1571127236794-81c16cd49a18?auto=format&fit=crop&w=800&q=80', // silver SUV road
  suv_compact_4: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80', // modern SUV white

  // 4x4 / Off-road
  offroad_1: 'https://images.unsplash.com/photo-1605559424843-9073c6223283?auto=format&fit=crop&w=800&q=80', // 4x4 dirt
  offroad_2: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80', // offroad adventure

  // Sedans
  sedan_1: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=800&q=80', // classic white sedan
  sedan_2: 'https://images.unsplash.com/photo-1526726538690-5cbf956ae2fd?auto=format&fit=crop&w=800&q=80', // silver sedan profile
  sedan_3: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80', // blue sedan showroom
  sedan_4: 'https://images.unsplash.com/photo-1580274455191-1c62238fa333?auto=format&fit=crop&w=800&q=80', // modern white sedan
  sedan_5: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=800&q=80', // dark grey sedan

  // Hatchbacks
  hatch_1: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80', // orange/yellow sporty hatch
  hatch_2: 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?auto=format&fit=crop&w=800&q=80', // white compact hatch
  hatch_3: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=800&q=80', // blue modern hatch
  hatch_4: 'https://images.unsplash.com/photo-1546614042-7df3c24c9e5d?auto=format&fit=crop&w=800&q=80', // red hatchback city

  // MPVs / Vans
  mpv_1: 'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?auto=format&fit=crop&w=800&q=80', // large silver van
  mpv_2: 'https://images.unsplash.com/photo-1489824904134-891ab64532f1?auto=format&fit=crop&w=800&q=80', // white MPV mountains

  // Electric
  electric_1: 'https://images.unsplash.com/photo-1527618092681-e1b1ad737fb2?auto=format&fit=crop&w=800&q=80', // EV charging
  electric_2: 'https://images.unsplash.com/photo-1610647752706-3bb12232b3ab?auto=format&fit=crop&w=800&q=80', // white EV road

  // Premium / Euro
  premium_1: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=800&q=80', // premium sedan
  premium_2: 'https://images.unsplash.com/photo-1580274455191-1c62238fa333?auto=format&fit=crop&w=800&q=80', // premium white car
};

// Model-Specific Image Map
// Each entry: [primary_url, secondary_url]
// Grouped by brand for readability
export const CAR_IMAGE_MAP = {
  // ─── Maruti Suzuki ───────────────────────────────────────
  'Swift': [P.hatch_1, P.hatch_3],
  'Baleno': [P.hatch_3, P.hatch_2],
  'Dzire': [P.sedan_4, P.sedan_5],
  'Alto': [P.hatch_2, P.hatch_4],
  'Wagon R': [P.hatch_2, P.hatch_1],
  'Vitara Brezza': [P.suv_compact_1, P.suv_compact_2],

  // ─── Hyundai ─────────────────────────────────────────────
  'Creta': [P.suv_compact_3, P.suv_compact_4],
  'i20': [P.hatch_3, P.hatch_4],
  'Venue': [P.suv_compact_1, P.suv_compact_3],
  'Verna': [P.sedan_2, P.sedan_1],
  'Tucson': [P.suv_large_3, P.suv_large_4],

  // ─── Tata ────────────────────────────────────────────────
  'Nexon': [P.suv_compact_2, P.suv_compact_1],
  'Altroz': [P.hatch_4, P.hatch_2],
  'Harrier': [P.suv_large_4, P.suv_large_2],
  'Safari': [P.suv_large_1, P.suv_large_2],
  'Punch': [P.suv_compact_4, P.suv_compact_1],

  // ─── Mahindra ─────────────────────────────────────────────
  'XUV700': [P.suv_large_2, P.suv_large_3],
  'XUV300': [P.suv_compact_2, P.suv_compact_4],
  'Scorpio-N': [P.suv_large_4, P.suv_large_1],
  'Thar': [P.offroad_1, P.offroad_2],
  'Bolero': [P.suv_large_1, P.suv_large_4],

  // ─── Honda ───────────────────────────────────────────────
  'City': [P.sedan_4, P.sedan_2],
  'Amaze': [P.sedan_3, P.sedan_5],
  'WR-V': [P.suv_compact_1, P.suv_compact_3],
  'Jazz': [P.hatch_1, P.hatch_3],

  // ─── Toyota ──────────────────────────────────────────────
  'Innova Crysta': [P.mpv_1, P.mpv_2],
  'Fortuner': [P.suv_large_2, P.suv_large_3],
  'Glanza': [P.hatch_2, P.hatch_1],
  'Urban Cruiser': [P.suv_compact_3, P.suv_compact_2],

  // ─── Kia ─────────────────────────────────────────────────
  'Seltos': [P.suv_compact_3, P.suv_compact_4],
  'Sonet': [P.suv_compact_1, P.suv_compact_2],
  'Carnival': [P.mpv_2, P.mpv_1],
  'Carens': [P.mpv_1, P.suv_compact_3],

  // ─── MG ──────────────────────────────────────────────────
  'Hector': [P.suv_compact_4, P.suv_compact_3],
  'Astor': [P.suv_compact_3, P.suv_large_3],
  'ZS EV': [P.electric_1, P.electric_2],

  // ─── Skoda ───────────────────────────────────────────────
  'Kushaq': [P.suv_compact_2, P.suv_compact_1],
  'Slavia': [P.sedan_5, P.sedan_4],
  'Octavia': [P.premium_1, P.premium_2],

  // ─── Volkswagen ──────────────────────────────────────────
  'Taigun': [P.suv_compact_4, P.suv_compact_2],
  'Virtus': [P.sedan_4, P.sedan_2],

  // ─── Renault ─────────────────────────────────────────────
  'Kwid': [P.hatch_4, P.hatch_2],
  'Kiger': [P.suv_compact_2, P.suv_compact_3],
  'Duster': [P.suv_large_4, P.suv_compact_1],
};


// Body-type fallback pools (used if model is not in map above)
export const TYPE_IMAGE_POOLS = {
  SUV: [
    'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1553440569-bcc63803a83d?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80',
  ],
  Sedan: [
    'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1526726538690-5cbf956ae2fd?auto=format&fit=crop&w=800&q=80',
  ],
  Hatchback: [
    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1609521263047-f8f205293f24?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=800&q=80',
  ],
  MPV: [
    'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1489824904134-891ab64532f1?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?auto=format&fit=crop&w=800&q=80',
  ],
};

// Single-image type fallback (for quick lookups)
const TYPE_FALLBACKS = {
  SUV:       TYPE_IMAGE_POOLS.SUV[0],
  Sedan:     TYPE_IMAGE_POOLS.Sedan[0],
  Hatchback: TYPE_IMAGE_POOLS.Hatchback[0],
  MPV:       TYPE_IMAGE_POOLS.MPV[0],
  Pickup:    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80',
  Coupe:     'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80',
};

/**
 * Returns the primary image URL for a car model.
 * Falls back to body-type default, then to a generic car image.
 *
 * @param {string} model  – Car model name e.g. 'Creta'
 * @param {string} type   – Body type e.g. 'SUV', 'Sedan', 'Hatchback'
 * @returns {string}       – A working Unsplash CDN image URL
 */
export function getCarImage(model, type) {
  if (model && CAR_IMAGE_MAP[model]) {
    return CAR_IMAGE_MAP[model][0];
  }
  if (type && TYPE_FALLBACKS[type]) {
    return TYPE_FALLBACKS[type];
  }
  // Ultimate fallback — generic premium car
  return 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80';
}

/**
 * Returns [primary, secondary] image URLs for a car model.
 * Used by seedData and AdminPanel batch-fix.
 *
 * @param {string} model  – Car model name
 * @param {string} type   – Body type
 * @returns {string[]}     – Array of 2 image URLs
 */
export function getCarImages(model, type) {
  if (model && CAR_IMAGE_MAP[model]) {
    return CAR_IMAGE_MAP[model];
  }
  const fallback = TYPE_FALLBACKS[type] || TYPE_FALLBACKS.SUV;
  return [fallback, fallback];
}
