import { useState } from "react";
import { properties } from "./data/properties";
import StateSelector from "./components/StateSelector";
import CategoryTabs from "./components/CategoryTabs";
import type { CategoryKey } from "./components/CategoryTabs";
import PropertyList from "./components/PropertyList";

function App() {
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<CategoryKey>("all");

  const filtered = properties.filter((p) => {
    const matchesState =
      selectedStates.length === 0 || selectedStates.includes(p.state);
    const matchesCategory =
      activeCategory === "all" || p.type === activeCategory;
    return matchesState && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-bold text-gray-900">
            US Property Search
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Browse properties for rent and sale across the United States
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:items-end gap-6 mb-8">
          <StateSelector
            selectedStates={selectedStates}
            onStatesChange={(states) => {
              setSelectedStates(states);
              setActiveCategory("all");
            }}
          />
          <CategoryTabs
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
          />
        </div>

        {/* Results count */}
        <p className="text-sm text-gray-500 mb-4">
          {selectedStates.length > 0
            ? `Showing ${filtered.length} ${filtered.length === 1 ? "property" : "properties"} in ${selectedStates.join(", ")}`
            : `Showing all ${filtered.length} properties`}
        </p>

        {/* Property grid */}
        <PropertyList properties={filtered} />
      </main>
    </div>
  );
}

export default App;
