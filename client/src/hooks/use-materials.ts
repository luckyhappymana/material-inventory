import { useQuery } from "@tanstack/react-query";
import { Material } from "@shared/schema";

export function useMaterials(query: string = "", type: string = "all", thickness: string = "", minWidth: string = "", minHeight: string = "") {
  const { data, isLoading, error, refetch } = useQuery<Material[]>({
    queryKey: ["/api/materials", { q: query, type, thickness, minWidth, minHeight }],
    queryFn: async ({ queryKey }) => {
      const [_, params] = queryKey as [string, Record<string, string>];
      const searchParams = new URLSearchParams();
      if (params.q) searchParams.append("q", params.q);
      if (params.type) searchParams.append("type", params.type);
      if (params.thickness) searchParams.append("thickness", params.thickness);
      if (params.minWidth) searchParams.append("minWidth", params.minWidth);
      if (params.minHeight) searchParams.append("minHeight", params.minHeight);
      
      const response = await fetch(`/api/materials?${searchParams.toString()}`, {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch materials: ${response.status}`);
      }
      
      return response.json();
    },
  });

  return {
    materials: data || [],
    isLoading,
    error,
    refetch,
  };
}
