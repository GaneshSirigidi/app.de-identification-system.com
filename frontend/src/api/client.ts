import axios from 'axios'
import { DeidentifyResponse, DashboardStats } from '../types'

const api = axios.create({
  baseURL: '/api',
  timeout: 120_000, // 2 min — LLM calls can be slow
})

export async function deidentifyFile(file: File): Promise<DeidentifyResponse> {
  const formData = new FormData()
  formData.append('file', file)
  const { data } = await api.post<DeidentifyResponse>('/deidentify', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export async function deidentifyText(
  text: string,
  fileName = 'pasted-text.txt',
): Promise<DeidentifyResponse> {
  const { data } = await api.post<DeidentifyResponse>('/deidentify', { text, fileName })
  return data
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const { data } = await api.get<DashboardStats>('/dashboard')
  return data
}
