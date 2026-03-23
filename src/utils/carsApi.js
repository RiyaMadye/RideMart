// ============================================================
//  Cars By API-Ninjas — via RapidAPI
//  Endpoint: https://cars-by-api-ninjas.p.rapidapi.com/v1/cars
//  Key stored in: REACT_APP_RAPIDAPI_KEY
//  Host stored in: REACT_APP_RAPIDAPI_HOST
// ============================================================

const RAPIDAPI_KEY  = process.env.REACT_APP_RAPIDAPI_KEY;
const RAPIDAPI_HOST = process.env.REACT_APP_RAPIDAPI_HOST || 'cars-by-api-ninjas.p.rapidapi.com';
const BASE_URL      = `https://${RAPIDAPI_HOST}/v1/cars`;

/**
 * Search the Cars By API-Ninjas database (via RapidAPI).
 *
 * @param {Object} params
 *   make       {string}  e.g. 'Maruti'
 *   model      {string}  e.g. 'Swift'
 *   year       {number}  e.g. 2022
 *   fuel_type  {string}  'gasoline' | 'diesel' | 'electricity'
 *   limit      {number}  1–50 (default 1)
 *
 * API response fields:
 *   make, model, year, transmission ('m'/'a'),
 *   fuel_type, cylinders, displacement (litres),
 *   city_mpg, highway_mpg, combination_mpg,
 *   drive ('fwd'/'rwd'/'4wd'/'awd'), class
 */
export async function searchCarsAPI(params = {}) {
  if (!RAPIDAPI_KEY) {
    throw new Error(
      'RapidAPI key not set. Add REACT_APP_RAPIDAPI_KEY to your .env file.'
    );
  }

  const urlParams = new URLSearchParams();
  if (params.make)      urlParams.append('make',      params.make.toLowerCase());
  if (params.model)     urlParams.append('model',     params.model.toLowerCase());
  if (params.year)      urlParams.append('year',      String(params.year));
  if (params.fuel_type) urlParams.append('fuel_type', params.fuel_type.toLowerCase());
  urlParams.append('limit', String(params.limit || 3));

  const response = await fetch(`${BASE_URL}?${urlParams.toString()}`, {
    method: 'GET',
    headers: {
      'x-rapidapi-key':  RAPIDAPI_KEY,
      'x-rapidapi-host': RAPIDAPI_HOST,
      'Content-Type':    'application/json',
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`RapidAPI error ${response.status}: ${text}`);
  }

  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

/**
 * Transform a raw API-Ninjas spec object → RideMart form fields.
 */
export function mapApiSpecToFormFields(spec) {
  const transMap = {
    m: 'Manual', a: 'Automatic',
    manual: 'Manual', automatic: 'Automatic',
  };
  const fuelMap = {
    gasoline:    'Petrol',
    diesel:      'Diesel',
    electricity: 'Electric',
    hybrid:      'Hybrid',
    gas:         'CNG',
  };

  return {
    brand:        toTitleCase(spec.make   || ''),
    model:        toTitleCase(spec.model  || ''),
    year:         spec.year               || '',
    transmission: transMap[(spec.transmission || '').toLowerCase()] || 'Automatic',
    fuelType:     fuelMap[(spec.fuel_type   || '').toLowerCase()]   || 'Petrol',
    engineCC:     spec.displacement ? Math.round(spec.displacement * 1000) : '',
    cylinders:    spec.cylinders          || '',
    driveType:    (spec.drive || '').toUpperCase(),
    cityMPG:      spec.city_mpg           || '',
    highwayMPG:   spec.highway_mpg        || '',
    type:         mapBodyClass(spec.class),
  };
}

function toTitleCase(str) {
  return str.split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function mapBodyClass(cls) {
  if (!cls) return 'SUV';
  const c = cls.toLowerCase();
  if (c.includes('sedan'))                          return 'Sedan';
  if (c.includes('hatchback') || c.includes('hatch')) return 'Hatchback';
  if (c.includes('pickup'))                         return 'Pickup';
  if (c.includes('van') || c.includes('mpv') || c.includes('minivan')) return 'MPV';
  if (c.includes('coupe'))                          return 'Coupe';
  if (c.includes('convert'))                        return 'Convertible';
  return 'SUV';
}
