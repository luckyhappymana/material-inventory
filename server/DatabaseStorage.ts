import { 
  Material, 
  MaterialType, 
  InsertMaterial, 
  InsertMaterialType,
  DefaultMaterialTypes
} from "@shared/schema";
import { IStorage } from "./storage";
import { db } from "./db";
import { materials, materialTypes } from "@shared/schema";
import { eq, or, and, not, like, asc } from "drizzle-orm";

export class DatabaseStorage implements IStorage {
  // 材料関連の操作
  async getMaterials(showHidden: boolean = false): Promise<Material[]> {
    if (showHidden) {
      return db.select().from(materials).orderBy(asc(materials.id));
    } else {
      return db.select()
        .from(materials)
        .where(eq(materials.hidden, false))
        .orderBy(asc(materials.id));
    }
  }

  async getMaterial(id: number): Promise<Material | undefined> {
    const [material] = await db.select()
      .from(materials)
      .where(eq(materials.id, id));
    return material;
  }

  async createMaterial(material: InsertMaterial): Promise<Material> {
    // 同じ材質・板厚・サイズの組み合わせを持つ材料が既に存在するか確認
    const [existingMaterial] = await db.select()
      .from(materials)
      .where(
        and(
          eq(materials.materialType, material.materialType),
          eq(materials.thickness, material.thickness),
          eq(materials.widthMm, material.widthMm),
          eq(materials.heightMm, material.heightMm),
          eq(materials.hidden, false)
        )
      );

    if (existingMaterial) {
      throw new Error("同じ材質・板厚・サイズの組み合わせを持つ材料が既に存在します");
    }

    // 材料を作成
    const [newMaterial] = await db.insert(materials)
      .values(material)
      .returning();
    return newMaterial;
  }

  async updateMaterial(id: number, updates: Partial<InsertMaterial>): Promise<Material | undefined> {
    const [material] = await db.select()
      .from(materials)
      .where(eq(materials.id, id));

    if (!material) {
      return undefined;
    }

    // 更新後のデータが重複するか確認（自分自身は除外）
    if (updates.materialType || updates.thickness || updates.widthMm || updates.heightMm) {
      const [existingMaterial] = await db.select()
        .from(materials)
        .where(
          and(
            eq(materials.materialType, updates.materialType || material.materialType),
            eq(materials.thickness, updates.thickness || material.thickness),
            eq(materials.widthMm, updates.widthMm !== undefined ? updates.widthMm : material.widthMm),
            eq(materials.heightMm, updates.heightMm !== undefined ? updates.heightMm : material.heightMm),
            eq(materials.hidden, false),
            not(eq(materials.id, id))
          )
        );

      if (existingMaterial) {
        throw new Error("同じ材質・板厚・サイズの組み合わせを持つ材料が既に存在します");
      }
    }

    const [updatedMaterial] = await db.update(materials)
      .set(updates)
      .where(eq(materials.id, id))
      .returning();
    return updatedMaterial;
  }

  async deleteMaterial(id: number): Promise<boolean> {
    const [deletedMaterial] = await db.delete(materials)
      .where(eq(materials.id, id))
      .returning({ id: materials.id });
    return !!deletedMaterial;
  }

  async searchMaterials(query: string, materialType?: string, showHidden: boolean = false): Promise<Material[]> {
    let conditions = [];

    // 検索クエリの条件
    if (query) {
      conditions.push(
        or(
          like(materials.materialType, `%${query}%`),
          like(materials.thickness, `%${query}%`),
          like(materials.notes, `%${query}%`)
        )
      );
    }

    // 材質タイプの条件
    if (materialType && materialType !== "all") {
      conditions.push(eq(materials.materialType, materialType));
    }

    // 非表示の条件
    if (!showHidden) {
      conditions.push(eq(materials.hidden, false));
    }

    // 条件が何もなければ全件取得
    if (conditions.length === 0) {
      return this.getMaterials(showHidden);
    }

    // AND条件で結合
    const whereCondition = conditions.reduce((acc, condition) => {
      return acc ? and(acc, condition) : condition;
    });

    return db.select()
      .from(materials)
      .where(whereCondition)
      .orderBy(asc(materials.id));
  }

  async toggleHiddenStatus(id: number): Promise<Material | undefined> {
    const [material] = await db.select()
      .from(materials)
      .where(eq(materials.id, id));

    if (!material) {
      return undefined;
    }

    const [updatedMaterial] = await db.update(materials)
      .set({ hidden: !material.hidden })
      .where(eq(materials.id, id))
      .returning();
    return updatedMaterial;
  }

  // 材質タイプ関連の操作
  async getMaterialTypes(): Promise<MaterialType[]> {
    return db.select().from(materialTypes).orderBy(asc(materialTypes.id));
  }

  async getMaterialType(id: number): Promise<MaterialType | undefined> {
    const [materialType] = await db.select()
      .from(materialTypes)
      .where(eq(materialTypes.id, id));
    return materialType;
  }

  async getMaterialTypeByName(name: string): Promise<MaterialType | undefined> {
    const [materialType] = await db.select()
      .from(materialTypes)
      .where(eq(materialTypes.name, name));
    return materialType;
  }

  async createMaterialType(materialType: InsertMaterialType): Promise<MaterialType> {
    // デフォルトの材質タイプと同じ名前は許可しない
    const defaultTypeNames = Object.values(DefaultMaterialTypes);
    if (defaultTypeNames.includes(materialType.name as any)) {
      throw new Error(`「${materialType.name}」はデフォルトの材質タイプのため、登録できません`);
    }

    // 同じ名前の材質タイプが既に存在するか確認
    const existingType = await this.getMaterialTypeByName(materialType.name);
    if (existingType) {
      throw new Error(`「${materialType.name}」は既に登録されています`);
    }

    const [newMaterialType] = await db.insert(materialTypes)
      .values(materialType)
      .returning();
    return newMaterialType;
  }

  async updateMaterialType(id: number, updates: Partial<InsertMaterialType>): Promise<MaterialType | undefined> {
    const materialType = await this.getMaterialType(id);
    if (!materialType) {
      return undefined;
    }

    // 名前を変更する場合、デフォルトの材質タイプと同じ名前は許可しない
    if (updates.name) {
      const defaultTypeNames = Object.values(DefaultMaterialTypes);
      if (defaultTypeNames.includes(updates.name as any)) {
        throw new Error(`「${updates.name}」はデフォルトの材質タイプのため、使用できません`);
      }

      // 同じ名前の材質タイプが既に存在するか確認
      const existingType = await this.getMaterialTypeByName(updates.name);
      if (existingType && existingType.id !== id) {
        throw new Error(`「${updates.name}」は既に登録されています`);
      }
    }

    const [updatedMaterialType] = await db.update(materialTypes)
      .set(updates)
      .where(eq(materialTypes.id, id))
      .returning();
    return updatedMaterialType;
  }

 async deleteMaterialType(id: number): Promise<boolean> {
  // この材質タイプを使用している材料がないか確認
  const [material] = await db.select()
    .from(materials)
    .where(eq(materials.materialType, (await this.getMaterialType(id))?.name || ""));
  if (material) {
    throw new Error("この材質タイプは使用中のため削除できません");
  }
  const [deletedType] = await db.delete(materialTypes)
    .where(eq(materialTypes.id, id))
    .returning({ id: materialTypes.id });
  return !!deletedType;
}
// デフォルトの材質タイプを初期化
async initializeDefaultMaterialTypes() {
  try {
    // まずテーブルが存在するか確認
    try {
      await db.query.materialTypes.findFirst();
    } catch (error) {
      // テーブルが存在しない場合は何もせずに終了
      console.log("material_typesテーブルがまだ存在しないため、初期化をスキップします");
      return;
    }
    
    // デフォルトの材質タイプがあるか確認
    const defaultTypes = [
      { name: "SPC", color: "#9E9E9E" },
      { name: "SECC", color: "#2196F3" },
      { name: "SUS", color: "#673AB7" },
      { name: "SUS-MIGAKI", color: "#FF9800" },
      { name: "SUS-HL", color: "#795548" },
      { name: "A5052", color: "#607D8B" },
    ];
    
    for (const type of defaultTypes) {
      try {
        const existingType = await this.getMaterialTypeByName(type.name);
        if (!existingType) {
          await db.insert(materialTypes).values(type);
        }
      } catch (error) {
        console.error(`材質タイプ「${type.name}」の追加中にエラーが発生しました:`, error);
      }
    }
  } catch (error) {
    console.error("デフォルト材質タイプの初期化中にエラーが発生しました:", error);
  }
}
}  
