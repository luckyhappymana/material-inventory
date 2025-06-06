import { Package, Layers, AlertTriangle, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/firestore-client";
import type { MaterialStats } from "@shared/firebase-schema";

interface StatsCardsProps {
  stats?: MaterialStats;
}

export function StatsCards({ stats }: StatsCardsProps) {
  const { data: materialTypes = [] } = useQuery({
    queryKey: ["materialTypes"],
    queryFn: () => api.getMaterialTypes(),
  });

  if (!stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Skeleton className="w-8 h-8 rounded-md mr-4" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-8 w-12" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center text-gray-500">統計データを読み込めませんでした</div>
        </div>
      </div>
    );
  }

  const cards = [
    {
      title: "材質種類",
      value: stats.materialTypes.toString(),
      icon: Package,
      color: "blue",
    },
    {
      title: "材質・板厚組合せ",
      value: stats.totalMaterials.toLocaleString(),
      icon: Layers,
      color: "green",
    },
    {
      title: "在庫少",
      value: stats.lowStock.toString(),
      icon: AlertTriangle,
      color: "amber",
    },
    {
      title: "総枚数",
      value: stats.totalSheets.toLocaleString(),
      icon: TrendingUp,
      color: "purple",
    },
  ];

  return (
    <div className="space-y-6">
      {/* 基本統計 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, index) => (
          <div 
            key={card.title} 
            className="card-hover animate-fade-in bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 cursor-pointer group"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-center justify-between">
              <div>
                <dt className="text-sm font-medium text-gray-600 mb-1 group-hover:text-gray-700 transition-colors">
                  {card.title}
                </dt>
                <dd className="text-2xl font-bold text-gray-900 animate-scale-in group-hover:scale-105 transition-transform duration-200">
                  {card.value}
                </dd>
              </div>
              <div className={`w-12 h-12 bg-gradient-to-br from-${card.color}-400 to-${card.color}-600 rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md hover-glow transition-all duration-300`}>
                <card.icon className="w-6 h-6 text-white group-hover:scale-110 transition-transform duration-200" />
              </div>
            </div>
            
            {/* Progress indicator for low stock warning */}
            {card.title === "在庫少" && parseInt(card.value) > 0 && (
              <div className="mt-3 w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-amber-400 to-red-500 progress-bar animate-pulse-gentle"
                  style={{ width: `${Math.min(100, (parseInt(card.value) / 10) * 100)}%` }}
                ></div>
              </div>
            )}
            
            {/* Animated trend indicator */}
            {card.title === "総枚数" && (
              <div className="mt-2 flex items-center text-xs text-green-600">
                <TrendingUp className="w-3 h-3 mr-1 animate-bounce-subtle" />
                <span className="animate-fade-in">在庫管理中</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 材質・板厚別統計 */}
      {stats.materialTypeThicknessStats && stats.materialTypeThicknessStats.length > 0 && (
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">材質・板厚別在庫数量</h3>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                  <tr>
                    <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      材質
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      板厚 (mm)
                    </th>
                    <th scope="col" className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                      数量 (枚)
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {stats.materialTypeThicknessStats.map((stat, index) => {
                    const materialType = materialTypes.find(type => type.name === stat.materialTypeName);
                    return (
                      <tr key={`${stat.materialTypeName}-${stat.thickness}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          <div className="flex items-center">
                            <div
                              className="w-3 h-3 rounded-full mr-2"
                              style={{ backgroundColor: materialType?.color || '#9CA3AF' }}
                            />
                            {stat.materialTypeName}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {stat.thickness}mm
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">
                          {stat.totalQuantity.toLocaleString()}枚
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
