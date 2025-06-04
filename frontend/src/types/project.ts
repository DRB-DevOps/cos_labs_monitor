import { Lab } from './lab';

export interface Project {
  id: number;
  code: string;
  name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  status?: string;
  lead_lab?: Lab;
  labs?: Lab[];
}

export interface ProjectInput {
  code: string;
  name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  status?: string;
  lead_lab_id: number;
  lab_ids: number[];
} 