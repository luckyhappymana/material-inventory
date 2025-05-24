import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import MaterialTable from "@/components/inventory/MaterialTable";
import MaterialForm from "@/components/inventory/MaterialForm";
import UseMaterialDialog from "@/components/inventory/UseMaterialDialog";
import DeleteMaterialDialog from "@/components/inventory/DeleteMaterialDialog";
import AddQuantityDialog from "@/components/inventory/AddQuantityDialog";
import ReduceQuantityDialog from "@/components/inventory/ReduceQuantityDialog";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useMaterials } from "@/hooks/use-materials";
import { useMaterialTypes } from "@/hooks/use-material-types";
import { Material } from "@shared/schema";

const Inventory = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [thickness, setThickness] = useState<string>("");
  const [minWidth, setMinWidth] = useState<string>("");
  const [minHeight, setMinHeight] = useState<string>("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isUseModalOpen, setIsUseModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isAddQuantityModalOpen, setIsAddQuantityModalOpen] = useState(false);
  const [isReduceQuantityModalOpen, setIsReduceQuantityModalOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  
  // 材質タイプを動的に取得
  const { materialTypes, isLoading: isLoadingTypes } = useMaterialTypes();
  
  const { 
    materials, 
    isLoading, 
    error,
    refetch 
  } = useMaterials(searchQuery, selectedFilter, thickness, minWidth, minHeight);
  
  // 材質タイプによるフィルターを動的に生成
  const materialFilters = [
    { id: "all", label: "すべて" },
    ...materialTypes.map(type => ({
      id: type.name,
      label: type.name
    }))
  ];

  const handleFilterChange = (filterId: string) => {
    setSelectedFilter(filterId);
  };

  const handleAddMaterial = () => {
    setIsAddModalOpen(true);
  };

  const handleEditMaterial = (material: Material) => {
    setSelectedMaterial(material);
    setIsAddModalOpen(true);
  };

  const handleUseMaterial = (material: Material) => {
    setSelectedMaterial(material);
    setIsUseModalOpen(true);
  };

  const handleDeleteMaterial = (material: Material) => {
    setSelectedMaterial(material);
    setIsDeleteModalOpen(true);
  };
  
  const handleAddQuantity = (material: Material) => {
    setSelectedMaterial(material);
    setIsAddQuantityModalOpen(true);
  };
  
  const handleReduceQuantity = (material: Material) => {
    setSelectedMaterial(material);
    setIsReduceQuantityModalOpen(true);
  };

  const handleAddFormClose = () => {
    setIsAddModalOpen(false);
    setSelectedMaterial(null);
  };

  const handleAddFormSuccess = () => {
    setIsAddModalOpen(false);
    setSelectedMaterial(null);
    refetch();
    toast({
      title: "成功",
      description: "材料が正常に保存されました。",
    });
  };

  const handleUseSuccess = () => {
    setIsUseModalOpen(false);
    setSelectedMaterial(null);
    refetch();
    toast({
      title: "成功",
      description: "材料使用が記録されました。",
    });
  };

  const handleDeleteSuccess = () => {
    setIsDeleteModalOpen(false);
    setSelectedMaterial(null);
    refetch();
    toast({
      title: "成功",
      description: "材料が削除されました。",
    });
  };
  
  const handleAddQuantitySuccess = () => {
    setIsAddQuantityModalOpen(false);
    setSelectedMaterial(null);
    refetch();
    toast({
      title: "成功",
      description: "在庫数が増加されました。",
    });
  };
  
  const handleReduceQuantitySuccess = () => {
    setIsReduceQuantityModalOpen(false);
    setSelectedMaterial(null);
    refetch();
    toast({
      title: "成功",
      description: "在庫数が減少されました。",
    });
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
        <h2 className="text-2xl font-bold">在庫一覧</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <i className="material-icons absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400">search</i>
            <Input
              id="search-input"
              placeholder="検索..."
              className="pl-10 pr-4 py-2 w-full sm:w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => refetch()}
              className="flex items-center justify-center bg-green-600 hover:bg-green-700 text-white"
              title="データを更新する"
            >
              <i className="material-icons text-xl">refresh</i>
            </Button>
            <Button 
              onClick={handleAddMaterial}
              className="flex items-center justify-center bg-primary text-white"
            >
              <i className="material-icons mr-1">add</i>新規追加
            </Button>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-neutral-200">
        <div className="flex flex-wrap gap-3 justify-between">
          <div className="flex flex-wrap gap-1 md:gap-2">
            {materialFilters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => handleFilterChange(filter.id)}
                className={`px-3 py-1 rounded-full text-sm ${
                  selectedFilter === filter.id
                    ? "bg-primary text-white"
                    : "bg-neutral-200 text-neutral-700"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* 詳細検索フィルター - メイン検索に統合 */}
        <div className="mt-3 pt-3 border-t border-neutral-200">
          <div className="flex flex-wrap items-center gap-3">
            {/* 板厚検索 */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-neutral-700">板厚:</span>
              <Input
                type="text"
                placeholder="t1.5"
                className="w-24"
                value={thickness}
                onChange={(e) => setThickness(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    // 幅の入力フィールドにフォーカスする
                    document.getElementById('width-input')?.focus();
                    e.preventDefault();
                  }
                }}
              />
            </div>
            
            {/* 幅による検索 */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-neutral-700">幅:</span>
              <Input
                id="width-input"
                type="number"
                placeholder="最小幅(mm)"
                className="w-32"
                value={minWidth}
                onChange={(e) => setMinWidth(e.target.value)}
                min="0"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    // 高さの入力フィールドにフォーカスする
                    document.getElementById('height-input')?.focus();
                    e.preventDefault();
                  }
                }}
              />
              <span className="text-sm text-neutral-600">mm以上</span>
            </div>
            
            {/* 高さによる検索 */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-neutral-700">高さ:</span>
              <Input
                id="height-input"
                type="number"
                placeholder="最小高さ(mm)"
                className="w-32"
                value={minHeight}
                onChange={(e) => setMinHeight(e.target.value)}
                min="0"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    // Enterキーで検索を実行
                    refetch();
                    e.preventDefault();
                  }
                }}
              />
              <span className="text-sm text-neutral-600">mm以上</span>
            </div>
            
            <div className="flex items-center gap-2 ml-auto">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  // 検索フィルターを適用
                  refetch();
                }}
              >
                検索
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setThickness("");
                  setMinWidth("");
                  setMinHeight("");
                  refetch();
                }}
              >
                リセット
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Material Table */}
      <MaterialTable
        materials={materials}
        isLoading={isLoading}
        onEdit={handleEditMaterial}
        onUse={handleUseMaterial}
        onDelete={handleDeleteMaterial}
        onAddQuantity={handleAddQuantity}
        onReduceQuantity={handleReduceQuantity}
      />

      {/* Add/Edit Material Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-md">
          <MaterialForm
            material={selectedMaterial}
            onClose={handleAddFormClose}
            onSuccess={handleAddFormSuccess}
          />
        </DialogContent>
      </Dialog>

      {/* Use Material Modal */}
      <UseMaterialDialog
        isOpen={isUseModalOpen}
        material={selectedMaterial}
        onClose={() => setIsUseModalOpen(false)}
        onSuccess={handleUseSuccess}
      />

      {/* Delete Material Modal */}
      <DeleteMaterialDialog
        isOpen={isDeleteModalOpen}
        material={selectedMaterial}
        onClose={() => setIsDeleteModalOpen(false)}
        onSuccess={handleDeleteSuccess}
      />

      {/* Add Quantity Modal */}
      <AddQuantityDialog
        isOpen={isAddQuantityModalOpen}
        material={selectedMaterial}
        onClose={() => setIsAddQuantityModalOpen(false)}
        onSuccess={handleAddQuantitySuccess}
      />
      
      {/* Reduce Quantity Modal */}
      <ReduceQuantityDialog
        isOpen={isReduceQuantityModalOpen}
        material={selectedMaterial}
        onClose={() => setIsReduceQuantityModalOpen(false)}
        onSuccess={handleReduceQuantitySuccess}
      />
    </div>
  );
};

export default Inventory;
