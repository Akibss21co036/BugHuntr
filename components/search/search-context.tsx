import { createContext, useContext, useState } from "react";

type SearchSuggestion = {
  id: string;
  title: string;
};

const SearchContext = createContext({
  searchTerm: "",
  setSearchTerm: (term: string) => {},
  suggestions: [] as SearchSuggestion[],
  setSuggestions: (items: SearchSuggestion[]) => {},
});

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  return (
    <SearchContext.Provider
      value={{ searchTerm, setSearchTerm, suggestions, setSuggestions }}
    >
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  return useContext(SearchContext);
}
