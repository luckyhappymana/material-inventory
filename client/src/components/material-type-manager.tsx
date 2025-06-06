import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { PlusCircle, Edit2, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/lib/firestore-client";
import { queryClient as defaultQueryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getMaterialTypeColorClass } from "@/lib/material-utils";

const materialTypeFormSchema = z.object({
  name: z.string().min(1, "材質名は必須です"),
  color: z.string().min(1, "色は必須です"),
});

type MaterialTypeFormData = z.infer<typeof materialTypeFormSchema>;

const ColorPicker = ({ value, onChange }: { value: string; onChange: (color: string) => void }) => {
  const [customColor, setCustomColor] = useState(value);
  
  const predefinedColors = [
    "#64748B", "#94A3B8", "#F97316", "#EAB308", "#6366F1", "#374151",
    "#DC2626", "#16A34A", "#2563EB", "#9333EA", "#0891B2", "#65A30D",
    "#7C3AED", "#C2410C", "#0D9488", "#CA8A04", "#BE185D", "#1D4ED8",
    "#7E22CE", "#B91C1C", "#059669", "#0369A1", "#7C2D12", "#881337",
    "#166534", "#1E40AF", "#5B21B6"
  ];

  return (
    <div className="space-y-3">
      {/* Predefined Colors */}
      <div className="grid grid-cols-9 gap-2">
        {predefinedColors.map((color) => (
          <button
            key={color}
            type="button"
            className={`w-8 h-8 rounded-lg border-2 transition-all ${
              value === color ? "border-gray-900 scale-110" : "border-gray-300 hover:border-gray-500"
            }`}
            style={{ backgroundColor: color }}
            onClick={() => {
              onChange(color);
              setCustomColor(color);
            }}
            title={color}
          />
        ))}
      </div>
      
      {/* Custom Color Picker */}
      <div className="flex items-center space-x-2">
        <Label htmlFor="custom-color" className="text-sm font-medium">
          カスタム色:
        </Label>
        <input
          id="custom-color"
          type="color"
          value={customColor}
          onChange={(e) => {
            setCustomColor(e.target.value);
            onChange(e.target.value);
          }}
          className="w-12 h-8 rounded border border-gray-300 cursor-pointer"
        />
        <span className="text-sm text-gray-500">{customColor}</span>
      </div>
    </div>
  );
};

export function MaterialTypeManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingType, setEditingType] = useState<any | null>(null);
  const [deletingType, setDeletingType] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: materialTypes = [], isLoading } = useQuery({
    queryKey: ["materialTypes"],
    queryFn: () => api.getMaterialTypes(),
  });

  const form = useForm<MaterialTypeFormData>({
    resolver: zodResolver(materialTypeFormSchema),
    defaultValues: {
      name: "",
      color: "#9333EA",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: MaterialTypeFormData) => {
      return await api.createMaterialType(data);
    },
    onSuccess: () => {
      defaultQueryClient.invalidateQueries({ queryKey: ["materialTypes"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: MaterialTypeFormData) => {
      if (!editingType) throw new Error("No editing type");
      return await api.updateMaterialType(editingType.id, data);
    },
    onSuccess: () => {
      defaultQueryClient.invalidateQueries({ queryKey: ["materialTypes"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await api.deleteMaterialType(id);
    },
    onSuccess: () => {
      defaultQueryClient.invalidateQueries({ queryKey: ["materialTypes"] });
    },
  });

  const handleAdd = () => {
    form.reset({
      name: "",
      color: "#9333EA",
    });
    setEditingType(null);
    setIsFormOpen(true);
  };

  const handleEdit = (materialType: any) => {
    form.reset({
      name: materialType.name,
      color: materialType.color,
    });
    setEditingType(materialType);
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingType) return;

    try {
      await deleteMutation.mutateAsync(deletingType.id);
      queryClient.invalidateQueries({ queryKey: ["/api/material-types"] });
      toast({
        title: "材質を削除しました",
        description: "材質が正常に削除されました。",
      });
    } catch (error) {
      toast({
        title: "エラー",
        description: "材質の削除に失敗しました。",
        variant: "destructive",
      });
    } finally {
      setDeletingType(null);
    }
  };

  const onSubmit = async (data: MaterialTypeFormData) => {
    setIsSubmitting(true);
    try {
      // 新規追加の場合または編集時に名前が変更された場合、重複チェック
      const isNameChanged = editingType ? editingType.name !== data.name : true;
      
      if (isNameChanged) {
        const duplicate = materialTypes.find(mt => 
          mt.name.toLowerCase() === data.name.toLowerCase() &&
          (!editingType || mt.id !== editingType.id)
        );

        if (duplicate) {
          toast({
            title: "重複エラー",
            description: `材質名「${data.name}」は既に存在します。別の名前を入力してください。`,
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }
      }

      if (editingType) {
        await updateMutation.mutateAsync(data);
        toast({
          title: "材質を更新しました",
          description: "材質情報が正常に更新されました。",
        });
      } else {
        await createMutation.mutateAsync(data);
        toast({
          title: "材質を追加しました",
          description: "新しい材質が正常に追加されました。",
        });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/material-types"] });
      setIsFormOpen(false);
    } catch (error: any) {
      console.error("Material type creation/update error:", error);
      let errorMessage = editingType ? "材質の更新に失敗しました。" : "材質の追加に失敗しました。";
      
      toast({
        title: "エラー",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">材質マスタ管理</h3>
          <p className="mt-1 text-sm text-gray-500">
            材質の種類を管理します。新しい材質の追加や既存材質の編集が可能です。
          </p>
        </div>
        <div className="p-6">
          <div className="mb-4">
            <Button onClick={handleAdd} className="inline-flex items-center">
              <PlusCircle className="w-4 h-4 mr-2" />
              新規材質追加
            </Button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    材質名
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    色
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {materialTypes.map((type: any) => (
                  <tr key={type.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {type.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge 
                        className="text-white"
                        style={{ backgroundColor: type.color }}
                      >
                        {type.color}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(type)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeletingType(type)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add/Edit Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingType ? "材質を編集" : "新しい材質を追加"}</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>材質名</FormLabel>
                    <FormControl>
                      <Input placeholder="例: steel" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />



              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>色を選択</FormLabel>
                    <FormControl>
                      <ColorPicker value={field.value} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                  キャンセル
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "保存中..." : editingType ? "更新" : "追加"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingType} onOpenChange={() => setDeletingType(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>材質を削除</AlertDialogTitle>
            <AlertDialogDescription>
              材質「{deletingType?.name}」を削除しますか？
              この操作は元に戻せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingType(null)}>
              キャンセル
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              削除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}