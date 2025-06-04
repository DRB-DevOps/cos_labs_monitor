export interface Cost {
  id: number;
  lab_id: number;
  lab_name?: string;
  project_id?: number;
  project_name?: string;
  cost_date: string;
  amount: number;
  cost_type: 'actual' | 'budget';
  category?: string;
  description?: string;
}

export interface CostInput {
  lab_id: number;
  project_id?: number;
  cost_date: string;
  amount: number;
  cost_type: 'actual' | 'budget';
  category?: string;
  description?: string;
} 