import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MaterialType, InsertMaterialType } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

// 材質タイプを取得するためのフック
export function useMaterialTypes() {
  const { data, isLoading, error, refetch } = useQuery<MaterialType[]>({
    queryKey: ["/api/material-types"],
  });

  return {
    materialTypes: data || [],
    isLoading,
    error,
    refetch,
  };
}

// 新しい材質タイプを作成するためのフック
export function useCreateMaterialType() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: InsertMaterialType) => {
      return apiRequest("POST", "/api/material-types", data);
    },
    onSuccess: () => {
      // 材質タイプと材料の両方のキャッシュを無効化して最新状態を反映
      queryClient.invalidateQueries({ queryKey: ["/api/material-types"] });
      queryClient.invalidateQueries({ queryKey: ["/api/materials"] });
    },
  });

  return mutation;
}

// 材質タイプを更新するためのフック
export function useUpdateMaterialType(id: number) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: Partial<InsertMaterialType>) => {
      return apiRequest("PATCH", `/api/material-types/${id}`, data);
    },
    onSuccess: () => {
      // 材質タイプと材料の両方のキャッシュを無効化して最新状態を反映
      queryClient.invalidateQueries({ queryKey: ["/api/material-types"] });
      queryClient.invalidateQueries({ queryKey: ["/api/materials"] });
    },
  });

  return mutation;
}

// 材質タイプを削除するためのフック
export function useDeleteMaterialType() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/material-types/${id}`);
    },
    onSuccess: () => {
      // 材質タイプと材料の両方のキャッシュを無効化して最新状態を反映
      queryClient.invalidateQueries({ queryKey: ["/api/material-types"] });
      queryClient.invalidateQueries({ queryKey: ["/api/materials"] });
    },
  });

  return mutation;
}