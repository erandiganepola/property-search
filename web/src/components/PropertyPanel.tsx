import { X } from "lucide-react";
import type { Property, PropertyType } from "../data/properties";

const TYPE_BADGES: Record<PropertyType, { label: string; color: string }> = {
  "short-rent": { label: "Short-Term", color: "bg-amber-100 text-amber-800" },
  "long-rent": { label: "Long-Term", color: "bg-blue-100 text-blue-800" },
  sale: { label: "For Sale", color: "bg-green-100 text-green-800" },
};

interface PropertyPanelProps {
  properties: Property[];
  onClose: () => void;
}

export default function PropertyPanel({ properties, onClose }: PropertyPanelProps) {
  return (
    <div className="fixed inset-0 z-40 flex justify-end" style={{ top: 73 }}>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        style={{ animation: "fadeIn 200ms ease-out" }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="relative w-[420px] max-w-full bg-white shadow-2xl rounded-l-2xl flex flex-col"
        style={{ animation: "slideInRight 300ms ease-out" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {properties.length} {properties.length === 1 ? "Property" : "Properties"}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">From this conversation</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition cursor-pointer"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Property list */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          <div className="flex flex-col gap-3">
            {properties.map((property) => {
              const badge = TYPE_BADGES[property.type];
              return (
                <div
                  key={property.id}
                  className="flex gap-3 p-2 rounded-xl hover:bg-gray-50 transition"
                >
                  <img
                    src={property.image}
                    alt={property.title}
                    className="w-20 h-20 rounded-lg object-cover shrink-0"
                    loading="lazy"
                  />
                  <div className="flex flex-col justify-center min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 truncate">
                      {property.title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {property.city}, {property.state}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm font-bold text-indigo-600">
                        {property.priceLabel}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${badge.color}`}
                      >
                        {badge.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {property.bedrooms} bed &middot; {property.bathrooms} bath &middot;{" "}
                      {property.sqft.toLocaleString()} sqft
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
