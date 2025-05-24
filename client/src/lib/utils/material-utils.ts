import { MaterialType } from "@shared/schema";

/**
 * Gets the display name for a material type
 */
export function getMaterialDisplayName(type: string): string {
  return type;
}

/**
 * Gets the color class for a material type
 */
export function getMaterialColorClass(type: string): string {
  switch (type) {
    case MaterialType.SPC:
      return "bg-[#9C27B0]";
    case MaterialType.SECC:
      return "bg-[#FF9800]";
    case MaterialType.SUS:
      return "bg-[#607D8B]";
    case MaterialType.SUS_MIGAKI:
      return "bg-[#00BCD4]";
    case MaterialType.SUS_HL:
      return "bg-[#3F51B5]";
    case MaterialType.A5052:
      return "bg-[#795548]";
    default:
      return "bg-gray-500";
  }
}

/**
 * Formats size for display (width × height)
 */
export function formatSize(widthMm: number, heightMm: number): string {
  return `${widthMm}×${heightMm}`;
}

/**
 * Formats quantities for display
 */
export function formatQuantity(quantity: number): string {
  return `${quantity}枚`;
}
