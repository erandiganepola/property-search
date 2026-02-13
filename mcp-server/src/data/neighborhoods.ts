export interface Neighborhood {
  city: string;
  state: string;
  walkScore: number;
  safetyRating: number;
  schoolRating: number;
  medianIncome: number;
  topAmenities: string[];
  transitScore: number;
}

export const neighborhoods: Neighborhood[] = [
  // --- California ---
  {
    city: "Los Angeles",
    state: "California",
    walkScore: 67,
    safetyRating: 6,
    schoolRating: 6,
    medianIncome: 65000,
    topAmenities: ["Beaches", "Restaurants", "Entertainment", "Hiking Trails", "Shopping"],
    transitScore: 53,
  },
  {
    city: "San Francisco",
    state: "California",
    walkScore: 87,
    safetyRating: 6,
    schoolRating: 7,
    medianIncome: 112000,
    topAmenities: ["Tech Hub", "Restaurants", "Parks", "Public Transit", "Cultural Venues"],
    transitScore: 80,
  },
  {
    city: "San Diego",
    state: "California",
    walkScore: 51,
    safetyRating: 7,
    schoolRating: 7,
    medianIncome: 79000,
    topAmenities: ["Beaches", "Zoo", "Parks", "Military Bases", "Craft Breweries"],
    transitScore: 39,
  },
  {
    city: "Sacramento",
    state: "California",
    walkScore: 48,
    safetyRating: 5,
    schoolRating: 6,
    medianIncome: 62000,
    topAmenities: ["Farm-to-Fork Dining", "State Capitol", "Rivers", "Parks", "Affordable Housing"],
    transitScore: 34,
  },

  // --- New York ---
  {
    city: "New York City",
    state: "New York",
    walkScore: 89,
    safetyRating: 7,
    schoolRating: 6,
    medianIncome: 67000,
    topAmenities: ["World-Class Dining", "Broadway", "Museums", "Central Park", "Public Transit"],
    transitScore: 89,
  },
  {
    city: "Brooklyn",
    state: "New York",
    walkScore: 81,
    safetyRating: 6,
    schoolRating: 6,
    medianIncome: 60000,
    topAmenities: ["Art Scene", "Food Markets", "Prospect Park", "Nightlife", "Waterfront"],
    transitScore: 78,
  },
  {
    city: "Buffalo",
    state: "New York",
    walkScore: 55,
    safetyRating: 5,
    schoolRating: 5,
    medianIncome: 37000,
    topAmenities: ["Affordable Housing", "Sports Teams", "Architecture", "Waterfront", "Parks"],
    transitScore: 40,
  },

  // --- Texas ---
  {
    city: "Austin",
    state: "Texas",
    walkScore: 42,
    safetyRating: 7,
    schoolRating: 7,
    medianIncome: 71000,
    topAmenities: ["Live Music", "Tech Jobs", "Food Trucks", "Outdoor Activities", "Universities"],
    transitScore: 32,
  },
  {
    city: "Dallas",
    state: "Texas",
    walkScore: 46,
    safetyRating: 6,
    schoolRating: 6,
    medianIncome: 52000,
    topAmenities: ["Arts District", "Sports Teams", "Shopping", "BBQ Restaurants", "Business Hub"],
    transitScore: 39,
  },
  {
    city: "Houston",
    state: "Texas",
    walkScore: 36,
    safetyRating: 5,
    schoolRating: 6,
    medianIncome: 53000,
    topAmenities: ["Space Center", "Medical Center", "Diverse Cuisine", "Museums", "Energy Industry"],
    transitScore: 36,
  },
  {
    city: "San Antonio",
    state: "Texas",
    walkScore: 38,
    safetyRating: 6,
    schoolRating: 6,
    medianIncome: 49000,
    topAmenities: ["Riverwalk", "The Alamo", "Affordable Living", "Military Bases", "Theme Parks"],
    transitScore: 30,
  },

  // --- Florida ---
  {
    city: "Miami",
    state: "Florida",
    walkScore: 78,
    safetyRating: 6,
    schoolRating: 6,
    medianIncome: 44000,
    topAmenities: ["Beaches", "Nightlife", "Art Deco Architecture", "International Cuisine", "Water Sports"],
    transitScore: 57,
  },
  {
    city: "Orlando",
    state: "Florida",
    walkScore: 42,
    safetyRating: 6,
    schoolRating: 6,
    medianIncome: 50000,
    topAmenities: ["Theme Parks", "Golf Courses", "Lakes", "Family Entertainment", "Convention Center"],
    transitScore: 30,
  },
  {
    city: "Tampa",
    state: "Florida",
    walkScore: 49,
    safetyRating: 6,
    schoolRating: 6,
    medianIncome: 52000,
    topAmenities: ["Waterfront", "Busch Gardens", "Craft Beer", "Sports Teams", "Ybor City"],
    transitScore: 28,
  },
  {
    city: "Jacksonville",
    state: "Florida",
    walkScore: 27,
    safetyRating: 5,
    schoolRating: 6,
    medianIncome: 50000,
    topAmenities: ["Beaches", "Navy Base", "Parks", "Affordable Housing", "St. Johns River"],
    transitScore: 18,
  },

  // --- Colorado ---
  {
    city: "Denver",
    state: "Colorado",
    walkScore: 61,
    safetyRating: 6,
    schoolRating: 7,
    medianIncome: 68000,
    topAmenities: ["Mountain Access", "Craft Breweries", "Outdoor Recreation", "Arts Scene", "Sports Teams"],
    transitScore: 51,
  },
  {
    city: "Boulder",
    state: "Colorado",
    walkScore: 62,
    safetyRating: 8,
    schoolRating: 9,
    medianIncome: 66000,
    topAmenities: ["Hiking Trails", "University of Colorado", "Pearl Street Mall", "Cycling", "Organic Dining"],
    transitScore: 44,
  },
  {
    city: "Colorado Springs",
    state: "Colorado",
    walkScore: 35,
    safetyRating: 7,
    schoolRating: 7,
    medianIncome: 58000,
    topAmenities: ["Garden of the Gods", "Pikes Peak", "Military Bases", "Olympic Training Center", "Affordable Living"],
    transitScore: 20,
  },

  // --- Washington ---
  {
    city: "Seattle",
    state: "Washington",
    walkScore: 73,
    safetyRating: 6,
    schoolRating: 7,
    medianIncome: 92000,
    topAmenities: ["Tech Industry", "Coffee Culture", "Pike Place Market", "Outdoor Recreation", "Music Scene"],
    transitScore: 58,
  },
  {
    city: "Tacoma",
    state: "Washington",
    walkScore: 51,
    safetyRating: 5,
    schoolRating: 5,
    medianIncome: 55000,
    topAmenities: ["Waterfront", "Glass Museum", "Affordable Alternative to Seattle", "Point Defiance Park", "Breweries"],
    transitScore: 36,
  },

  // --- Illinois ---
  {
    city: "Chicago",
    state: "Illinois",
    walkScore: 78,
    safetyRating: 5,
    schoolRating: 6,
    medianIncome: 58000,
    topAmenities: ["Deep Dish Pizza", "Architecture", "Lakefront", "Museums", "Public Transit"],
    transitScore: 65,
  },
  {
    city: "Naperville",
    state: "Illinois",
    walkScore: 40,
    safetyRating: 9,
    schoolRating: 9,
    medianIncome: 108000,
    topAmenities: ["Top Schools", "Riverwalk", "Family-Friendly", "Low Crime", "Parks"],
    transitScore: 25,
  },

  // --- Georgia ---
  {
    city: "Atlanta",
    state: "Georgia",
    walkScore: 48,
    safetyRating: 5,
    schoolRating: 6,
    medianIncome: 59000,
    topAmenities: ["Business Hub", "Civil Rights History", "Food Scene", "BeltLine Trail", "Sports Teams"],
    transitScore: 44,
  },
  {
    city: "Savannah",
    state: "Georgia",
    walkScore: 52,
    safetyRating: 5,
    schoolRating: 5,
    medianIncome: 40000,
    topAmenities: ["Historic Architecture", "Squares", "SCAD Art School", "Southern Cuisine", "River Street"],
    transitScore: 25,
  },
];

export function findNeighborhood(city: string, state: string): Neighborhood | undefined {
  return neighborhoods.find(
    (n) =>
      n.city.toLowerCase() === city.toLowerCase() &&
      n.state.toLowerCase() === state.toLowerCase()
  );
}
