import type { Property, PropertyType } from "../data/properties.js";

const SCOPE_TO_TYPES: Record<string, PropertyType[]> = {
  "list-rent": ["short-rent", "long-rent"],
  "list-sale": ["sale"],
};

export function getAllowedTypes(scopes: string[]): Set<PropertyType> {
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
  if (allowed.size === 0) return [];
  return properties.filter((p) => allowed.has(p.type));
}
