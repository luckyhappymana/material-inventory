import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import MaterialTypeBadge from "@/components/ui/material-type-badge";
import { AlertTriangle } from "lucide-react";
import { MaterialType } from "@shared/schema";
import { useDeleteMaterialType } from "@/hooks/use-material-types";

interface DeleteMaterialTypeDialogProps {
  isOpen: boolean;
  materialType: MaterialType | null;
  onClose: () => void;
  onSuccess: () => void;
}

const DeleteMaterialTypeDialog = ({ 
  isOpen, 
  materialType, 
  onClose, 
  onSuccess 
}: DeleteMaterialTypeDialogProps) => {
  // 削除ミューテーション
  const deleteMutation = useDeleteMaterialType();

  const handleDelete = () => {
    if (!materialType) return;
    deleteMutation.mutate(materialType.id, {
      onSuccess: () => onSuccess()
    });
  };

  if (!materialType) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="bg-neutral-50 px-6 py-4 -mx-6 -mt-6 border-b border-neutral-200">
          <DialogTitle className="text-lg font-medium">材質タイプ削除確認</DialogTitle>
        </DialogHeader>

        <div className="px-1 pt-4">
          <div className="flex items-center text-error mb-4">
            <AlertTriangle className="h-5 w-5 mr-2" />
            <p>この操作は取り消せません。本当に削除しますか？</p>
          </div>
          
          <div className="bg-neutral-50 p-4 rounded-md mb-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="font-medium">材質名:</div>
              <div>
                <MaterialTypeBadge name={materialType.name} color={materialType.color} />
              </div>
              <div className="font-medium">カラー:</div>
              <div className="flex items-center">
                <div 
                  className="w-4 h-4 rounded-full mr-2" 
                  style={{ backgroundColor: materialType.color }}
                ></div>
                {materialType.color}
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={deleteMutation.isPending}
            >
              キャンセル
            </Button>
            <Button 
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "処理中..." : "削除する"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteMaterialTypeDialog;