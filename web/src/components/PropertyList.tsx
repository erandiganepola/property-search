import { Building2 } from "lucide-react";
import type { Property } from "../data/properties";
import PropertyCard from "./PropertyCard";

interface PropertyListProps {
  properties: Property[];
}

export default function PropertyList({ properties }: PropertyListProps) {
  if (properties.length === 0) {
    return (
      <div className="text-center py-16">
        <Building2 className="mx-auto h-12 w-12 text-gray-400" strokeWidth={1.5} />
        <h3 className="mt-3 text-lg font-medium text-gray-900">
          No properties found
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Try selecting a different state or category.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {properties.map((property) => (
        <PropertyCard key={property.id} property={property} />
      ))}
    </div>
  );
}
