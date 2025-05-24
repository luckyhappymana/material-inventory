import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { useMaterialTypes } from "@/hooks/use-material-types";

// 材質タイプごとの標準色（サーバー側の定義と一致させる）
export const DEFAULT_MATERIAL_COLORS = {
  "SPC": "#9C27B0", // パープル
  "SECC": "#2196F3", // ブルー
  "SUS": "#607D8B", // ブルーグレイ
  "SUS-MIGAKI": "#FF9800", // オレンジ
  "SUS-HL": "#795548", // ブラウン
  "A5052": "#607D8B", // ブルーグレイ
};

// 基本スタイル（色なし）
const materialBadgeBaseStyle = "inline-block px-2 py-1 text-xs font-medium text-white rounded-full";

// 定義済み材質のバリアント
const materialBadgeVariants = cva(
  materialBadgeBaseStyle,
  {
    variants: {
      variant: {
        spc: "bg-[#9C27B0]", // Purple
        secc: "bg-[#2196F3]", // Blue
        sus: "bg-[#607D8B]", // Blue Grey
        "sus-migaki": "bg-[#FF9800]", // Orange
        "sus-hl": "bg-[#795548]", // Brown
        a5052: "bg-[#607D8B]", // Blue Grey
      },
    },
    defaultVariants: {
      variant: "spc",
    },
  }
);

export interface MaterialBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof materialBadgeVariants> {
  materialType: string;
}

export function MaterialBadge({
  className,
  variant,
  materialType,
  ...props
}: MaterialBadgeProps) {
  const { materialTypes } = useMaterialTypes();
  const [customColor, setCustomColor] = useState<string | null>(null);

  // 標準材質タイプの判定とバリアント取得
  const getMaterialVariant = (type: string) => {
    type = type.toLowerCase();
    if (type === "spc") return "spc";
    if (type === "secc") return "secc";
    if (type === "sus") return "sus";
    if (type === "sus-migaki") return "sus-migaki";
    if (type === "sus-hl") return "sus-hl";
    if (type === "a5052") return "a5052";
    return null; // 標準材質ではない
  };

  // カスタム材質タイプの色を取得
  useEffect(() => {
    const getCustomColor = () => {
      // 標準材質タイプであれば何もしない
      const standardVariant = getMaterialVariant(materialType);
      if (standardVariant) {
        setCustomColor(null);
        return;
      }

      // カスタム材質タイプの場合、色情報を検索
      if (materialTypes) {
        const customType = materialTypes.find(
          (type) => type.name === materialType
        );
        if (customType) {
          setCustomColor(customType.color);
          return;
        }
      }
      
      // デフォルトカラー（安全策として紫色を使用）
      setCustomColor("#9C27B0");
    };

    getCustomColor();
  }, [materialType, materialTypes]);

  // 標準材質タイプのバリアント
  const badgeVariant = variant || getMaterialVariant(materialType);

  // カスタム材質タイプの場合はインラインスタイルで色を適用
  if (customColor) {
    return (
      <span
        className={cn(materialBadgeBaseStyle, className)}
        style={{ backgroundColor: customColor }}
        {...props}
      >
        {materialType}
      </span>
    );
  }

  // 標準材質タイプの場合はバリアントを使用
  return (
    <span
      className={cn(materialBadgeVariants({ variant: badgeVariant }), className)}
      {...props}
    >
      {materialType}
    </span>
  );
}

export default MaterialBadge;
