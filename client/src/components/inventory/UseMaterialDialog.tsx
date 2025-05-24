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
import { Textarea } from "@/components/ui/textarea";
import MaterialBadge from "@/components/ui/material-badge";
import { apiRequest } from "@/lib/queryClient";
import { Material } from "@shared/schema";

// Schema for usage form
const usageFormSchema = z.object({
  quantity: z.coerce.number()
    .min(1, "1枚以上を入力してください"),
  purpose: z.string().optional(),
});

type UsageFormData = z.infer<typeof usageFormSchema>;

interface UseMaterialDialogProps {
  isOpen: boolean;
  material: Material | null;
  onClose: () => void;
  onSuccess: () => void;
}

const UseMaterialDialog = ({ 
  isOpen, 
  material, 
  onClose, 
  onSuccess 
}: UseMaterialDialogProps) => {
  // Set up form with default values
  const form = useForm<UsageFormData>({
    resolver: zodResolver(usageFormSchema),
    defaultValues: {
      quantity: 1,
      purpose: "",
    },
  });

  // Update form max quantity when material changes
  useState(() => {
    if (material) {
      form.setValue("quantity", 1);
      // Add max validator based on available quantity
      form.clearErrors();
    }
  });

  // 在庫減少の処理
  const usageMutation = useMutation({
    mutationFn: async (data: UsageFormData) => {
      if (!material) return;
      
      // 在庫数を減らす
      const updatedMaterial = {
        ...material,
        quantity: material.quantity - data.quantity
      };
      
      // 在庫数が0になった場合は非表示にする
      if (updatedMaterial.quantity <= 0) {
        updatedMaterial.hidden = true;
      }
      
      return apiRequest("PATCH", `/api/materials/${material.id}`, updatedMaterial);
    },
    onSuccess: () => {
      onSuccess();
    },
  });

  const onSubmit = (data: UsageFormData) => {
    if (material && data.quantity > material.quantity) {
      form.setError("quantity", { 
        type: "max", 
        message: `在庫枚数（${material.quantity}枚）を超えています`
      });
      return;
    }
    
    usageMutation.mutate(data);
  };

  if (!material) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="bg-neutral-50 px-6 py-4 -mx-6 -mt-6 border-b border-neutral-200">
          <DialogTitle className="text-lg font-medium">材料使用登録</DialogTitle>
        </DialogHeader>

        <div className="px-1 pt-4">
          <p className="mb-4">以下の材料を使用済みとして登録しますか？</p>
          
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
              <div className="font-medium">枚数:</div>
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
                    <FormLabel>使用枚数</FormLabel>
                    <div className="flex items-center">
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          max={material.quantity}
                          {...field}
                          disabled={usageMutation.isPending}
                        />
                      </FormControl>
                      <span className="ml-2 text-neutral-500">枚</span>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="purpose"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>使用目的（任意）</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="使用目的を入力..."
                        rows={2}
                        {...field}
                        value={field.value || ''}
                        disabled={usageMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end space-x-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={usageMutation.isPending}
                >
                  キャンセル
                </Button>
                <Button 
                  type="submit"
                  className="bg-secondary hover:bg-green-600"
                  disabled={usageMutation.isPending}
                >
                  {usageMutation.isPending ? "処理中..." : "使用済みにする"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UseMaterialDialog;
