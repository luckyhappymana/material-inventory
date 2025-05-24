import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import MaterialBadge from "@/components/ui/material-badge";
import { UsageHistory } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

const History = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  
  // 検索クエリの遅延適用（デバウンス）
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchQuery]);
  
  const { data: history, isLoading, error } = useQuery<UsageHistory[]>({
    queryKey: ["/api/usage-history", debouncedQuery],
    queryFn: async () => {
      const url = debouncedQuery 
        ? `/api/usage-history?q=${encodeURIComponent(debouncedQuery)}` 
        : "/api/usage-history";
      const response = await fetch(url);
      if (!response.ok) throw new Error("履歴の取得に失敗しました");
      return response.json();
    }
  });

  // Format date for display
  const formatDate = (date: Date) => {
    return format(new Date(date), "yyyy/MM/dd");
  };

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">使用履歴</h2>
        
        <div className="relative w-64">
          <Input
            type="text"
            placeholder="検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="text-left text-sm font-medium text-neutral-600">
                <TableHead className="px-4 py-3 whitespace-nowrap">材質</TableHead>
                <TableHead className="px-4 py-3 whitespace-nowrap">板厚</TableHead>
                <TableHead className="px-4 py-3 whitespace-nowrap">サイズ</TableHead>
                <TableHead className="px-4 py-3 whitespace-nowrap">枚数</TableHead>
                <TableHead className="px-4 py-3 whitespace-nowrap">使用日</TableHead>
                <TableHead className="px-4 py-3 whitespace-nowrap">備考</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-neutral-200">
              {history?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-neutral-500">
                    使用履歴はありません
                  </TableCell>
                </TableRow>
              ) : (
                history?.map((item) => (
                  <TableRow key={item.id} className="text-sm text-neutral-800 hover:bg-neutral-50">
                    <TableCell className="px-4 py-3 whitespace-nowrap">
                      <MaterialBadge materialType={item.materialType} />
                    </TableCell>
                    <TableCell className="px-4 py-3 whitespace-nowrap">{item.thickness}</TableCell>
                    <TableCell className="px-4 py-3 whitespace-nowrap">{item.widthMm}×{item.heightMm}</TableCell>
                    <TableCell className="px-4 py-3 whitespace-nowrap">{item.quantity}枚</TableCell>
                    <TableCell className="px-4 py-3 whitespace-nowrap">{formatDate(item.usedAt)}</TableCell>
                    <TableCell className="px-4 py-3 whitespace-nowrap">
                      {item.purpose || (item.notes ? item.notes : "-")}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination */}
        <div className="px-4 py-3 flex items-center justify-between border-t border-neutral-200">
          <div className="text-sm text-neutral-600">
            表示: {history ? `1-${history.length} / ${history.length}件` : "0件"}
          </div>
          <div className="flex items-center space-x-2">
            <button className="px-3 py-1 text-sm rounded border border-neutral-300 bg-white text-neutral-500 cursor-not-allowed">前へ</button>
            <button className="px-3 py-1 text-sm rounded border border-primary bg-primary text-white">1</button>
            <button className="px-3 py-1 text-sm rounded border border-neutral-300 bg-white text-neutral-500 cursor-not-allowed">次へ</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default History;
