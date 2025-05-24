import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    try {
      // レスポンスをクローンして、元のレスポンスを変更せずに使用
      const clonedRes = res.clone();
      const data = await clonedRes.json();
      const error: any = new Error(data.message || res.statusText);
      error.response = { data, status: res.status };
      throw error;
    } catch (error: any) {
      if (error.response) throw error;
      try {
        // エラー処理中に元のレスポンスが既に読み込まれている可能性があるため、再度クローン
        const clonedRes = res.clone();
        const text = await clonedRes.text();
        const newError: any = new Error(`${res.status}: ${text || res.statusText}`);
        newError.response = { status: res.status };
        throw newError;
      } catch (e) {
        // レスポンスが既に読み込まれている場合のフォールバック
        const newError: any = new Error(`${res.status}: ${res.statusText}`);
        newError.response = { status: res.status };
        throw newError;
      }
    }
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // API URLの設定（本番環境では絶対パスを使用）
  const API_BASE_URL = window.location.hostname.includes('localhost') || window.location.hostname.includes('replit')
    ? '' // 開発環境では相対パス
    : window.location.origin; // 本番環境では現在のオリジンを使用
  
  // URLの先頭にベースURLを追加
  const fullUrl = url.startsWith('/') ? `${API_BASE_URL}${url}` : url;
  
  const res = await fetch(fullUrl, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // API URLの設定（本番環境では絶対パスを使用）
    const API_BASE_URL = window.location.hostname.includes('localhost') || window.location.hostname.includes('replit')
      ? '' // 開発環境では相対パス
      : window.location.origin; // 本番環境では現在のオリジンを使用
    
    const urlKey = queryKey[0] as string;
    const fullUrl = urlKey.startsWith('/') ? `${API_BASE_URL}${urlKey}` : urlKey;
    
    const res = await fetch(fullUrl, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    try {
      return await res.json();
    } catch (error) {
      console.error("Error parsing JSON response:", error);
      return null;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
