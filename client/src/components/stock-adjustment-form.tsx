import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { api, type MaterialWithType } from "@/lib/firestore-client";
import { queryClient } from "@/lib/queryClient";
import { getMaterialTypeColorClass } from "@/lib/material-utils";
import { z } from "zod";

const adjustmentFormSchema = z.object({
  type: z.enum(["in", "out"]),
  quantity: z.number().min(1, "数量は1以上で入力してください"),
  note: z.string().optional(),
});

type AdjustmentFormData = z.infer<typeof adjustmentFormSchema>;

interface StockAdjustmentFormProps {
  isOpen: boolean;
  material: MaterialWithType;
  stockType: "in" | "out";
  onClose: () => void;
  onSuccess: () => void;
}

export function StockAdjustmentForm({ isOpen, material, stockType, onClose, onSuccess }: StockAdjustmentFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AdjustmentFormData>({
    resolver: zodResolver(adjustmentFormSchema),
    defaultValues: {
      type: stockType,
      quantity: 1,
      note: "",
    },
  });

  const adjustmentMutation = useMutation({
    mutationFn: async (data: AdjustmentFormData) => {
      return api.adjustStock(material.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materials"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });

  const onSubmit = async (data: AdjustmentFormData) => {
    if (data.type === "out" && data.quantity > material.quantity) {
      toast({
        title: "エラー",
        description: "出庫数量が在庫数量を超えています。",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await adjustmentMutation.mutateAsync(data);
      toast({
        title: "在庫を調整しました",
        description: `${data.type === "in" ? "入庫" : "出庫"}処理が完了しました。`,
      });
      onSuccess();
    } catch (error) {
      toast({
        title: "エラー",
        description: "在庫調整に失敗しました。",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const watchedType = form.watch("type");
  const watchedQuantity = form.watch("quantity");

  const newQuantity = watchedType === "in" 
    ? material.quantity + (watchedQuantity || 0)
    : material.quantity - (watchedQuantity || 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{stockType === "in" ? "入庫" : "出庫"}</DialogTitle>
        </DialogHeader>

        {/* Material Info */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="flex items-center space-x-3 mb-2">
            <Badge className={`${getMaterialTypeColorClass(material.materialType.color)} text-white`}>
              {material.materialType.name}
            </Badge>
            <span className="text-sm text-gray-600">
              {material.thickness}mm - {material.width} × {material.height}
            </span>
          </div>
          <div className="text-sm text-gray-700">
            現在の在庫: <span className="font-medium">{material.quantity}枚</span>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>調整種別</FormLabel>
                  <FormControl>
                    <RadioGroup
                      value={field.value}
                      onValueChange={field.onChange}
                      className="flex space-x-6"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="in" id="in" />
                        <label htmlFor="in" className="text-sm font-medium">
                          入庫 (追加)
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="out" id="out" />
                        <label htmlFor="out" className="text-sm font-medium">
                          出庫 (削減)
                        </label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>数量 (枚)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      max={watchedType === "out" ? material.quantity : undefined}
                      placeholder="例: 5"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                  {watchedQuantity > 0 && (
                    <div className="text-sm text-gray-600">
                      調整後の在庫: <span className="font-medium">{newQuantity}枚</span>
                    </div>
                  )}
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>備考 (任意)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="調整理由や詳細を入力してください"
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
                {isSubmitting ? "処理中..." : "在庫調整"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
