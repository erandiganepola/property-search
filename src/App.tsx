import { useState, useEffect, useCallback } from "react";
import { useAuthContext } from "@asgardeo/auth-react";
import type { Property } from "./data/properties";
import { searchProperties, resetMcpSession } from "./api/mcpClient";
import StateSelector from "./components/StateSelector";
import CategoryTabs from "./components/CategoryTabs";
import type { CategoryKey } from "./components/CategoryTabs";
import PropertyList from "./components/PropertyList";
import LoginPage from "./components/LoginPage";
import Header from "./components/Header";

function App() {
  const { state, getAccessToken, signOut } = useAuthContext();
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<CategoryKey>("all");
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userScopes, setUserScopes] = useState<string[]>([]);

  // Extract scopes from the access token once authenticated
  useEffect(() => {
    if (!state.isAuthenticated) return;
    getAccessToken().then((token) => {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        const scopes = ((payload.scope as string) || "").split(" ").filter(Boolean);
        setUserScopes(scopes);
      } catch {
        setUserScopes([]);
      }
    }).catch(() => {});
  }, [state.isAuthenticated, getAccessToken]);

  // Fetch properties from MCP server when selected states change
  const fetchProperties = useCallback(async () => {
    if (!state.isAuthenticated || selectedStates.length === 0) {
      setProperties([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = await getAccessToken();
      const results = await searchProperties(token, selectedStates);
      setProperties(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch properties");
      setProperties([]);
    } finally {
      setLoading(false);
    }
  }, [state.isAuthenticated, selectedStates, getAccessToken]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  // Handle sign out — reset MCP session
  const handleSignOut = () => {
    resetMcpSession();
    signOut();
  };

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

  // Determine which category tabs to show based on scopes
  const hasRent = userScopes.includes("list-rent");
  const hasSale = userScopes.includes("list-sale");

  // Client-side filtering by active category tab
  const filtered = properties.filter((p) => {
    if (activeCategory === "all") return true;
    return p.type === activeCategory;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onSignOut={handleSignOut} />

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
            availableScopes={{ rent: hasRent, sale: hasSale }}
          />
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Results count */}
        <p className="text-sm text-gray-500 mb-4">
          {loading
            ? "Loading properties..."
            : selectedStates.length > 0
              ? `Showing ${filtered.length} ${filtered.length === 1 ? "property" : "properties"} in ${selectedStates.join(", ")}`
              : "Select one or more states to search properties"}
        </p>

        {/* Property grid */}
        {loading ? (
          <div className="text-center py-16">
            <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto" />
          </div>
        ) : (
          <PropertyList properties={filtered} />
        )}
      </main>
    </div>
  );
}

export default App;
