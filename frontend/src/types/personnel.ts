import { Lab } from './lab';

export interface Personnel {
  id: number;
  employee_id: string;
  name: string;
  email: string;
  ms_teams_id?: string;
  department?: string;
  position?: string;
  is_active?: boolean;
  labs?: Lab[];
}

export interface PersonnelInput {
  employee_id: string;
  name: string;
  email: string;
  ms_teams_id?: string;
  department?: string;
  position?: string;
  lab_ids: number[];
} 