import axios from 'axios';
import { DashboardData } from '../types/dashboard';
import { Lab, LabInput } from '../types/lab';
import { Project, ProjectInput } from '../types/project';
import { Personnel, PersonnelInput } from '../types/personnel';
import { Activity, ActivityInput } from '../types/activity';
import { LabStat, LabConnection } from '../types/analytics';
import { Cost, CostInput } from '../types/cost';

const API_BASE = 'http://localhost:5000/api';

export async function fetchDashboardData(): Promise<DashboardData> {
  const res = await axios.get(`${API_BASE}/dashboard`);
  return res.data;
}

// 랩
export async function fetchLabs(): Promise<Lab[]> {
  const res = await axios.get(`${API_BASE}/labs`);
  return res.data;
}
export async function createLab(data: LabInput): Promise<Lab> {
  const res = await axios.post(`${API_BASE}/labs`, data);
  return res.data;
}
export async function updateLab(id: number, data: LabInput): Promise<Lab> {
  const res = await axios.put(`${API_BASE}/labs/${id}`, data);
  return res.data;
}
export async function deleteLab(id: number): Promise<void> {
  await axios.delete(`${API_BASE}/labs/${id}`);
}

// 프로젝트
export async function fetchProjects(): Promise<Project[]> {
  const res = await axios.get(`${API_BASE}/projects`);
  return res.data;
}
export async function createProject(data: ProjectInput): Promise<Project> {
  const res = await axios.post(`${API_BASE}/projects`, data);
  return res.data;
}
export async function updateProject(id: number, data: ProjectInput): Promise<Project> {
  const res = await axios.put(`${API_BASE}/projects/${id}`, data);
  return res.data;
}
export async function deleteProject(id: number): Promise<void> {
  await axios.delete(`${API_BASE}/projects/${id}`);
}

// 인적자원
export async function fetchPersonnel(): Promise<Personnel[]> {
  const res = await axios.get(`${API_BASE}/personnel`);
  return res.data;
}
export async function createPersonnel(data: PersonnelInput): Promise<Personnel> {
  const res = await axios.post(`${API_BASE}/personnel`, data);
  return res.data;
}
export async function updatePersonnel(id: number, data: PersonnelInput): Promise<Personnel> {
  const res = await axios.put(`${API_BASE}/personnel/${id}`, data);
  return res.data;
}
export async function deletePersonnel(id: number): Promise<void> {
  await axios.delete(`${API_BASE}/personnel/${id}`);
}

// 활동
export async function fetchActivities(): Promise<Activity[]> {
  const res = await axios.get(`${API_BASE}/activities`);
  return res.data;
}
export async function createActivity(data: ActivityInput): Promise<Activity> {
  const res = await axios.post(`${API_BASE}/activities`, data);
  return res.data;
}
export async function updateActivity(id: number, data: ActivityInput): Promise<Activity> {
  const res = await axios.put(`${API_BASE}/activities/${id}`, data);
  return res.data;
}
export async function deleteActivity(id: number): Promise<void> {
  await axios.delete(`${API_BASE}/activities/${id}`);
}

export async function fetchLabStats(lab_id: number, params?: {start_date?: string, end_date?: string}): Promise<LabStat> {
  const res = await axios.get(`${API_BASE}/labs/${lab_id}/stats`, { params });
  return res.data;
}

export async function fetchLabConnections(): Promise<LabConnection[]> {
  const res = await axios.get(`${API_BASE}/lab-connections`);
  return res.data;
}

export async function fetchCosts(): Promise<Cost[]> {
  const res = await axios.get(`${API_BASE}/costs`);
  return res.data;
}
export async function createCost(data: CostInput): Promise<Cost> {
  const res = await axios.post(`${API_BASE}/costs`, data);
  return res.data;
}
export async function updateCost(id: number, data: CostInput): Promise<Cost> {
  const res = await axios.put(`${API_BASE}/costs/${id}`, data);
  return res.data;
}
export async function deleteCost(id: number): Promise<void> {
  await axios.delete(`${API_BASE}/costs/${id}`);
} 