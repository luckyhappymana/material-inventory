import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useEffect } from "react";
import { HexColorPicker } from "react-colorful";
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
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MaterialType, insertMaterialTypeSchema } from "@shared/schema";
import { useCreateMaterialType, useUpdateMaterialType } from "@/hooks/use-material-types";
import { DEFAULT_MATERIAL_COLORS } from "@/components/ui/material-badge";

// フォームスキーマの拡張
const formSchema = insertMaterialTypeSchema.extend({
  name: z.string().min(1, "材質名を入力してください"),
  color: z.string().min(1, "カラーコードを入力してください")
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "有効なカラーコード（例: #FF5733）を入力してください"),
});

type FormData = z.infer<typeof formSchema>;

interface MaterialTypeFormProps {
  materialType?: MaterialType | null;
  onClose: () => void;
  onSuccess: () => void;
}

const MaterialTypeForm = ({ materialType, onClose, onSuccess }: MaterialTypeFormProps) => {
  const isEditing = !!materialType;
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  
  // フォームの初期値を設定
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: materialType?.name || "",
      color: materialType?.color || "#6366F1", // デフォルトインディゴに変更
    },
  });

  // 作成・更新のミューテーション
  const createMutation = useCreateMaterialType();
  const updateMutation = useUpdateMaterialType(isEditing && materialType ? materialType.id : -1);

  const onSubmit = (data: FormData) => {
    if (isEditing && materialType) {
      updateMutation.mutate(data, {
        onSuccess: () => onSuccess()
      });
    } else {
      createMutation.mutate(data, {
        onSuccess: () => onSuccess()
      });
    }
  };

  const isPending = createMutation.isPending || (updateMutation?.isPending || false);

  return (
    <>
      <DialogHeader className="bg-neutral-50 px-6 py-4 -mx-6 -mt-6 border-b border-neutral-200">
        <DialogTitle className="text-lg font-medium">
          {isEditing ? "材質タイプ編集" : "新規材質タイプ追加"}
        </DialogTitle>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 px-1 pt-4">
          {/* 材質名 */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  材質名 <span className="text-error">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="SPC, SECC など"
                    {...field}
                    disabled={isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* カラーコード */}
          <FormField
            control={form.control}
            name="color"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  カラー <span className="text-error">*</span>
                </FormLabel>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Popover open={colorPickerOpen} onOpenChange={setColorPickerOpen}>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className="w-14 h-14 rounded-md border border-neutral-200 cursor-pointer transition-all hover:shadow-md"
                          style={{ backgroundColor: field.value }}
                          aria-label="カラーを選択"
                        />
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-3">
                        <HexColorPicker
                          color={field.value}
                          onChange={(color) => {
                            field.onChange(color);
                          }}
                        />
                        
                        {/* 標準色パレット */}
                        <div className="mt-3">
                          <div className="text-xs text-neutral-500 mb-2">
                            標準色:
                          </div>
                          <div className="grid grid-cols-6 gap-2">
                            {Object.values(DEFAULT_MATERIAL_COLORS).map((color, index) => (
                              <button
                                key={`color-${index}`}
                                type="button"
                                className="w-6 h-6 rounded-md border border-neutral-200 cursor-pointer transition-all hover:shadow-md"
                                style={{ backgroundColor: color }}
                                onClick={() => {
                                  field.onChange(color);
                                }}
                                aria-label={`カラー${index + 1}を選択`}
                              />
                            ))}
                          </div>
                        </div>
                        
                        <div className="flex justify-center mt-3">
                          <Button 
                            type="button" 
                            size="sm" 
                            variant="outline"
                            onClick={() => setColorPickerOpen(false)}
                          >
                            選択
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="flex-1">
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="#FF5733"
                        {...field}
                        disabled={isPending}
                      />
                    </FormControl>
                    <p className="text-xs text-neutral-500 mt-1">
                      色をクリックしてカラーピッカーから選択するか、直接HEXカラーコードを入力してください
                    </p>
                  </div>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 操作ボタン */}
          <div className="flex justify-end space-x-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
            >
              キャンセル
            </Button>
            <Button 
              type="submit" 
              disabled={isPending}
            >
              {isPending ? "処理中..." : isEditing ? "更新" : "追加"}
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
};

export default MaterialTypeForm;