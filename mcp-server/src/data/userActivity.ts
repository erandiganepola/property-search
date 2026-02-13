import type { Property } from "./properties.js";

export interface SearchEntry {
  timestamp: number;
  states: string[];
  type?: string;
  resultsCount: number;
}

export interface UserActivity {
  userId: string;
  searches: SearchEntry[];
  viewedProperties: number[];
  comparisons: number[][];
}

export interface UserProfile {
  preferredStates: string[];
  intent: "buying" | "renting-short" | "renting-long" | "mixed";
  budgetRange: { min: number; max: number };
  preferredSize: { bedrooms: number; sqft: number };
  searchCount: number;
  lastActive: number;
}

const activityStore = new Map<string, UserActivity>();

function getOrCreate(userId: string): UserActivity {
  let activity = activityStore.get(userId);
  if (!activity) {
    activity = { userId, searches: [], viewedProperties: [], comparisons: [] };
    activityStore.set(userId, activity);
  }
  return activity;
}

export function recordSearch(userId: string, entry: SearchEntry): void {
  const activity = getOrCreate(userId);
  activity.searches.push(entry);
}

export function recordView(userId: string, propertyId: number): void {
  const activity = getOrCreate(userId);
  if (!activity.viewedProperties.includes(propertyId)) {
    activity.viewedProperties.push(propertyId);
  }
}

export function recordComparison(userId: string, ids: number[]): void {
  const activity = getOrCreate(userId);
  activity.comparisons.push(ids);
}

export function getUserActivity(userId: string): UserActivity | undefined {
  return activityStore.get(userId);
}

export function generateUserProfile(activity: UserActivity, allProperties: Property[]): UserProfile | null {
  if (activity.searches.length === 0 && activity.viewedProperties.length === 0) {
    return null;
  }

  // Most searched states
  const stateCounts = new Map<string, number>();
  for (const search of activity.searches) {
    for (const state of search.states) {
      stateCounts.set(state, (stateCounts.get(state) || 0) + 1);
    }
  }
  const preferredStates = [...stateCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([state]) => state);

  // Intent from searched types
  const typeCounts = new Map<string, number>();
  for (const search of activity.searches) {
    if (search.type) {
      typeCounts.set(search.type, (typeCounts.get(search.type) || 0) + 1);
    }
  }
  let intent: UserProfile["intent"] = "mixed";
  if (typeCounts.size === 1) {
    const singleType = [...typeCounts.keys()][0];
    if (singleType === "sale") intent = "buying";
    else if (singleType === "short-rent") intent = "renting-short";
    else if (singleType === "long-rent") intent = "renting-long";
  } else if (typeCounts.size > 1) {
    const sorted = [...typeCounts.entries()].sort((a, b) => b[1] - a[1]);
    const topType = sorted[0][0];
    if (topType === "sale") intent = "buying";
    else if (topType === "short-rent") intent = "renting-short";
    else if (topType === "long-rent") intent = "renting-long";
  }

  // Budget and size from viewed properties
  const viewedProps = activity.viewedProperties
    .map((id) => allProperties.find((p) => p.id === id))
    .filter((p): p is Property => p !== undefined);

  let budgetMin = 0;
  let budgetMax = 0;
  let avgBedrooms = 0;
  let avgSqft = 0;

  if (viewedProps.length > 0) {
    const prices = viewedProps.map((p) => p.price);
    budgetMin = Math.min(...prices);
    budgetMax = Math.max(...prices);
    avgBedrooms = Math.round(viewedProps.reduce((sum, p) => sum + p.bedrooms, 0) / viewedProps.length);
    avgSqft = Math.round(viewedProps.reduce((sum, p) => sum + p.sqft, 0) / viewedProps.length);
  }

  const lastActive = activity.searches.length > 0
    ? Math.max(...activity.searches.map((s) => s.timestamp))
    : Date.now();

  return {
    preferredStates,
    intent,
    budgetRange: { min: budgetMin, max: budgetMax },
    preferredSize: { bedrooms: avgBedrooms, sqft: avgSqft },
    searchCount: activity.searches.length,
    lastActive,
  };
}

export function scorePropertyMatch(property: Property, profile: UserProfile): number {
  let score = 0;

  // State match
  if (profile.preferredStates.some((s) => s.toLowerCase() === property.state.toLowerCase())) {
    score += 30;
  }

  // Type match based on intent
  if (profile.intent === "buying" && property.type === "sale") score += 25;
  else if (profile.intent === "renting-short" && property.type === "short-rent") score += 25;
  else if (profile.intent === "renting-long" && property.type === "long-rent") score += 25;
  else if (profile.intent === "mixed") score += 10;

  // Budget proximity (within 50% range)
  if (profile.budgetRange.max > 0) {
    const mid = (profile.budgetRange.min + profile.budgetRange.max) / 2;
    const range = profile.budgetRange.max - profile.budgetRange.min || mid;
    const diff = Math.abs(property.price - mid);
    if (diff <= range) {
      score += 20 * (1 - diff / range);
    }
  }

  // Size proximity
  if (profile.preferredSize.bedrooms > 0) {
    const bedroomDiff = Math.abs(property.bedrooms - profile.preferredSize.bedrooms);
    score += Math.max(0, 15 - bedroomDiff * 5);
  }
  if (profile.preferredSize.sqft > 0) {
    const sqftDiff = Math.abs(property.sqft - profile.preferredSize.sqft);
    const sqftRange = profile.preferredSize.sqft * 0.5;
    if (sqftDiff <= sqftRange) {
      score += 10 * (1 - sqftDiff / sqftRange);
    }
  }

  return Math.round(score);
}
