import { format } from "date-fns";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import MaterialBadge from "@/components/ui/material-badge";
import { Material } from "@shared/schema";
import { Edit, CheckCircle, Trash2, PlusCircle, MinusCircle } from "lucide-react";

interface MaterialTableProps {
  materials?: Material[];
  isLoading: boolean;
  onEdit: (material: Material) => void;
  onUse: (material: Material) => void;
  onDelete: (material: Material) => void;
  onAddQuantity: (material: Material) => void;
  onReduceQuantity: (material: Material) => void;
}

const MaterialTable = ({ 
  materials, 
  isLoading, 
  onEdit, 
  onUse, 
  onDelete,
  onAddQuantity,
  onReduceQuantity
}: MaterialTableProps) => {
  // Format date for display
  const formatDate = (date: Date) => {
    return format(new Date(date), "yyyy/MM/dd");
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="text-left text-sm font-medium text-neutral-600">
              <TableHead className="px-4 py-3 whitespace-nowrap">材質</TableHead>
              <TableHead className="px-4 py-3 whitespace-nowrap">板厚</TableHead>
              <TableHead className="px-4 py-3 whitespace-nowrap">サイズ</TableHead>
              <TableHead className="px-4 py-3 whitespace-nowrap">枚数</TableHead>
              <TableHead className="px-4 py-3 whitespace-nowrap text-center">アクション</TableHead>
              <TableHead className="px-4 py-3 whitespace-nowrap">備考</TableHead>
              <TableHead className="px-4 py-3 whitespace-nowrap text-center">編集</TableHead>
              <TableHead className="px-4 py-3 whitespace-nowrap">作成日</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-neutral-200">
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-neutral-500">読み込み中...</p>
                </TableCell>
              </TableRow>
            ) : materials && materials.length > 0 ? (
              materials.map((material) => (
                <TableRow key={material.id} className="text-sm text-neutral-800 hover:bg-neutral-50">
                  <TableCell className="px-4 py-3 whitespace-nowrap">
                    <MaterialBadge materialType={material.materialType} />
                  </TableCell>
                  <TableCell className="px-4 py-3 whitespace-nowrap font-medium text-base">{material.thickness}</TableCell>
                  <TableCell className="px-4 py-3 whitespace-nowrap">
                    <span className="text-lg font-bold">{material.widthMm}×{material.heightMm}</span>
                  </TableCell>
                  <TableCell className="px-4 py-3 whitespace-nowrap">
                    <span className="text-lg font-bold">{material.quantity}</span> 枚
                  </TableCell>
                  <TableCell className="px-4 py-3 whitespace-nowrap text-center">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => onAddQuantity(material)}
                            className="text-blue-500 mr-2"
                            aria-label="在庫増加"
                          >
                            <PlusCircle className="h-4 w-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>在庫増加</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => onReduceQuantity(material)}
                            className="text-red-500 mr-2"
                            aria-label="在庫減少"
                          >
                            <MinusCircle className="h-4 w-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>在庫減少</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell className="px-4 py-3 whitespace-nowrap">{material.notes || "-"}</TableCell>
                  <TableCell className="px-4 py-3 whitespace-nowrap text-center">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => onEdit(material)}
                            className="text-primary mr-2"
                            aria-label="編集"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>編集</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => onDelete(material)}
                            className="text-error"
                            aria-label="削除"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>削除</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell className="px-4 py-3 whitespace-nowrap">{formatDate(material.createdAt)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-neutral-500">
                  材料が登録されていません
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination */}
      <div className="px-4 py-3 flex items-center justify-between border-t border-neutral-200">
        <div className="text-sm text-neutral-600">
          表示: {materials ? `1-${materials.length} / ${materials.length}件` : "0件"}
        </div>
        <div className="flex items-center space-x-2">
          <button className="px-3 py-1 text-sm rounded border border-neutral-300 bg-white text-neutral-500 cursor-not-allowed">前へ</button>
          <button className="px-3 py-1 text-sm rounded border border-primary bg-primary text-white">1</button>
          <button className="px-3 py-1 text-sm rounded border border-neutral-300 bg-white text-neutral-500 cursor-not-allowed">次へ</button>
        </div>
      </div>
    </div>
  );
};

export default MaterialTable;
