import type { PropertyType } from "../data/properties";

type CategoryKey = PropertyType | "all";

interface Category {
  key: CategoryKey;
  label: string;
  requiredScope?: "rent" | "sale";
}

const CATEGORIES: Category[] = [
  { key: "all", label: "All" },
  { key: "short-rent", label: "Short-Term Rental", requiredScope: "rent" },
  { key: "long-rent", label: "Long-Term Rental", requiredScope: "rent" },
  { key: "sale", label: "For Sale", requiredScope: "sale" },
];

interface CategoryTabsProps {
  activeCategory: CategoryKey;
  onCategoryChange: (category: CategoryKey) => void;
  availableScopes?: { rent: boolean; sale: boolean };
}

export default function CategoryTabs({
  activeCategory,
  onCategoryChange,
  availableScopes = { rent: true, sale: true },
}: CategoryTabsProps) {
  const visibleCategories = CATEGORIES.filter(({ requiredScope }) => {
    if (!requiredScope) return true;
    return requiredScope === "rent" ? availableScopes.rent : availableScopes.sale;
  });

  // Hide "All" tab if user only has one scope type
  const showAll = availableScopes.rent && availableScopes.sale;
  const finalCategories = showAll
    ? visibleCategories
    : visibleCategories.filter((c) => c.key !== "all");

  return (
    <div className="flex flex-wrap gap-2">
      {finalCategories.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onCategoryChange(key)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition ${
            activeCategory === key
              ? "bg-indigo-600 text-white shadow-md"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export type { CategoryKey };
