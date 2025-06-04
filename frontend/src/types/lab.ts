export interface Lab {
  id: number;
  code: string;
  name: string;
  description?: string;
  created_at?: string;
  is_active?: boolean;
}

export interface LabInput {
  code: string;
  name: string;
  description?: string;
} 