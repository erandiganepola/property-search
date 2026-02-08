import { useState } from "react";
import { useAuthContext } from "@asgardeo/auth-react";
import { properties } from "./data/properties";
import StateSelector from "./components/StateSelector";
import CategoryTabs from "./components/CategoryTabs";
import type { CategoryKey } from "./components/CategoryTabs";
import PropertyList from "./components/PropertyList";
import LoginPage from "./components/LoginPage";
import Header from "./components/Header";

function App() {
  const { state } = useAuthContext();
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<CategoryKey>("all");

  // Show loading while the SDK initialises or processes the auth callback redirect
  const hasAuthCallbackParams = new URLSearchParams(window.location.search).has("code");

  if (state.isLoading || hasAuthCallbackParams) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-500">Signing you in...</p>
        </div>
      </div>
    );
  }

  if (!state.isAuthenticated) {
    return <LoginPage />;
  }

  const filtered = properties.filter((p) => {
    const matchesState =
      selectedStates.length === 0 || selectedStates.includes(p.state);
    const matchesCategory =
      activeCategory === "all" || p.type === activeCategory;
    return matchesState && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

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
