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
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative">
        <img
          src={property.image}
          alt={property.title}
          className="w-full h-48 object-cover"
          loading="lazy"
        />
        <span
          className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-semibold ${badge.color}`}
        >
          {badge.label}
        </span>
      </div>

      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate">
          {property.title}
        </h3>
        <p className="text-sm text-gray-500 mb-2">
          {property.city}, {property.state}
        </p>

        <p className="text-xl font-bold text-indigo-600 mb-3">
          {property.priceLabel}
        </p>

        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v11a1 1 0 001 1h16a1 1 0 001-1V7M3 7l9-4 9 4M3 7h18" />
            </svg>
            {property.bedrooms} bed
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {property.bathrooms} bath
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
            {property.sqft.toLocaleString()} sqft
          </span>
        </div>

        <p className="text-sm text-gray-600 line-clamp-2">
          {property.description}
        </p>
      </div>
    </div>
  );
}
