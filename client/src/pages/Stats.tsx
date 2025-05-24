import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import MaterialBadge from "@/components/ui/material-badge";
import { Check, Plus, Trash } from "lucide-react";

interface MaterialStats {
  byType: Record<string, number>;
  byThickness: Record<string, number>;
  recentActivity: Array<{
    action: string;
    materialType: string;
    thickness: string;
    quantity: number;
    timestamp: Date;
  }>;
}

const Stats = () => {
  const { data: stats, isLoading, error } = useQuery<MaterialStats>({
    queryKey: ["/api/stats"],
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-red-500">エラーが発生しました。</div>
      </div>
    );
  }

  // Format timestamp for display
  const formatTimestamp = (date: Date) => {
    return format(new Date(date), "yyyy/MM/dd HH:mm");
  };

  // Get activity icon based on action
  const getActivityIcon = (action: string) => {
    switch (action) {
      case "add":
        return <Plus className="text-secondary text-sm mr-1" />;
      case "use":
        return <Check className="text-primary text-sm mr-1" />;
      case "delete":
        return <Trash className="text-error text-sm mr-1" />;
      default:
        return <Plus className="text-secondary text-sm mr-1" />;
    }
  };

  // Get activity text based on action
  const getActivityText = (action: string, materialType: string, thickness: string, quantity: number) => {
    switch (action) {
      case "add":
        return `${materialType} ${thickness} 追加 (${quantity}枚)`;
      case "use":
        return `${materialType} ${thickness} 使用 (${quantity}枚)`;
      case "delete":
        return `${materialType} ${thickness} 削除 (${quantity}枚)`;
      default:
        return `${materialType} ${thickness} (${quantity}枚)`;
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">在庫統計</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 材質別集計 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">材質別在庫数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats && Object.entries(stats.byType).length > 0 ? (
                Object.entries(stats.byType).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <MaterialBadge materialType={type} className="mr-2" />
                      <span>{type}</span>
                    </div>
                    <span className="font-medium">{count}枚</span>
                  </div>
                ))
              ) : (
                <div className="text-neutral-500 text-center py-4">データなし</div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* 板厚別集計 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">板厚別在庫数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats && Object.entries(stats.byThickness).length > 0 ? (
                Object.entries(stats.byThickness).map(([thickness, count]) => (
                  <div key={thickness} className="flex items-center justify-between">
                    <span>{thickness}</span>
                    <span className="font-medium">{count}枚</span>
                  </div>
                ))
              ) : (
                <div className="text-neutral-500 text-center py-4">データなし</div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* 最近の活動 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">最近の活動</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats && stats.recentActivity.length > 0 ? (
                stats.recentActivity.slice(0, 5).map((activity, index) => (
                  <div key={index} className="text-sm">
                    <div className="flex items-center text-neutral-600">
                      {getActivityIcon(activity.action)}
                      <span>
                        {getActivityText(
                          activity.action,
                          activity.materialType,
                          activity.thickness,
                          activity.quantity
                        )}
                      </span>
                    </div>
                    <div className="text-neutral-500 mt-1">
                      {formatTimestamp(activity.timestamp)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-neutral-500 text-center py-4">活動記録なし</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Stats;
