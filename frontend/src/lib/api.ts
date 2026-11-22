import axios from 'axios';
import { AnalysisResult, Policy } from '../types';

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
