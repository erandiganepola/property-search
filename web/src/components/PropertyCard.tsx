import type { Property, PropertyType } from "../data/properties";

const TYPE_BADGES: Record<PropertyType, { label: string; color: string }> = {
  "short-rent": { label: "Short-Term Rental", color: "bg-amber-100 text-amber-800" },
  "long-rent": { label: "Long-Term Rental", color: "bg-blue-100 text-blue-800" },
  sale: { label: "For Sale", color: "bg-green-100 text-green-800" },
};

interface PropertyCardProps {
  property: Property;
}

export default function PropertyCard({ property }: PropertyCardProps) {
  const badge = TYPE_BADGES[property.type];

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative">
        <img
          src={property.image}
          alt={property.title}
          className="w-full h-32 object-cover"
          loading="lazy"
        />
        <span
          className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-semibold ${badge.color}`}
        >
          {badge.label}
        </span>
      </div>

      <div className="p-3">
        <h3 className="text-sm font-semibold text-gray-900 mb-0.5 truncate">
          {property.title}
        </h3>
        <p className="text-xs text-gray-500 mb-1">
          {property.city}, {property.state}
        </p>

        <p className="text-base font-bold text-indigo-600 mb-2">
          {property.priceLabel}
        </p>

        <div className="flex items-center gap-3 text-xs text-gray-600">
          <span>{property.bedrooms} bed</span>
          <span>{property.bathrooms} bath</span>
          <span>{property.sqft.toLocaleString()} sqft</span>
        </div>
      </div>
    </div>
  );
}
