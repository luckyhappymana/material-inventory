import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/firestore-client";
import type { MaterialFilters } from "@/pages/dashboard";

interface FilterPanelProps {
  filters: MaterialFilters;
  onFiltersChange: (filters: MaterialFilters) => void;
}

export function FilterPanel({ filters, onFiltersChange }: FilterPanelProps) {
  const [searchQuery, setSearchQuery] = useState(filters.search || "");

  const { data: materialTypes = [] } = useQuery({
    queryKey: ["materialTypes"],
    queryFn: () => api.getMaterialTypes(),
  });

  const handleFilterChange = (key: keyof MaterialFilters, value: any) => {
    const newFilters = { ...filters };
    if (value === "" || value === undefined || value === "all") {
      delete newFilters[key];
    } else {
      newFilters[key] = value;
    }
    onFiltersChange(newFilters);
  };

  const handleSearchChange = (value: string) => {
    console.log('Search changed:', value);
    setSearchQuery(value);
    handleFilterChange("search", value || undefined);
  };

  return (
    <div className="p-3 border-b border-gray-200">
      {/* Compact Search and Filter Controls */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Search Input */}
        <div className="relative w-40 lg:w-48">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="キーワード検索..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 text-sm h-9 w-full"
          />
        </div>

        {/* Thickness Filter */}
        <Input
          type="number"
          step="0.1"
          placeholder="板厚(mm)"
          value={filters.thickness || ""}
          onChange={(e) => handleFilterChange("thickness", e.target.value ? Number(e.target.value) : undefined)}
          className="text-sm h-9 w-28 lg:w-32"
        />
        
        {/* Width Filter */}
        <Input
          type="number"
          placeholder="幅≥"
          value={filters.minWidth || ""}
          onChange={(e) => handleFilterChange("minWidth", e.target.value ? Number(e.target.value) : undefined)}
          className="text-sm h-9 w-32 lg:w-36"
        />
        
        {/* Height Filter */}
        <Input
          type="number"
          placeholder="高≥"
          value={filters.minHeight || ""}
          onChange={(e) => handleFilterChange("minHeight", e.target.value ? Number(e.target.value) : undefined)}
          className="text-sm h-9 w-32 lg:w-36"
        />
        
        {/* Clear button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setSearchQuery("");
            onFiltersChange({});
          }}
          className="h-9 px-3 text-sm shrink-0"
          title="フィルタークリア"
        >
          クリア
        </Button>
      </div>
    </div>
  );
}