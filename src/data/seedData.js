// ============================================================
//  RideMart — 100+ Indian Car Seed Dataset
//  Fields match the live Firebase schema used by CarCard,
//  CarDetails, BuyCars, RentCars and AdminPanel.
// ============================================================
import { getCarImages, TYPE_IMAGE_POOLS } from '../utils/carImages';

// Re-export TYPE_IMAGE_POOLS for AdminPanel compatibility
export { TYPE_IMAGE_POOLS };

const LOCATIONS = [
  'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad',
  'Pune', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Surat',
  'Lucknow', 'Kochi', 'Chandigarh', 'Indore', 'Nagpur'
];

const COLORS = [
  'Pearl White', 'Midnight Black', 'Fiery Red', 'Cobalt Blue',
  'Silver Grey', 'Champagne Gold', 'Forest Green', 'Sky Blue',
  'Burnt Orange', 'Burgundy'
];

const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;



// ------------- CAR DEFINITIONS --------------------------------
const CAR_DEFS = [
  ['Maruti', 'Swift', 'Hatchback', ['Petrol', 'CNG'], 2017, 2024, ['Touchscreen Infotainment', 'Rear Camera', 'Automatic Climate Control', 'Push Start/Stop']],
  ['Maruti', 'Baleno', 'Hatchback', ['Petrol', 'CNG'], 2018, 2024, ['Head-Up Display', 'Smart Connectivity', 'Auto AC', 'LED DRLs']],
  ['Maruti', 'Dzire', 'Sedan', ['Petrol', 'CNG'], 2017, 2024, ['Cruise Control', 'Rear Defogger', 'Leather Seats', 'Electric ORVM']],
  ['Maruti', 'Alto', 'Hatchback', ['Petrol', 'CNG'], 2015, 2023, ['Power Steering', 'AC', 'Central Locking']],
  ['Maruti', 'Wagon R', 'Hatchback', ['Petrol', 'CNG'], 2016, 2024, ['Smart Play Studio', 'Rear Camera', 'Digital Instrument Cluster']],
  ['Maruti', 'Vitara Brezza', 'SUV', ['Petrol'], 2019, 2024, ['Heads Up Display', 'Wireless Charging', 'Sunroof', '360 Camera']],
  ['Hyundai', 'Creta', 'SUV', ['Petrol', 'Diesel'], 2019, 2024, ['Panoramic Sunroof', 'BOSE Sound', 'Ventilated Seats', 'ADAS Level 2']],
  ['Hyundai', 'i20', 'Hatchback', ['Petrol', 'Diesel'], 2018, 2024, ['Bose Premium Sound', 'Air Purifier', 'BlueLink Connected', 'Turn-by-Turn Nav']],
  ['Hyundai', 'Venue', 'SUV', ['Petrol', 'Diesel', 'CNG'], 2019, 2024, ['iRA Connected Car', 'Sunroof', 'Rear AC Vents', 'Smart Key']],
  ['Hyundai', 'Verna', 'Sedan', ['Petrol', 'Diesel'], 2018, 2024, ['ADAS', 'Ventilated Seats', 'Electric Sunroof', 'Ambient Lighting']],
  ['Hyundai', 'Tucson', 'SUV', ['Petrol', 'Diesel'], 2020, 2024, ['Smart Sense ADAS', 'Fully Digital Cockpit', 'Panoramic Sunroof', 'Level 2 ADAS']],
  ['Tata', 'Nexon', 'SUV', ['Petrol', 'Diesel', 'Electric'], 2019, 2024, ['TPMS', 'Rain Sensing Wipers', 'Wireless Charging', '8.4" Touchscreen']],
  ['Tata', 'Altroz', 'Hatchback', ['Petrol', 'Diesel', 'CNG'], 2020, 2024, ['IRA Connected Tech', 'Air Purifier', 'Cooled Glove Box']],
  ['Tata', 'Harrier', 'SUV', ['Diesel'], 2019, 2024, ['Meridian Sound', 'Panoramic Sunroof', 'ADAS', 'iRA Connected Car']],
  ['Tata', 'Safari', 'SUV', ['Diesel'], 2021, 2024, ['6/7 Seater', 'Panoramic Sunroof', 'JBL Audio', 'ADAS Level 2']],
  ['Tata', 'Punch', 'SUV', ['Petrol', 'CNG', 'Electric'], 2021, 2024, ['Terrain Modes', 'iRA Connected Tech', 'Floating Driver Display']],
  ['Mahindra', 'XUV700', 'SUV', ['Petrol', 'Diesel'], 2021, 2024, ['ADAS', 'Panoramic Sunroof', '12in Touchscreen', 'Ventilated Seats', 'Head-Up Display']],
  ['Mahindra', 'XUV300', 'SUV', ['Petrol', 'Diesel'], 2019, 2024, ['Sunroof', 'Dual Zone AC', 'Wireless Charging', 'Active Safety Suite']],
  ['Mahindra', 'Scorpio-N', 'SUV', ['Petrol', 'Diesel'], 2022, 2024, ['4x4 AWD', 'Meridan Sound', 'Level 2 ADAS', 'Wireless Apple/Android']],
  ['Mahindra', 'Thar', 'SUV', ['Petrol', 'Diesel'], 2020, 2024, ['4x4 4WD', 'Convertible Soft-Top', 'Adventure Statistics', 'Crawl Control']],
  ['Mahindra', 'Bolero', 'SUV', ['Diesel'], 2016, 2023, ['Power Steering', 'Rear Parking Camera', 'Multi-Mode 4WD']],
  ['Honda', 'City', 'Sedan', ['Petrol', 'Hybrid'], 2018, 2024, ['Honda SENSING ADAS', 'LaneWatch', 'Wireless Charger', 'Ventilated Seats']],
  ['Honda', 'Amaze', 'Sedan', ['Petrol', 'Diesel'], 2018, 2024, ['DigiPad 2.0', 'Smart Key', 'Idle Stop/Start', 'Electric Sunroof']],
  ['Honda', 'WR-V', 'SUV', ['Petrol', 'Diesel'], 2017, 2023, ['Eco Assist', '7in Touchscreen', 'Lane Watch Camera', 'Waze Navigation']],
  ['Honda', 'Jazz', 'Hatchback', ['Petrol'], 2017, 2023, ['Magic Seats', 'Touchscreen', 'Cruise Control', 'Apple CarPlay']],
  ['Toyota', 'Innova Crysta', 'MPV', ['Petrol', 'Diesel'], 2016, 2024, ['Captain Seats', 'Rear AC Vents', 'JBL Audio', 'Cruise Control']],
  ['Toyota', 'Fortuner', 'SUV', ['Petrol', 'Diesel'], 2017, 2024, ['4x4 AWD', 'Premium Audio', 'Ventilated Seats', 'Toyota Safety Sense']],
  ['Toyota', 'Glanza', 'Hatchback', ['Petrol', 'CNG'], 2019, 2024, ['Heads Up Display', 'Smart Connect', 'Auto AC', 'LED DRLs']],
  ['Toyota', 'Urban Cruiser', 'SUV', ['Petrol'], 2020, 2023, ['Sunroof', '7in Touchscreen', 'Multi-Mode Drive']],
  ['Kia', 'Seltos', 'SUV', ['Petrol', 'Diesel'], 2019, 2024, ['Panoramic Sunroof', 'Bose Audio', 'Ventilated Seats', 'Connected Car Tech']],
  ['Kia', 'Sonet', 'SUV', ['Petrol', 'Diesel', 'CNG'], 2020, 2024, ['UVO Connect', 'BOSE Sound', 'Air Purifier', 'Wireless Charging']],
  ['Kia', 'Carnival', 'MPV', ['Diesel'], 2020, 2024, ['Bose Premium Sound', 'Captain Seats', 'Nappa Leather', 'Surround View Monitor']],
  ['Kia', 'Carens', 'MPV', ['Petrol', 'Diesel'], 2022, 2024, ['6/7 Seater', 'Panoramic Sunroof', 'ADAS', 'Connected Car Tech']],
  ['MG', 'Hector', 'SUV', ['Petrol', 'Diesel', 'Hybrid'], 2019, 2024, ['14in HD Touchscreen', 'ADAS', 'Panoramic Sunroof', 'Internet Inside']],
  ['MG', 'Astor', 'SUV', ['Petrol'], 2021, 2024, ['ADAS', 'AI Personal Assistant', 'Panoramic Sunroof', 'Connected Car Tech']],
  ['MG', 'ZS EV', 'SUV', ['Electric'], 2020, 2024, ['17.7in Display', 'ADAS', 'iSmart Connected', '461km Range']],
  ['Skoda', 'Kushaq', 'SUV', ['Petrol'], 2021, 2024, ['Wireless Charging', 'Ventilated Seats', 'Travel Assist ADAS', 'Virtual Cockpit']],
  ['Skoda', 'Slavia', 'Sedan', ['Petrol'], 2022, 2024, ['10in Touchscreen', 'Heated Seats', 'ADAS', 'Wireless CarPlay']],
  ['Skoda', 'Octavia', 'Sedan', ['Petrol'], 2020, 2023, ['Virtual Cockpit', 'Canton Audio', 'Panoramic Sunroof', 'Travel Assist']],
  ['Volkswagen', 'Taigun', 'SUV', ['Petrol'], 2021, 2024, ['Wireless Charging', 'Ventilated Front Seats', 'IQ Light LED', 'Travel Assist']],
  ['Volkswagen', 'Virtus', 'Sedan', ['Petrol'], 2022, 2024, ['10-Color Ambient Lighting', 'Wireless Charging', 'ADAS', 'Ventilated Seats']],
  ['Renault', 'Kwid', 'Hatchback', ['Petrol'], 2016, 2024, ['8in Touchscreen', 'Wireless CarPlay', 'Rear Camera', 'Digital Instrument Cluster']],
  ['Renault', 'Kiger', 'SUV', ['Petrol'], 2021, 2024, ['9.3in Touchscreen', 'Wireless Charging', 'Multi-Sense Drive Modes', '360 Camera']],
  ['Renault', 'Duster', 'SUV', ['Petrol', 'Diesel'], 2016, 2022, ['4WD Option', 'MediaNav', 'Rear Camera', 'Climate Control']],
];

const DESCRIPTIONS = {
  Hatchback: [
    'A fun, fuel-efficient city car perfect for daily commutes and weekend trips.',
    'Packed with features and great build quality. Ideal for urban driving.',
    'A reliable everyday hatchback with peppy performance and high ownership satisfaction.',
  ],
  Sedan: [
    'Delivers a premium ride with a spacious cabin, perfect for families and executives.',
    'An elegant sedan that blends comfort and performance with modern tech features.',
    'Smooth ride quality, frugal engine and modern safety tech — a complete package.',
  ],
  SUV: [
    'A commanding SUV with class-leading features and best-in-segment safety ratings.',
    'Built for adventure yet refined for city driving. Powerful engine and high clearance.',
    'Versatile and capable — handles urban roads and rough terrain with equal ease.',
  ],
  MPV: [
    'The ultimate family hauler with three rows of seating and impressive comfort features.',
    'Perfect for large families or corporate travel — unmatched space and fuel efficiency.',
  ],
};

const SALE_PRICES = {
  'Alto': [250000, 500000], 'Kwid': [400000, 600000],
  'Wagon R': [500000, 700000], 'Swift': [600000, 900000],
  'Baleno': [650000, 1000000], 'Dzire': [650000, 1000000],
  'Jazz': [700000, 900000], 'Amaze': [700000, 1050000],
  'WR-V': [750000, 1100000], 'Altroz': [700000, 1100000],
  'Punch': [600000, 1000000], 'Glanza': [650000, 1000000],
  'Kiger': [600000, 1000000], 'i20': [750000, 1150000],
  'Vitara Brezza': [800000, 1350000], 'Venue': [800000, 1400000],
  'XUV300': [850000, 1450000], 'Sonet': [800000, 1500000],
  'Nexon': [800000, 1600000], 'Bolero': [900000, 1200000],
  'Urban Cruiser': [900000, 1400000], 'Duster': [900000, 1400000],
  'Slavia': [1100000, 1850000], 'Virtus': [1200000, 1900000],
  'Kushaq': [1200000, 2000000], 'Taigun': [1200000, 2000000],
  'Astor': [1000000, 1800000], 'City': [1200000, 1950000],
  'Verna': [1100000, 2000000], 'Seltos': [1100000, 2000000],
  'Creta': [1100000, 2100000], 'Carens': [1100000, 2000000],
  'Harrier': [1500000, 2500000], 'Hector': [1400000, 2500000],
  'XUV700': [1400000, 2800000], 'Safari': [1600000, 2700000],
  'Scorpio-N': [1400000, 2400000], 'Octavia': [2600000, 3500000],
  'Thar': [1400000, 1900000], 'Innova Crysta': [1700000, 2700000],
  'Carnival': [3000000, 3700000], 'Fortuner': [3200000, 4500000],
  'ZS EV': [2200000, 2800000],
};

const DAILY_RATES = {
  'Alto': [1000, 1500], 'Kwid': [1000, 1500],
  'Wagon R': [1200, 1800], 'Swift': [1500, 2200],
  'Baleno': [1600, 2400], 'Dzire': [1600, 2400],
  'Jazz': [1800, 2600], 'Amaze': [1800, 2600],
  'Altroz': [1800, 2600], 'Glanza': [1500, 2200],
  'i20': [2000, 2800], 'Punch': [1800, 2600],
  'Sonet': [2200, 3200], 'Venue': [2200, 3200],
  'Vitara Brezza': [2200, 3200], 'Kiger': [1800, 2800],
  'Nexon': [2500, 3800], 'XUV300': [2500, 3800],
  'Seltos': [2800, 4000], 'Creta': [3000, 4500],
  'City': [2800, 4000], 'Verna': [2800, 4200],
  'Hector': [3200, 5000], 'Astor': [3000, 4800],
  'Harrier': [3500, 5500], 'XUV700': [4000, 6000],
  'Safari': [4000, 6000], 'Scorpio-N': [3500, 5000],
  'Thar': [3500, 5500], 'Innova Crysta': [4500, 7000],
  'Fortuner': [6000, 8000], 'Carnival': [6500, 8000],
  'ZS EV': [3500, 5500],
};

function priceInRange(model, isRent) {
  const table = isRent ? DAILY_RATES : SALE_PRICES;
  const range = table[model] || (isRent ? [1500, 3500] : [700000, 1500000]);
  return randInt(range[0], range[1]);
}

const SELLERS = [
  { name: 'Rahul Sharma', email: 'rahul.sharma@gmail.com', phone: '9876543210' },
  { name: 'Priya Patel', email: 'priya.patel@gmail.com', phone: '9823456789' },
  { name: 'Amit Joshi', email: 'amit.joshi@gmail.com', phone: '9812345678' },
  { name: 'Sneha Iyer', email: 'sneha.iyer@gmail.com', phone: '9898765432' },
  { name: 'Vikram Singh', email: 'vikram.singh@gmail.com', phone: '9756321456' },
  { name: 'Nidhi Mehta', email: 'nidhi.mehta@gmail.com', phone: '9765432109' },
  { name: 'Suresh Nair', email: 'suresh.nair@gmail.com', phone: '9845678901' },
  { name: 'Kavya Reddy', email: 'kavya.reddy@gmail.com', phone: '9800123456' },
  { name: 'Arjun Gupta', email: 'arjun.gupta@gmail.com', phone: '9878901234' },
  { name: 'Deepika Rao', email: 'deepika.rao@gmail.com', phone: '9911223344' },
  { name: 'RideMart Admin', email: 'admin@ridemart.com', phone: '1800123456' },
];

// ----------------------------------------------------------------
//  GENERATOR
// ----------------------------------------------------------------
export function generateSeedData() {
  const cars = [];
  let idx = 0;

  for (const [brand, model, type, fuelOptions, minYear, maxYear, features] of CAR_DEFS) {
    const count = model === 'XUV700' || model === 'Fortuner' || model === 'Carnival' ? 2 : randInt(2, 4);

    for (let i = 0; i < count; i++) {
      idx++;
      const isRent = i % 3 === 2;
      const year = randInt(minYear, maxYear);
      const fuel = rand(fuelOptions);
      const trans = fuel === 'Electric' ? 'Automatic' : (Math.random() > 0.4 ? 'Automatic' : 'Manual');
      const price = priceInRange(model, isRent);
      const kmDriven = isRent ? randInt(5000, 40000) : randInt(8000, 120000);
      const condition = kmDriven < 30000 ? 'Excellent' : kmDriven < 80000 ? 'Good' : 'Fair';
      const seller = rand(SELLERS);
      const location = rand(LOCATIONS);
      const color = rand(COLORS);
      const imgs = getCarImages(model, type);
      const desc = rand(DESCRIPTIONS[type] || DESCRIPTIONS.SUV);

      cars.push({
        brand, model, type, year, color,
        price: isRent ? null : price,
        dailyRate: isRent ? price : null,
        purpose: isRent ? 'rent' : 'sale',
        fuelType: fuel,
        transmission: trans,
        kmDriven,
        mileage: Math.round(kmDriven / 1.60934),
        condition,
        engineCC: fuel === 'Electric' ? null : randInt(800, 2500),
        description: desc,
        features: features.slice(0, randInt(2, features.length)),
        imageUrl: imgs[0],
        images: imgs,
        sellerName: seller.name,
        sellerEmail: seller.email,
        sellerPhone: seller.phone,
        ownerEmail: seller.email,
        location,
        city: location,
        status: 'active',
        isFeatured: idx % 7 === 0,
        availability: isRent ? 'rent' : 'sale',
        createdAt: new Date(),
      });
    }
  }

  return cars;
}

export const SEED_CAR_COUNT_APPROX = CAR_DEFS.length * 3;
export default generateSeedData;
