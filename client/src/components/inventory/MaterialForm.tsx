import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
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
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  DefaultMaterialTypes, 
  Material, 
  MaterialType as MaterialTypeData, 
  insertMaterialSchema 
} from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useMaterialTypes } from "@/hooks/use-material-types";
import { Link } from "wouter";

// Extend the insert schema with additional validation
const formSchema = insertMaterialSchema.extend({
  widthMm: z.coerce.number().min(1, "幅を入力してください"),
  heightMm: z.coerce.number().min(1, "高さを入力してください"),
  quantity: z.coerce.number().min(1, "枚数は1以上を入力してください"),
  thickness: z.string().min(1, "板厚を入力してください"),
});

type FormData = z.infer<typeof formSchema>;

interface MaterialFormProps {
  material?: Material | null;
  onClose: () => void;
  onSuccess: () => void;
}

// 材質タイプの色を共通コンポーネントからインポート
import { DEFAULT_MATERIAL_COLORS } from "@/components/ui/material-badge";

// 材質タイプごとの標準色（共通定義を使用）
const materialTypeColors = DEFAULT_MATERIAL_COLORS;

// その他の材質用の追加色
const additionalColors = [
  "#F44336", // レッド
  "#2196F3", // ブルー
  "#4CAF50", // グリーン
  "#E91E63", // ピンク
  "#FFEB3B", // イエロー
  "#8BC34A", // ライトグリーン
  "#009688", // ティール
  "#673AB7", // ディープパープル
  "#FF5722"  // ディープオレンジ
];

const MaterialForm = ({ material, onClose, onSuccess }: MaterialFormProps) => {
  const isEditing = !!material;
  const { materialTypes, isLoading: isLoadingMaterialTypes } = useMaterialTypes();
  const { toast } = useToast();
  
  // 最近使用した材質を取得（ローカルストレージから）
  const [recentMaterialTypes, setRecentMaterialTypes] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('recentMaterialTypes');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Error loading recent material types:', e);
      return [];
    }
  });

  // Set up form with default values
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      materialType: material?.materialType || "",
      thickness: material?.thickness || "",
      widthMm: material?.widthMm || 0,
      heightMm: material?.heightMm || 0,
      quantity: material?.quantity || 1,
      notes: material?.notes || "",
    },
  });

  // 新規作成のときは、マウント後に材質フィールドにフォーカスを当てる
  useEffect(() => {
    if (!isEditing) {
      const timer = setTimeout(() => {
        const materialTypeInput = document.querySelector('input[name="materialType"]');
        if (materialTypeInput) {
          (materialTypeInput as HTMLInputElement).focus();
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isEditing]);

  // Material creation mutation
  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (isEditing) {
        return apiRequest("PATCH", `/api/materials/${material.id}`, data);
      } else {
        return apiRequest("POST", "/api/materials", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/materials"] });
      toast({
        title: isEditing ? "材料を更新しました" : "材料を追加しました",
        variant: "default",
      });
      onSuccess();
    },
    onError: (error: any) => {
      console.error("Error saving material:", error);
      
      // サーバーからの具体的なエラーメッセージがある場合はそれを表示
      let errorMessage = "材料の保存中にエラーが発生しました";
      
      if (error.response) {
        try {
          const responseData = error.response.data;
          if (responseData && responseData.message) {
            errorMessage = responseData.message;
          }
        } catch (e) {
          console.error("Error parsing error response:", e);
        }
      }
      
      toast({
        title: "エラー",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // 材質が選択された時に最近使用した材質リストを更新
  const handleMaterialTypeSelect = (value: string) => {
    if (!value) return;
    
    // 既存のリストから同じ材質を削除
    const updatedList = recentMaterialTypes.filter(type => type !== value);
    
    // リストの先頭に追加（最大10個まで保持）
    const newList = [value, ...updatedList].slice(0, 10);
    setRecentMaterialTypes(newList);
    
    // ローカルストレージに保存
    try {
      localStorage.setItem('recentMaterialTypes', JSON.stringify(newList));
    } catch (e) {
      console.error('Error saving recent material types:', e);
    }
  };
  
  const onSubmit = (data: FormData) => {
    // 材質を最近使用したリストに追加
    handleMaterialTypeSelect(data.materialType);
    
    // データを保存
    createMutation.mutate(data);
  };

  return (
    <>
      <DialogHeader className="bg-neutral-50 px-6 py-4 -mx-6 -mt-6 border-b border-neutral-200 flex items-center justify-between">
        <div>
          <DialogTitle className="text-lg font-medium">
            {isEditing ? "材料編集" : "新規材料追加"}
          </DialogTitle>
        </div>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 px-1 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Material Type */}
            <FormField
              control={form.control}
              name="materialType"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>
                    材質 <span className="text-error">*</span>
                  </FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      handleMaterialTypeSelect(value);
                    }}
                    defaultValue={field.value}
                    disabled={createMutation.isPending || isLoadingMaterialTypes}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="選択してください" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="max-h-80">
                      {/* 最近使用した材質タイプ（存在する場合） */}
                      {recentMaterialTypes.length > 0 && (
                        <>
                          <div className="px-2 py-1.5 text-sm font-semibold text-neutral-600">
                            最近使用した材質
                          </div>
                          {recentMaterialTypes
                            .filter(typeName => typeName !== "SUS") // SUSを除外
                            .map((typeName, index) => {
                            // 材質タイプに応じた色を取得
                            let bgColor = "";
                            if (typeName === "SPC") bgColor = materialTypeColors.SPC;
                            else if (typeName === "SECC") bgColor = materialTypeColors.SECC;
                            else if (typeName === "SUS-MIGAKI") bgColor = materialTypeColors["SUS-MIGAKI"];
                            else if (typeName === "SUS-HL") bgColor = materialTypeColors["SUS-HL"];
                            else if (typeName === "A5052") bgColor = materialTypeColors.A5052;
                            else {
                              // カスタム材質タイプの場合は、その色を探す
                              const customType = materialTypes?.find(t => t.name === typeName);
                              if (customType) {
                                bgColor = customType.color;
                              } else {
                                // 見つからない場合は追加色から割り当て
                                bgColor = additionalColors[index % additionalColors.length];
                              }
                            }
                            
                            return (
                              <SelectItem key={`recent-${typeName}-${index}`} value={typeName}>
                                <div className="flex items-center">
                                  <div 
                                    className="w-3 h-3 rounded-full mr-2" 
                                    style={{ backgroundColor: bgColor }}
                                  ></div>
                                  {typeName}
                                </div>
                              </SelectItem>
                            );
                          })}
                          <div className="px-2 py-1.5 border-t border-neutral-200"></div>
                        </>
                      )}
                      
                      {/* すべての材質タイプ（デフォルト + カスタム） */}
                      <div className="px-2 py-1.5 text-sm font-semibold text-neutral-600">
                        すべての材質
                      </div>
                      {/* デフォルト材質 */}
                      {/* 最近使用したリストに入っていない場合のみ表示 */}
                      {!recentMaterialTypes.includes("SPC") && (
                        <SelectItem value="SPC">
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: materialTypeColors.SPC }}></div>
                            SPC
                          </div>
                        </SelectItem>
                      )}
                      {!recentMaterialTypes.includes("SECC") && (
                        <SelectItem value="SECC">
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: materialTypeColors.SECC }}></div>
                            SECC
                          </div>
                        </SelectItem>
                      )}
                      {/* SUSを除外 */}
                      {!recentMaterialTypes.includes("SUS-MIGAKI") && (
                        <SelectItem value="SUS-MIGAKI">
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: materialTypeColors["SUS-MIGAKI"] }}></div>
                            SUS-MIGAKI
                          </div>
                        </SelectItem>
                      )}
                      {!recentMaterialTypes.includes("SUS-HL") && (
                        <SelectItem value="SUS-HL">
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: materialTypeColors["SUS-HL"] }}></div>
                            SUS-HL
                          </div>
                        </SelectItem>
                      )}
                      {!recentMaterialTypes.includes("A5052") && (
                        <SelectItem value="A5052">
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: materialTypeColors.A5052 }}></div>
                            A5052
                          </div>
                        </SelectItem>
                      )}
                      
                      {/* カスタム材質タイプ */}
                      {materialTypes && materialTypes.length > 0 && 
                        materialTypes
                          .filter(type => 
                            // 標準の材質タイプと名前が一致しないものを表示
                            type.name !== "SPC" &&
                            type.name !== "SECC" &&
                            type.name !== "SUS" &&
                            type.name !== "SUS-MIGAKI" &&
                            type.name !== "SUS-HL" &&
                            type.name !== "A5052" &&
                            // 最近使った材質とも重複しない
                            !recentMaterialTypes.includes(type.name)
                          )
                          .map((type, index) => (
                            <SelectItem key={`custom-${type.id}`} value={type.name}>
                              <div className="flex items-center">
                                <div 
                                  className="w-3 h-3 rounded-full mr-2" 
                                  style={{ backgroundColor: type.color }}
                                ></div>
                                {type.name}
                              </div>
                            </SelectItem>
                          ))
                      }
                    </SelectContent>
                  </Select>
                  <div className="text-sm text-neutral-500">
                    <Link to="/material-types" className="text-primary hover:underline">
                      材質の管理ページへ
                    </Link>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Thickness */}
            <FormField
              control={form.control}
              name="thickness"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    板厚 <span className="text-error">*</span>
                  </FormLabel>
                  <div className="flex items-center">
                    <span className="flex-shrink-0 text-sm text-neutral-500 mr-1">t</span>
                    <FormControl>
                      <Input
                        placeholder="1.5"
                        {...field}
                        disabled={createMutation.isPending}
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Size */}
          <div>
            <FormLabel>
              サイズ <span className="text-error">*</span>
            </FormLabel>
            <div className="flex items-center">
              <FormField
                control={form.control}
                name="widthMm"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="幅 (mm)"
                        {...field}
                        disabled={createMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <span className="mx-2 text-neutral-500">×</span>
              <FormField
                control={form.control}
                name="heightMm"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="高さ (mm)"
                        {...field}
                        disabled={createMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Quantity */}
          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  枚数 <span className="text-error">*</span>
                </FormLabel>
                <div className="flex items-center">
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      {...field}
                      disabled={createMutation.isPending}
                    />
                  </FormControl>
                  <span className="ml-2 text-neutral-500">枚</span>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Notes */}
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>備考</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="備考を入力..."
                    rows={2}
                    {...field}
                    value={field.value || ''}
                    disabled={createMutation.isPending}
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
              disabled={createMutation.isPending}
            >
              キャンセル
            </Button>
            <Button 
              type="submit" 
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? "処理中..." : isEditing ? "更新" : "追加"}
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
};

export default MaterialForm;
