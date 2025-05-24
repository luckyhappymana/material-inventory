import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import MaterialBadge from "@/components/ui/material-badge";
import { apiRequest } from "@/lib/queryClient";
import { Material } from "@shared/schema";

// Schema for quantity form
const quantityFormSchema = z.object({
  quantity: z.coerce.number()
    .min(1, "1枚以上を入力してください"),
});

type QuantityFormData = z.infer<typeof quantityFormSchema>;

interface ReduceQuantityDialogProps {
  isOpen: boolean;
  material: Material | null;
  onClose: () => void;
  onSuccess: () => void;
}

const ReduceQuantityDialog = ({ 
  isOpen, 
  material, 
  onClose, 
  onSuccess 
}: ReduceQuantityDialogProps) => {
  // Set up form with default values
  const form = useForm<QuantityFormData>({
    resolver: zodResolver(quantityFormSchema),
    defaultValues: {
      quantity: 1,
    },
  });

  // 在庫数更新のミューテーション
  const updateMutation = useMutation({
    mutationFn: async (data: QuantityFormData) => {
      if (!material) return;
      
      if (data.quantity > material.quantity) {
        throw new Error(`減らす枚数（${data.quantity}枚）が現在の在庫数（${material.quantity}枚）を超えています`);
      }
      
      // 既存の材料の枚数を減らす
      const updatedMaterial = {
        ...material,
        quantity: material.quantity - data.quantity
      };
      
      // 枚数が0の場合は非表示にする
      if (updatedMaterial.quantity <= 0) {
        updatedMaterial.hidden = true;
      }
      
      return apiRequest("PATCH", `/api/materials/${material.id}`, updatedMaterial);
    },
    onSuccess: () => {
      onSuccess();
    },
  });

  const onSubmit = (data: QuantityFormData) => {
    if (material && data.quantity > material.quantity) {
      form.setError("quantity", { 
        type: "max", 
        message: `在庫枚数（${material.quantity}枚）を超えています`
      });
      return;
    }
    
    updateMutation.mutate(data);
  };

  if (!material) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="bg-neutral-50 px-6 py-4 -mx-6 -mt-6 border-b border-neutral-200">
          <DialogTitle className="text-lg font-medium">在庫数を減らす</DialogTitle>
        </DialogHeader>

        <div className="px-1 pt-4">
          <p className="mb-4">以下の材料の在庫数を減らします（使用記録はされません）：</p>
          
          <div className="bg-neutral-50 p-4 rounded-md mb-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="font-medium">材質:</div>
              <div>
                <MaterialBadge materialType={material.materialType} />
              </div>
              <div className="font-medium">板厚:</div>
              <div>{material.thickness}</div>
              <div className="font-medium">サイズ:</div>
              <div>{material.widthMm}×{material.heightMm}</div>
              <div className="font-medium">現在の枚数:</div>
              <div>{material.quantity}枚</div>
            </div>
          </div>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>減らす枚数</FormLabel>
                    <div className="flex items-center">
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          max={material.quantity}
                          {...field}
                          disabled={updateMutation.isPending}
                        />
                      </FormControl>
                      <span className="ml-2 text-neutral-500">枚</span>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end space-x-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={updateMutation.isPending}
                >
                  キャンセル
                </Button>
                <Button 
                  type="submit"
                  variant="destructive"
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? "処理中..." : "減らす"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReduceQuantityDialog;