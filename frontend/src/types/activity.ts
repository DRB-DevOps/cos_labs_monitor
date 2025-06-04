export interface Activity {
  id: number;
  personnel_name: string;
  lab_name: string;
  project_name: string;
  activity_date: string;
  hours: number;
  activity_type: string;
  supported_lab_name?: string;
  description?: string;
  personnel_id: number;
  lab_id: number;
  project_id?: number;
}

export interface ActivityInput {
  personnel_id: number;
  lab_id: number;
  project_id?: number;
  activity_date: string;
  hours: number;
  activity_type: string;
  supported_lab_id?: number;
  description?: string;
} 