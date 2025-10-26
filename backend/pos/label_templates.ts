import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import type { AuthData } from "../auth/auth";
import { posDB } from "./db";

interface TemplateElement {
  id: string;
  type: 'text' | 'image' | 'line' | 'rectangle' | 'background' | 'barcode' | 'attribute';
  x: number;
  y: number;
  width?: number;
  height?: number;
  content?: string;
  fontSize?: number;
  attribute?: string;
}

export interface LabelTemplate {
  id: string;
  name: string;
  width: number;
  height: number;
  type: 'predefined' | 'custom';
  elements?: TemplateElement[];
}

export interface CreateTemplateRequest {
  name: string;
  width: number;
  height: number;
  elements: TemplateElement[];
}

export interface UpdateTemplateRequest {
  id: string;
  name: string;
  width: number;
  height: number;
  elements: TemplateElement[];
}

export interface TemplateResponse {
  template: LabelTemplate;
  success: boolean;
}

export interface TemplatesListResponse {
  templates: LabelTemplate[];
  success: boolean;
}

export const createTemplate = api<CreateTemplateRequest, TemplateResponse>(
  { auth: true, expose: true, method: "POST", path: "/pos/label-templates" },
  async (req) => {
    const auth = getAuthData()! as AuthData;
    
    const templateId = `custom-${Date.now()}`;
    const elementsJson = JSON.stringify(req.elements);

    await posDB.exec`
      INSERT INTO label_templates (id, name, width, height, elements, client_id)
      VALUES (${templateId}, ${req.name}, ${req.width}, ${req.height}, ${elementsJson}, ${auth.clientID})
    `;

    return {
      template: {
        id: templateId,
        name: req.name,
        width: req.width,
        height: req.height,
        type: 'custom',
        elements: req.elements,
      },
      success: true,
    };
  }
);

export const updateTemplate = api<UpdateTemplateRequest, TemplateResponse>(
  { auth: true, expose: true, method: "PUT", path: "/pos/label-templates/:id" },
  async (req) => {
    const auth = getAuthData()! as AuthData;
    
    const elementsJson = JSON.stringify(req.elements);

    await posDB.exec`
      UPDATE label_templates
      SET name = ${req.name}, width = ${req.width}, height = ${req.height}, elements = ${elementsJson}
      WHERE id = ${req.id} AND client_id = ${auth.clientID}
    `;

    return {
      template: {
        id: req.id,
        name: req.name,
        width: req.width,
        height: req.height,
        type: 'custom',
        elements: req.elements,
      },
      success: true,
    };
  }
);

export const listTemplates = api<{}, TemplatesListResponse>(
  { auth: true, expose: true, method: "GET", path: "/pos/label-templates" },
  async () => {
    const auth = getAuthData()! as AuthData;
    
    const templates = await posDB.queryAll<{
      id: string;
      name: string;
      width: number;
      height: number;
      elements: string;
    }>`
      SELECT id, name, width, height, elements
      FROM label_templates
      WHERE client_id = ${auth.clientID}
      ORDER BY created_at DESC
    `;

    return {
      templates: templates.map(t => ({
        id: t.id,
        name: t.name,
        width: t.width,
        height: t.height,
        type: 'custom' as const,
        elements: JSON.parse(t.elements),
      })),
      success: true,
    };
  }
);

export const deleteTemplate = api<{ id: string }, { success: boolean }>(
  { auth: true, expose: true, method: "DELETE", path: "/pos/label-templates/:id" },
  async (req) => {
    const auth = getAuthData()! as AuthData;
    
    await posDB.exec`
      DELETE FROM label_templates
      WHERE id = ${req.id} AND client_id = ${auth.clientID}
    `;

    return { success: true };
  }
);
