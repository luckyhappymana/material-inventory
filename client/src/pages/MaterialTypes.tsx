import { useState } from "react";
import { useMaterialTypes } from "@/hooks/use-material-types";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import MaterialTypeBadge from "@/components/ui/material-type-badge";
import MaterialTypeForm from "@/components/material-types/MaterialTypeForm";
import DeleteMaterialTypeDialog from "@/components/material-types/DeleteMaterialTypeDialog";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { MaterialType } from "@shared/schema";
import { format } from "date-fns";

const MaterialTypes = () => {
  const { toast } = useToast();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedMaterialType, setSelectedMaterialType] = useState<MaterialType | null>(null);
  
  const { 
    materialTypes, 
    isLoading, 
    error,
    refetch 
  } = useMaterialTypes();
  
  const handleAddMaterialType = () => {
    setSelectedMaterialType(null);
    setIsAddModalOpen(true);
  };

  const handleEditMaterialType = (materialType: MaterialType) => {
    setSelectedMaterialType(materialType);
    setIsAddModalOpen(true);
  };

  const handleDeleteMaterialType = (materialType: MaterialType) => {
    setSelectedMaterialType(materialType);
    setIsDeleteModalOpen(true);
  };

  const handleFormClose = () => {
    setIsAddModalOpen(false);
    setSelectedMaterialType(null);
  };

  const handleFormSuccess = () => {
    setIsAddModalOpen(false);
    setSelectedMaterialType(null);
    refetch();
    toast({
      title: "成功",
      description: "材質タイプが正常に保存されました。",
    });
  };

  const handleDeleteSuccess = () => {
    setIsDeleteModalOpen(false);
    setSelectedMaterialType(null);
    refetch();
    toast({
      title: "成功",
      description: "材質タイプが削除されました。",
    });
  };

  const formatDate = (date: Date) => {
    return format(new Date(date), "yyyy/MM/dd");
  };

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-error">エラーが発生しました: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-2xl font-bold">材質タイプ管理</h2>
        <Button 
          onClick={handleAddMaterialType}
          className="flex items-center justify-center bg-primary text-white"
        >
          <i className="material-icons mr-1">add</i>新規材質タイプ追加
        </Button>
      </div>

      {/* Material Types Table */}
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="text-left text-sm font-medium text-neutral-600">
                <TableHead className="px-4 py-3 whitespace-nowrap">プレビュー</TableHead>
                <TableHead className="px-4 py-3 whitespace-nowrap">材質名</TableHead>
                <TableHead className="px-4 py-3 whitespace-nowrap">カラーコード</TableHead>
                <TableHead className="px-4 py-3 whitespace-nowrap">作成日</TableHead>
                <TableHead className="px-4 py-3 whitespace-nowrap text-right">アクション</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-neutral-200">
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-neutral-500">読み込み中...</p>
                  </TableCell>
                </TableRow>
              ) : materialTypes && materialTypes.length > 0 ? (
                materialTypes.map((materialType) => (
                  <TableRow key={materialType.id} className="text-sm text-neutral-800 hover:bg-neutral-50">
                    <TableCell className="px-4 py-3 whitespace-nowrap">
                      <MaterialTypeBadge name={materialType.name} color={materialType.color} />
                    </TableCell>
                    <TableCell className="px-4 py-3 whitespace-nowrap">{materialType.name}</TableCell>
                    <TableCell className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <div 
                          className="w-4 h-4 rounded-full mr-2" 
                          style={{ backgroundColor: materialType.color }}
                        ></div>
                        {materialType.color}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 whitespace-nowrap">{formatDate(materialType.createdAt)}</TableCell>
                    <TableCell className="px-4 py-3 whitespace-nowrap text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-primary mr-2"
                        onClick={() => handleEditMaterialType(materialType)}
                      >
                        編集
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-error"
                        onClick={() => handleDeleteMaterialType(materialType)}
                      >
                        削除
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-neutral-500">
                    材質タイプが登録されていません
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Add/Edit Material Type Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-md">
          <MaterialTypeForm
            materialType={selectedMaterialType}
            onClose={handleFormClose}
            onSuccess={handleFormSuccess}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Material Type Modal */}
      <DeleteMaterialTypeDialog
        isOpen={isDeleteModalOpen}
        materialType={selectedMaterialType}
        onClose={() => setIsDeleteModalOpen(false)}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  );
};

export default MaterialTypes;