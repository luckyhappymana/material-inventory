import { useMutation } from "@tanstack/react-query";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import MaterialBadge from "@/components/ui/material-badge";
import { AlertTriangle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Material } from "@shared/schema";

interface DeleteMaterialDialogProps {
  isOpen: boolean;
  material: Material | null;
  onClose: () => void;
  onSuccess: () => void;
}

const DeleteMaterialDialog = ({ 
  isOpen, 
  material, 
  onClose, 
  onSuccess 
}: DeleteMaterialDialogProps) => {
  // Delete material mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!material) return;
      return apiRequest("DELETE", `/api/materials/${material.id}`);
    },
    onSuccess: () => {
      onSuccess();
    },
  });

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  if (!material) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="bg-neutral-50 px-6 py-4 -mx-6 -mt-6 border-b border-neutral-200">
          <DialogTitle className="text-lg font-medium">材料削除確認</DialogTitle>
        </DialogHeader>

        <div className="px-1 pt-4">
          <div className="flex items-center text-error mb-4">
            <AlertTriangle className="h-5 w-5 mr-2" />
            <p>この操作は取り消せません。本当に削除しますか？</p>
          </div>
          
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

export default DeleteMaterialDialog;
