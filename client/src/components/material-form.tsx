import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/firestore-client";
import { queryClient } from "@/lib/queryClient";
import { getMaterialTypeColorClass } from "@/lib/material-utils";
import { z } from "zod";

const materialFormSchema = z.object({
  materialTypeId: z.string().min(1, "材質を選択してください"),
  thickness: z.coerce.number().min(0.1, "板厚は0.1mm以上で入力してください"),
  width: z.coerce.number().min(1, "幅は1mm以上で入力してください"),
  height: z.coerce.number().min(1, "高さは1mm以上で入力してください"),
  quantity: z.coerce.number().min(0, "枚数は0以上で入力してください"),
  note: z.string().optional(),
});

type MaterialFormData = z.infer<typeof materialFormSchema>;

interface MaterialFormProps {
  isOpen: boolean;
  material?: any;
  onClose: () => void;
  onSuccess: () => void;
}

export function MaterialForm({ isOpen, material, onClose, onSuccess }: MaterialFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: materialTypes = [] } = useQuery({
    queryKey: ["materialTypes"],
    queryFn: () => api.getMaterialTypes(),
  });

  const { data: existingMaterials = [] } = useQuery({
    queryKey: ["materials"],
    queryFn: () => api.getMaterials(),
  });

  const form = useForm<MaterialFormData>({
    resolver: zodResolver(materialFormSchema),
    defaultValues: material ? {
      materialTypeId: material.materialTypeId,
      thickness: material.thickness,
      width: material.width,
      height: material.height,
      quantity: material.quantity,
      note: material.note || "",
    } : {
      materialTypeId: "",
      thickness: "",
      width: "",
      height: "",
      quantity: 1,
      note: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: MaterialFormData) => {
      return api.createMaterial(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materials"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: MaterialFormData) => {
      return api.updateMaterial(material!.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materials"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });

  const onSubmit = async (data: MaterialFormData) => {
    setIsSubmitting(true);
    try {
      // 新規追加の場合のみ重複チェック
      if (!material) {
        const duplicate = existingMaterials.find(m => 
          m.materialTypeId === data.materialTypeId &&
          m.thickness === data.thickness &&
          m.width === data.width &&
          m.height === data.height
        );

        if (duplicate) {
          const materialTypeName = materialTypes.find(mt => mt.id === data.materialTypeId)?.name || "不明";
          toast({
            title: "重複エラー",
            description: `同じ材質・寸法の材料が既に存在します\n${materialTypeName} ${data.thickness}mm ${data.width}×${data.height}`,
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }
      }

      if (material) {
        await updateMutation.mutateAsync(data);
        toast({
          title: "材料を更新しました",
          description: "材料情報が正常に更新されました。",
        });
      } else {
        await createMutation.mutateAsync(data);
        toast({
          title: "材料を追加しました",
          description: "新しい材料が正常に追加されました。",
        });
      }
      onSuccess();
    } catch (error) {
      toast({
        title: "エラー",
        description: material ? "材料の更新に失敗しました。" : "材料の追加に失敗しました。",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{material ? "材料を編集" : "新しい材料を追加"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="materialTypeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>材質</FormLabel>
                  <Select
                    value={field.value || ""}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="材質を選択してください" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {materialTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          <div className="flex items-center">
                            <div
                              className="w-3 h-3 rounded-full mr-2"
                              style={{ backgroundColor: type.color }}
                            />
                            {type.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="thickness"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>板厚 (mm)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="例: 3.0"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="width"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>幅 (mm)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="例: 1000"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="height"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>高さ (mm)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="例: 2000"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>枚数</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="例: 10"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>備考</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="メモや備考があれば入力してください"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onClose}>
                キャンセル
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "保存中..." : material ? "更新" : "追加"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
