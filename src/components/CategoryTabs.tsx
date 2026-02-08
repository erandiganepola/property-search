import type { PropertyType } from "../data/properties";

type CategoryKey = PropertyType | "all";

interface Category {
  key: CategoryKey;
  label: string;
}

const CATEGORIES: Category[] = [
  { key: "all", label: "All" },
  { key: "short-rent", label: "Short-Term Rental" },
  { key: "long-rent", label: "Long-Term Rental" },
  { key: "sale", label: "For Sale" },
];

interface CategoryTabsProps {
  activeCategory: CategoryKey;
  onCategoryChange: (category: CategoryKey) => void;
}

export default function CategoryTabs({ activeCategory, onCategoryChange }: CategoryTabsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORIES.map(({ key, label }) => (
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
