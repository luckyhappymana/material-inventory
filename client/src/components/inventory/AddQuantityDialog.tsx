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

interface AddQuantityDialogProps {
  isOpen: boolean;
  material: Material | null;
  onClose: () => void;
  onSuccess: () => void;
}

const AddQuantityDialog = ({ 
  isOpen, 
  material, 
  onClose, 
  onSuccess 
}: AddQuantityDialogProps) => {
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
      
      // 既存の材料の枚数を増やす
      const updatedMaterial = {
        ...material,
        quantity: material.quantity + data.quantity
      };
      
      return apiRequest("PATCH", `/api/materials/${material.id}`, updatedMaterial);
    },
    onSuccess: () => {
      onSuccess();
    },
  });

  const onSubmit = (data: QuantityFormData) => {
    updateMutation.mutate(data);
  };

  if (!material) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="bg-neutral-50 px-6 py-4 -mx-6 -mt-6 border-b border-neutral-200">
          <DialogTitle className="text-lg font-medium">在庫数を増やす</DialogTitle>
        </DialogHeader>

        <div className="px-1 pt-4">
          <p className="mb-4">以下の材料の在庫数を増やします：</p>
          
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
                    <FormLabel>追加枚数</FormLabel>
                    <div className="flex items-center">
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
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
                  className="bg-secondary hover:bg-green-600"
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? "処理中..." : "追加する"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddQuantityDialog;