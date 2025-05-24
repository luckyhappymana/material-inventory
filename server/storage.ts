import { 
  materials, Material, InsertMaterial, 
  materialTypes, MaterialType, InsertMaterialType,
  DefaultMaterialTypes
} from "@shared/schema";

export interface IStorage {
  // Material operations
  getMaterials(showHidden?: boolean): Promise<Material[]>;
  getMaterial(id: number): Promise<Material | undefined>;
  createMaterial(material: InsertMaterial): Promise<Material>;
  updateMaterial(id: number, material: Partial<InsertMaterial>): Promise<Material | undefined>;
  deleteMaterial(id: number): Promise<boolean>;
  searchMaterials(query: string, materialType?: string, showHidden?: boolean): Promise<Material[]>;
  toggleHiddenStatus(id: number): Promise<Material | undefined>;

  // Material type operations
  getMaterialTypes(): Promise<MaterialType[]>;
  getMaterialType(id: number): Promise<MaterialType | undefined>;
  getMaterialTypeByName(name: string): Promise<MaterialType | undefined>;
  createMaterialType(materialType: InsertMaterialType): Promise<MaterialType>;
  updateMaterialType(id: number, materialType: Partial<InsertMaterialType>): Promise<MaterialType | undefined>;
  deleteMaterialType(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private materials: Map<number, Material>;
  private materialTypes: Map<number, MaterialType>;
  private materialCurrentId: number;
  private materialTypeCurrentId: number;
  private recentActivities: Array<{
    action: string;
    materialType: string;
    thickness: string;
    quantity: number;
    timestamp: Date;
  }>;

  constructor() {
    this.materials = new Map();
    this.materialTypes = new Map();
    this.materialCurrentId = 1;
    this.materialTypeCurrentId = 1;
    this.recentActivities = [];

    // デフォルトの材質タイプを初期登録
    this.initDefaultMaterialTypes();
  }

  // デフォルトの材質タイプを初期化
  private async initDefaultMaterialTypes() {
    const defaultTypes = [
      { name: DefaultMaterialTypes.SPC, color: "#9C27B0" },
      { name: DefaultMaterialTypes.SECC, color: "#2196F3" },
      { name: DefaultMaterialTypes.SUS, color: "#607D8B" },
      { name: DefaultMaterialTypes.SUS_MIGAKI, color: "#FF9800" },
      { name: DefaultMaterialTypes.SUS_HL, color: "#795548" },
      { name: DefaultMaterialTypes.A5052, color: "#607D8B" },
    ];

    for (const type of defaultTypes) {
      await this.createMaterialType(type);
    }
  }

  async getMaterials(showHidden: boolean = false): Promise<Material[]> {
    const allMaterials = Array.from(this.materials.values());
    
    // 非表示フラグでフィルタリング
    if (!showHidden) {
      return allMaterials.filter(material => !material.hidden);
    }
    
    return allMaterials;
  }

  async getMaterial(id: number): Promise<Material | undefined> {
    return this.materials.get(id);
  }

  // 指定された材質・板厚・サイズの組み合わせを持つ材料が存在するか確認
  async findDuplicateMaterial(materialType: string, thickness: string, widthMm: number, heightMm: number): Promise<Material | undefined> {
    const allMaterials = Array.from(this.materials.values());
    
    return allMaterials.find(material => 
      material.materialType === materialType &&
      material.thickness === thickness &&
      material.widthMm === widthMm &&
      material.heightMm === heightMm &&
      !material.hidden
    );
  }

  async createMaterial(material: InsertMaterial): Promise<Material> {
    // 同じ材質・板厚・サイズの組み合わせを持つ材料が既に存在するか確認
    const existingMaterial = await this.findDuplicateMaterial(
      material.materialType,
      material.thickness,
      material.widthMm,
      material.heightMm
    );

    // 既に存在する場合はエラーを投げる
    if (existingMaterial) {
      throw new Error("同じ材質・板厚・サイズの組み合わせを持つ材料が既に存在します");
    }

    const id = this.materialCurrentId++;
    const createdAt = new Date();
    const newMaterial: Material = { ...material, id, createdAt, notes: material.notes || null, hidden: false };
    this.materials.set(id, newMaterial);

    // Add to recent activities
    this.addRecentActivity('add', newMaterial.materialType, newMaterial.thickness, newMaterial.quantity);

    return newMaterial;
  }
  
  // 材質タイプ関連のメソッド
  async getMaterialTypes(): Promise<MaterialType[]> {
    return Array.from(this.materialTypes.values());
  }

  async getMaterialType(id: number): Promise<MaterialType | undefined> {
    return this.materialTypes.get(id);
  }

  async getMaterialTypeByName(name: string): Promise<MaterialType | undefined> {
    const materialTypes = Array.from(this.materialTypes.values());
    return materialTypes.find(type => type.name === name);
  }

  async createMaterialType(materialType: InsertMaterialType): Promise<MaterialType> {
    // 同じ名前の材質がすでに存在するか確認
    const existingType = await this.getMaterialTypeByName(materialType.name);
    if (existingType) {
      return existingType;
    }

    const id = this.materialTypeCurrentId++;
    const createdAt = new Date();
    const newMaterialType: MaterialType = { ...materialType, id, createdAt };
    this.materialTypes.set(id, newMaterialType);

    return newMaterialType;
  }

  async updateMaterialType(
    id: number, 
    updates: Partial<InsertMaterialType>
  ): Promise<MaterialType | undefined> {
    const materialType = this.materialTypes.get(id);
    if (!materialType) {
      return undefined;
    }

    const updatedMaterialType: MaterialType = { ...materialType, ...updates };
    this.materialTypes.set(id, updatedMaterialType);

    return updatedMaterialType;
  }

  async deleteMaterialType(id: number): Promise<boolean> {
    const materialType = this.materialTypes.get(id);
    if (!materialType) {
      return false;
    }

    // この材質タイプが使用されているか確認
    const materials = Array.from(this.materials.values());
    const isInUse = materials.some(material => material.materialType === materialType.name);

    if (isInUse) {
      // 使用中の材質タイプは削除できない
      return false;
    }

    this.materialTypes.delete(id);
    return true;
  }

  async updateMaterial(id: number, updates: Partial<InsertMaterial>): Promise<Material | undefined> {
    const material = this.materials.get(id);
    if (!material) {
      return undefined;
    }

    const updatedMaterial: Material = { 
      ...material, 
      ...updates,
      notes: updates.notes !== undefined ? (updates.notes || null) : material.notes 
    };
    this.materials.set(id, updatedMaterial);

    // Add to recent activities
    this.addRecentActivity('update', updatedMaterial.materialType, updatedMaterial.thickness, updatedMaterial.quantity);

    return updatedMaterial;
  }

  async deleteMaterial(id: number): Promise<boolean> {
    const material = this.materials.get(id);
    if (!material) {
      return false;
    }

    this.materials.delete(id);

    // Add to recent activities
    this.addRecentActivity('delete', material.materialType, material.thickness, material.quantity);

    return true;
  }

  async searchMaterials(query: string, materialType?: string, showHidden: boolean = false): Promise<Material[]> {
    const materials = Array.from(this.materials.values());
    
    return materials.filter(material => {
      // 非表示フラグでフィルタリング
      if (!showHidden && material.hidden) {
        return false;
      }
      
      // Filter by material type if specified
      if (materialType && materialType !== 'all' && material.materialType !== materialType) {
        return false;
      }
      
      // Search by query
      if (query) {
        const lowerQuery = query.toLowerCase();
        return (
          material.materialType.toLowerCase().includes(lowerQuery) ||
          material.thickness.toLowerCase().includes(lowerQuery) ||
          `${material.widthMm}×${material.heightMm}`.includes(lowerQuery) ||
          (material.notes && material.notes.toLowerCase().includes(lowerQuery))
        );
      }
      
      return true;
    });
  }

  async getUsageHistory(query?: string): Promise<UsageHistory[]> {
    let history = Array.from(this.usageHistory.values());
    
    // 検索クエリがある場合、フィルタリング
    if (query) {
      const lowerQuery = query.toLowerCase();
      history = history.filter(item => 
        item.materialType.toLowerCase().includes(lowerQuery) ||
        item.thickness.toLowerCase().includes(lowerQuery) ||
        (item.purpose && item.purpose.toLowerCase().includes(lowerQuery)) ||
        (item.notes && item.notes.toLowerCase().includes(lowerQuery))
      );
    }
    
    // 新しい順に並べ替え
    return history.sort((a, b) => b.usedAt.getTime() - a.usedAt.getTime());
  }

  async createUsageHistory(usage: InsertUsageHistory): Promise<UsageHistory> {
    const id = this.usageHistoryCurrentId++;
    const usedAt = new Date();
    const newUsage: UsageHistory = { 
      ...usage, 
      id, 
      usedAt, 
      notes: usage.notes || null,
      purpose: usage.purpose || null 
    };
    this.usageHistory.set(id, newUsage);

    // Update the material's quantity
    const material = this.materials.get(usage.materialId);
    if (material) {
      const updatedQuantity = material.quantity - usage.quantity;
      if (updatedQuantity <= 0) {
        // Remove the material if quantity is zero or less
        this.materials.delete(usage.materialId);
      } else {
        // Update the quantity
        this.materials.set(usage.materialId, {
          ...material,
          quantity: updatedQuantity,
        });
      }

      // Add to recent activities
      this.addRecentActivity('use', material.materialType, material.thickness, usage.quantity);
    }

    return newUsage;
  }

  async getMaterialStats(): Promise<{
    byType: Record<string, number>;
    byThickness: Record<string, number>;
    recentActivity: Array<{
      action: string;
      materialType: string;
      thickness: string;
      quantity: number;
      timestamp: Date;
    }>;
  }> {
    const materials = Array.from(this.materials.values());
    
    // Calculate stats by material type
    const byType: Record<string, number> = {};
    materials.forEach(material => {
      if (byType[material.materialType]) {
        byType[material.materialType] += material.quantity;
      } else {
        byType[material.materialType] = material.quantity;
      }
    });
    
    // Calculate stats by thickness
    const byThickness: Record<string, number> = {};
    materials.forEach(material => {
      if (byThickness[material.thickness]) {
        byThickness[material.thickness] += material.quantity;
      } else {
        byThickness[material.thickness] = material.quantity;
      }
    });
    
    return {
      byType,
      byThickness,
      recentActivity: this.recentActivities.slice(0, 10), // Return only the 10 most recent activities
    };
  }

  private addRecentActivity(
    action: string,
    materialType: string,
    thickness: string,
    quantity: number
  ) {
    this.recentActivities.unshift({
      action,
      materialType,
      thickness,
      quantity,
      timestamp: new Date(),
    });

    // Keep only the 100 most recent activities to prevent memory growth
    if (this.recentActivities.length > 100) {
      this.recentActivities.pop();
    }
  }
}

import { DatabaseStorage } from "./DatabaseStorage";

// データベースストレージを使用
export const storage = new DatabaseStorage();
