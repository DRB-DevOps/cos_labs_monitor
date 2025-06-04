export interface LabStat {
  total_hours: number;
  participant_count: number;
  total_cost: number;
}

export interface LabConnection {
  supporting_lab: string;
  supported_lab: string;
  total_hours: number;
  last_activity_date: string;
} 