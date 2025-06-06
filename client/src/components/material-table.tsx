import { Edit2, Trash2, PlusCircle, MinusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { MaterialWithType } from "@/lib/firestore-client";

interface MaterialTableProps {
  materials: MaterialWithType[];
  isLoading: boolean;
  onEditMaterial: (material: MaterialWithType) => void;
  onStockIn: (material: MaterialWithType) => void;
  onStockOut: (material: MaterialWithType) => void;
  onDeleteMaterial: (material: MaterialWithType) => void;
  forceDesktopView?: boolean;
}

const getStockStatusInfo = (quantity: number) => {
  if (quantity === 0) {
    return { status: "在庫切れ", color: "bg-red-500" };
  } else if (quantity <= 2) {
    return { status: "在庫少", color: "bg-yellow-500" };
  } else {
    return { status: "在庫あり", color: "bg-green-500" };
  }
};

export function MaterialTable({ materials, isLoading, onEditMaterial, onStockIn, onStockOut, onDeleteMaterial, forceDesktopView = false }: MaterialTableProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6">
          <div className="text-center">読み込み中...</div>
        </div>
      </div>
    );
  }

  if (materials.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg mb-2">条件に一致する材料が見つかりません</p>
          <p className="text-gray-400">条件を変更して再度検索してください</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table */}
      <div className={forceDesktopView ? "block overflow-x-auto" : "hidden lg:block overflow-x-auto"}>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                材質
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                板厚
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                サイズ
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                枚数
              </th>
              <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                入出庫
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                備考
              </th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {materials.map((material: MaterialWithType) => (
              <tr key={material.id} className="hover:bg-gray-50 transition-colors duration-150">
                <td className="px-4 py-3 whitespace-nowrap">
                  <Badge 
                    className="text-white"
                    style={{ backgroundColor: material.materialType.color }}
                  >
                    {material.materialType.name}
                  </Badge>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="text-sm font-medium text-gray-900">
                    {material.thickness}mm
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="text-sm font-bold text-gray-900">
                    {material.width.toLocaleString()} × {material.height.toLocaleString()}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="text-sm font-bold text-gray-900">
                    {material.quantity}枚
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-center">
                  <div className="flex items-center justify-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onStockIn(material)}
                      className="text-green-600 hover:text-green-900"
                      title="入庫"
                    >
                      <PlusCircle className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onStockOut(material)}
                      className="text-red-600 hover:text-red-900"
                      title="出庫"
                      disabled={material.quantity === 0}
                    >
                      <MinusCircle className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="text-xs text-gray-600">
                    {material.note || '-'}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditMaterial(material)}
                      className="text-blue-600 hover:text-blue-900"
                      title="編集"
                    >
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteMaterial(material)}
                      className="text-red-600 hover:text-red-900"
                      title="削除"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Layout */}
      <div className={forceDesktopView ? "hidden" : "lg:hidden space-y-2"}>
        {materials.map((material: MaterialWithType) => (
          <div 
            key={material.id}
            className="bg-white border border-gray-200 rounded-lg p-2 shadow-sm"
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Badge 
                  className="text-white text-xs"
                  style={{ backgroundColor: material.materialType.color }}
                >
                  {material.materialType.name}
                </Badge>
                <span className="text-lg font-bold text-gray-900">
                  {material.thickness}mm
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between mb-1">
              <span className="text-base font-bold text-gray-900">
                {material.width.toLocaleString()} × {material.height.toLocaleString()}
              </span>
              <span className="text-lg font-bold text-gray-900">
                {material.quantity}枚
              </span>
            </div>
            
            {material.note && (
              <div className="text-xs text-gray-500 mb-1">
                備考: {material.note}
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onStockIn(material)}
                  className="text-green-600 border-green-300 hover:bg-green-50 h-7 text-xs px-2"
                >
                  <PlusCircle className="w-3 h-3 mr-1" />
                  入庫
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onStockOut(material)}
                  className="text-red-600 border-red-300 hover:bg-red-50 h-7 text-xs px-2"
                  disabled={material.quantity === 0}
                >
                  <MinusCircle className="w-3 h-3 mr-1" />
                  出庫
                </Button>
              </div>
              
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEditMaterial(material)}
                  className="text-blue-600 h-7 w-7 p-0"
                >
                  <Edit2 className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDeleteMaterial(material)}
                  className="text-red-600 h-7 w-7 p-0"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}