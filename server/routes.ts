import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertMaterialSchema, 
  insertUsageHistorySchema,
  materialTypeSchema,
  insertMaterialTypeSchema
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all materials
  app.get("/api/materials", async (req: Request, res: Response) => {
    try {
      const query = req.query.q as string || "";
      const materialType = req.query.type as string || "all";
      const showHidden = req.query.showHidden === "true";
      const minWidth = req.query.minWidth as string || "";
      const minHeight = req.query.minHeight as string || "";
      
      let materials = await storage.searchMaterials(query, materialType, showHidden);
      
      // 板厚による絞り込み（完全一致）
      const thickness = req.query.thickness as string || "";
      if (thickness) {
        materials = materials.filter(material => {
          return material.thickness === thickness;
        });
      }
      
      // 幅による絞り込み（幅のみ）
      if (minWidth) {
        const minWidthVal = parseInt(minWidth);
        if (!isNaN(minWidthVal)) {
          materials = materials.filter(material => {
            // 幅が指定サイズ以上
            return material.widthMm >= minWidthVal;
          });
        }
      }
      
      // 高さによる絞り込み（高さのみ）
      if (minHeight) {
        const minHeightVal = parseInt(minHeight);
        if (!isNaN(minHeightVal)) {
          materials = materials.filter(material => {
            // 高さが指定サイズ以上
            return material.heightMm >= minHeightVal;
          });
        }
      }
      
      // 幅の大きい順、幅が同じなら高さの大きい順に並べ替え
      materials.sort((a, b) => {
        // まず幅で比較
        if (a.widthMm !== b.widthMm) {
          return b.widthMm - a.widthMm; // 降順（大きい順）
        }
        // 幅が同じなら高さで比較
        return b.heightMm - a.heightMm; // 降順（大きい順）
      });
      
      res.json(materials);
    } catch (error) {
      console.error("Error fetching materials:", error);
      res.status(500).json({ message: "Failed to fetch materials" });
    }
  });

  // Get material by ID
  app.get("/api/materials/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid material ID" });
      }

      const material = await storage.getMaterial(id);
      if (!material) {
        return res.status(404).json({ message: "Material not found" });
      }

      res.json(material);
    } catch (error) {
      console.error("Error fetching material:", error);
      res.status(500).json({ message: "Failed to fetch material" });
    }
  });

  // Create a new material
  app.post("/api/materials", async (req: Request, res: Response) => {
    try {
      const materialData = insertMaterialSchema.parse(req.body);
      
      // 重複チェック
      const allMaterials = await storage.getMaterials();
      const duplicateMaterial = allMaterials.find(material => 
        material.materialType === materialData.materialType &&
        material.thickness === materialData.thickness &&
        material.widthMm === materialData.widthMm &&
        material.heightMm === materialData.heightMm &&
        !material.hidden
      );
      
      // 重複があれば409エラーを返す
      if (duplicateMaterial) {
        return res.status(409).json({
          message: "同じ材質・板厚・サイズの組み合わせを持つ材料が既に存在します"
        });
      }

      const material = await storage.createMaterial(materialData);
      res.status(201).json(material);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid material data", 
          errors: error.errors 
        });
      }
      
      // その他のエラー
      console.error("Error creating material:", error);
      res.status(500).json({ message: "Failed to create material" });
    }
  });

  // Update material
  app.patch("/api/materials/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid material ID" });
      }

      // Validate partial update data
      const partialSchema = insertMaterialSchema.partial();
      const updateData = partialSchema.parse(req.body);

      const updatedMaterial = await storage.updateMaterial(id, updateData);
      if (!updatedMaterial) {
        return res.status(404).json({ message: "Material not found" });
      }

      res.json(updatedMaterial);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid material data", 
          errors: error.errors 
        });
      }
      console.error("Error updating material:", error);
      res.status(500).json({ message: "Failed to update material" });
    }
  });

  // Delete material
  app.delete("/api/materials/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid material ID" });
      }

      const success = await storage.deleteMaterial(id);
      if (!success) {
        return res.status(404).json({ message: "Material not found" });
      }

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting material:", error);
      res.status(500).json({ message: "Failed to delete material" });
    }
  });

  // Get usage history
  app.get("/api/usage-history", async (req: Request, res: Response) => {
    try {
      const query = req.query.q as string | undefined;
      const history = await storage.getUsageHistory(query);
      res.json(history);
    } catch (error) {
      console.error("Error fetching usage history:", error);
      res.status(500).json({ message: "Failed to fetch usage history" });
    }
  });

  // Record material usage
  app.post("/api/usage-history", async (req: Request, res: Response) => {
    try {
      const usageData = insertUsageHistorySchema.parse(req.body);
      
      // Get material data to ensure it exists
      const material = await storage.getMaterial(usageData.materialId);
      if (!material) {
        return res.status(404).json({ message: "Material not found" });
      }

      // 在庫調整の場合はチェックをスキップ
      if (!usageData.purpose?.includes("在庫調整") && material.quantity < usageData.quantity) {
        return res.status(400).json({ 
          message: "Insufficient quantity available" 
        });
      }

      const usageRecord = await storage.createUsageHistory(usageData);
      res.status(201).json(usageRecord);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid usage data", 
          errors: error.errors 
        });
      }
      console.error("Error recording material usage:", error);
      res.status(500).json({ message: "Failed to record usage" });
    }
  });

  // Get material statistics
  app.get("/api/stats", async (req: Request, res: Response) => {
    try {
      const stats = await storage.getMaterialStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching material stats:", error);
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });
  
  // 材質タイプのAPI
  
  // すべての材質タイプを取得
  app.get("/api/material-types", async (req: Request, res: Response) => {
    try {
      const materialTypes = await storage.getMaterialTypes();
      res.json(materialTypes);
    } catch (error) {
      console.error("Error fetching material types:", error);
      res.status(500).json({ message: "材質タイプの取得に失敗しました" });
    }
  });
  
  // 材質タイプをIDで取得
  app.get("/api/material-types/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "無効な材質タイプIDです" });
      }
      
      const materialType = await storage.getMaterialType(id);
      if (!materialType) {
        return res.status(404).json({ message: "材質タイプが見つかりません" });
      }
      
      res.json(materialType);
    } catch (error) {
      console.error("Error fetching material type:", error);
      res.status(500).json({ message: "材質タイプの取得に失敗しました" });
    }
  });
  
  // 新しい材質タイプを作成
  app.post("/api/material-types", async (req: Request, res: Response) => {
    try {
      const materialTypeData = insertMaterialTypeSchema.parse(req.body);
      
      // 同じ色の材質タイプが既に存在するかチェック
      const existingTypes = await storage.getMaterialTypes();
      const colorExists = existingTypes.some(type => type.color.toLowerCase() === materialTypeData.color.toLowerCase());
      
      if (colorExists) {
        return res.status(400).json({ message: "この色は既に別の材質タイプで使用されています。別の色を選択してください。", error: "color_already_exists" });
      }
      
      const materialType = await storage.createMaterialType(materialTypeData);
      res.status(201).json(materialType);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "無効な材質タイプデータです",
          errors: error.errors
        });
      }
      console.error("Error creating material type:", error);
      res.status(500).json({ message: "材質タイプの作成に失敗しました" });
    }
  });
  
  // 材質タイプを更新
  app.patch("/api/material-types/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "無効な材質タイプIDです" });
      }
      
      // 部分更新のスキーマを適用
      const partialSchema = insertMaterialTypeSchema.partial();
      const updateData = partialSchema.parse(req.body);
      
      // 色の更新がある場合は重複チェック
      if (updateData.color) {
        const existingTypes = await storage.getMaterialTypes();
        const colorExists = existingTypes.some(type => 
          type.id !== id && // 自分自身は除外
          type.color.toLowerCase() === updateData.color.toLowerCase()
        );
        
        if (colorExists) {
          return res.status(400).json({ message: "この色は既に別の材質タイプで使用されています。別の色を選択してください。", error: "color_already_exists" });
        }
      }
      
      const updatedMaterialType = await storage.updateMaterialType(id, updateData);
      if (!updatedMaterialType) {
        return res.status(404).json({ message: "材質タイプが見つかりません" });
      }
      
      res.json(updatedMaterialType);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "無効な材質タイプデータです",
          errors: error.errors
        });
      }
      console.error("Error updating material type:", error);
      res.status(500).json({ message: "材質タイプの更新に失敗しました" });
    }
  });
  
   // 材質タイプを削除
  app.delete("/api/material-types/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "無効な材質タイプIDです" });
      }
      
      const success = await storage.deleteMaterialType(id);
      if (!success) {
        return res.status(400).json({ 
          message: "材質タイプの削除に失敗しました。使用中の材質タイプは削除できません。" 
        });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting material type:", error);
      res.status(500).json({ message: "材質タイプの削除に失敗しました" });
    }
  });

  // クライアントサイドのルーティングをサポートするための設定
  const path = require('path');
  app.get('*', (req, res) => {
    // APIのパスでなければindex.htmlを返す
    if (!req.path.startsWith('/api/')) {
      res.sendFile(path.join(__dirname, '../client/dist/index.html'));
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
