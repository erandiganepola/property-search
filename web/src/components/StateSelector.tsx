import { useState, useRef, useEffect } from "react";
import { US_STATES } from "../data/properties";

interface StateSelectorProps {
  selectedStates: string[];
  onStatesChange: (states: string[]) => void;
}

export default function StateSelector({ selectedStates, onStatesChange }: StateSelectorProps) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = US_STATES.filter((s) =>
    s.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function toggle(state: string) {
    if (selectedStates.includes(state)) {
      onStatesChange(selectedStates.filter((s) => s !== state));
    } else {
      onStatesChange([...selectedStates, state]);
    }
  }

  function clearAll() {
    onStatesChange([]);
    setSearch("");
  }

  return (
    <div className="w-full max-w-sm relative" ref={containerRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Search &amp; Select States
      </label>

      {/* Input area */}
      <div
        className="flex flex-wrap items-center gap-1.5 min-h-[42px] rounded-lg border border-gray-300 bg-white px-3 py-2 shadow-sm cursor-text focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500 transition"
        onClick={() => setOpen(true)}
      >
        {selectedStates.map((state) => (
          <span
            key={state}
            className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-800 text-xs font-medium px-2 py-0.5 rounded-full"
          >
            {state}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggle(state);
              }}
              className="hover:text-indigo-600 cursor-pointer"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </span>
        ))}
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={selectedStates.length === 0 ? "Type to search states..." : ""}
          className="flex-1 min-w-[120px] outline-none text-sm text-gray-900 bg-transparent placeholder-gray-400"
        />
        {selectedStates.length > 0 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              clearAll();
            }}
            className="text-gray-400 hover:text-gray-600 cursor-pointer"
            title="Clear all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <ul className="absolute z-10 mt-1 w-full max-h-60 overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
          {filtered.length === 0 ? (
            <li className="px-4 py-3 text-sm text-gray-500">No states match your search</li>
          ) : (
            filtered.map((state) => {
              const isSelected = selectedStates.includes(state);
              return (
                <li
                  key={state}
                  onClick={() => toggle(state)}
                  className={`flex items-center gap-2 px-4 py-2 text-sm cursor-pointer transition ${
                    isSelected
                      ? "bg-indigo-50 text-indigo-700 font-medium"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <span
                    className={`flex items-center justify-center w-4 h-4 rounded border transition ${
                      isSelected
                        ? "bg-indigo-600 border-indigo-600"
                        : "border-gray-300"
                    }`}
                  >
                    {isSelected && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </span>
                  {state}
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}
