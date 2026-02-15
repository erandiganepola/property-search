import type { Property, PropertyType } from "../data/properties.js";

const SCOPE_TO_TYPES: Record<string, PropertyType[]> = {
  "list-rent": ["short-rent", "long-rent"],
  "list-sale": ["sale"],
};

export function getAllowedTypes(scopes: string[]): Set<PropertyType> {
  // When no scopes are present (auth disabled), allow all property types
  if (scopes.length === 0) {
    return new Set<PropertyType>(["short-rent", "long-rent", "sale"]);
  }
  const allowed = new Set<PropertyType>();
  for (const scope of scopes) {
    const types = SCOPE_TO_TYPES[scope];
    if (types) {
      types.forEach((t) => allowed.add(t));
    }
  }
  return allowed;
}

export function filterByScopes(properties: Property[], scopes: string[]): Property[] {
  const allowed = getAllowedTypes(scopes);
  // When no scopes are present (auth disabled), allow all property types
  if (allowed.size === 0) return properties;
  return properties.filter((p) => allowed.has(p.type));
}
