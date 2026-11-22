import axios from 'axios';
import { AnalysisResult, CompareResult, Policy } from '../types';

const api = axios.create({ baseURL: '/api' });

export async function runDemo(policyId = 'enterprise-safe'): Promise<AnalysisResult> {
  const { data } = await api.post('/analyze/demo', { policyId });
  return data;
}

export async function analyzeFile(
  file: File,
  projectName: string,
  policyId: string
): Promise<AnalysisResult> {
  const form = new FormData();
  form.append('file', file);
  form.append('projectName', projectName);
  form.append('policyId', policyId);
  const { data } = await api.post('/analyze', form);
  return data;
}

export async function compareFiles(
  file1: File,
  file2: File,
  projectName: string,
  policyId: string
): Promise<CompareResult> {
  const form = new FormData();
  form.append('file1', file1);
  form.append('file2', file2);
  form.append('project_name', projectName);
  form.append('policy_id', policyId);
  const { data } = await api.post('/analyze/compare', form);
  return data;
}

export async function getAnalysis(id: string): Promise<AnalysisResult> {
  const { data } = await api.get(`/analyze/${id}`);
  return data;
}

export async function getHistory(): Promise<Omit<AnalysisResult, 'dependencies'>[]> {
  const { data } = await api.get('/history');
  return data;
}

export async function getPolicies(): Promise<Policy[]> {
  const { data } = await api.get('/policies');
  return data;
}

export function getExportCsvUrl(id: string): string {
  return `/api/analyze/${id}/export/csv`;
}
