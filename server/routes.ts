import express, { type Express, type Request, type Response } from 'express';
import { createServer, type Server } from 'http';
import { storage } from './storage.js';
import { insertMaterialSchema, insertMaterialTypeSchema, insertUsageHistorySchema } from '../shared/schema.js';

export async function registerRoutes(app: Express): Promise<Server> {
  const server = createServer(app);
  
  // Materials API
  app.get("/api/materials", async (req: Request, res: Response) => {
    try {
      const showHidden = req.query.showHidden === 'true';
      const materials = await storage.getMaterials(showHidden);
      res.json(materials);
    } catch (error) {
      console.error('Error fetching materials:', error);
      res.status(500).json({ error: 'Materials data could not be retrieved' });
    }
  });

  app.get("/api/materials/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const material = await storage.getMaterial(id);
      if (!material) {
        return res.status(404).json({ error: 'Material not found' });
      }
      res.json(material);
    } catch (error) {
      console.error('Error fetching material:', error);
      res.status(500).json({ error: 'Material data could not be retrieved' });
    }
  });

  app.post("/api/materials", async (req: Request, res: Response) => {
    try {
      const validatedData = insertMaterialSchema.parse(req.body);
      const material = await storage.createMaterial(validatedData);
      res.status(201).json(material);
    } catch (error) {
      console.error('Error creating material:', error);
      res.status(400).json({ error: 'Invalid material data' });
    }
  });

  app.patch("/api/materials/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      if (updates.toggleHidden === true) {
        const material = await storage.toggleHiddenStatus(id);
        if (!material) {
          return res.status(404).json({ error: 'Material not found' });
        }
        return res.json(material);
      }

      const material = await storage.updateMaterial(id, updates);
      if (!material) {
        return res.status(404).json({ error: 'Material not found' });
      }
      res.json(material);
    } catch (error) {
      console.error('Error updating material:', error);
      res.status(400).json({ error: 'Invalid update data' });
    }
  });

  app.delete("/api/materials/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteMaterial(id);
      if (!success) {
        return res.status(404).json({ error: 'Material not found' });
      }
      res.status(204).end();
    } catch (error) {
      console.error('Error deleting material:', error);
      res.status(500).json({ error: 'Material could not be deleted' });
    }
  });

  // Usage History API
  app.get("/api/usage-history", async (req: Request, res: Response) => {
    try {
      const query = req.query.q as string | undefined;
      const history = await storage.getUsageHistory(query);
      res.json(history);
    } catch (error) {
      console.error('Error fetching usage history:', error);
      res.status(500).json({ error: 'Usage history could not be retrieved' });
    }
  });

  app.post("/api/usage-history", async (req: Request, res: Response) => {
    try {
      const validatedData = insertUsageHistorySchema.parse(req.body);
      const usage = await storage.createUsageHistory(validatedData);
      res.status(201).json(usage);
    } catch (error) {
      console.error('Error creating usage history:', error);
      res.status(400).json({ error: 'Invalid usage history data' });
    }
  });

  // Statistics API
  app.get("/api/stats", async (req: Request, res: Response) => {
    try {
      const stats = await storage.getMaterialStats();
      res.json(stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
      res.status(500).json({ error: 'Statistics could not be retrieved' });
    }
  });

  // Material Types API
  app.get("/api/material-types", async (req: Request, res: Response) => {
    try {
      const types = await storage.getMaterialTypes();
      res.json(types);
    } catch (error) {
      console.error('Error fetching material types:', error);
      res.status(500).json({ error: 'Material types could not be retrieved' });
    }
  });

  app.get("/api/material-types/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const type = await storage.getMaterialType(id);
      if (!type) {
        return res.status(404).json({ error: 'Material type not found' });
      }
      res.json(type);
    } catch (error) {
      console.error('Error fetching material type:', error);
      res.status(500).json({ error: 'Material type could not be retrieved' });
    }
  });

  app.post("/api/material-types", async (req: Request, res: Response) => {
    try {
      const validatedData = insertMaterialTypeSchema.parse(req.body);
      const type = await storage.createMaterialType(validatedData);
      res.status(201).json(type);
    } catch (error) {
      console.error('Error creating material type:', error);
      res.status(400).json({ error: 'Invalid material type data' });
    }
  });

  app.patch("/api/material-types/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const type = await storage.updateMaterialType(id, updates);
      if (!type) {
        return res.status(404).json({ error: 'Material type not found' });
      }
      res.json(type);
    } catch (error) {
      console.error('Error updating material type:', error);
      res.status(400).json({ error: 'Invalid update data' });
    }
  });

  app.delete("/api/material-types/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteMaterialType(id);
      if (!success) {
        return res.status(404).json({ error: 'Material type not found or in use' });
      }
      res.status(204).end();
    } catch (error) {
      console.error('Error deleting material type:', error);
      res.status(500).json({ error: 'Material type could not be deleted' });
    }
  });

  return server;
}
