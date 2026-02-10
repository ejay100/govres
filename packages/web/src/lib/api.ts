/**
 * GOVRES — API Client
 * Axios-based HTTP client for all GOVRES backend API calls.
 */

import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// Inject JWT token on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('govres_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('govres_token');
      localStorage.removeItem('govres_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ─── Auth ──────────────────────────────────────────────────────

export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  signup: (data: { email: string; fullName: string; phone?: string; role: string; password: string; confirmPassword: string }) =>
    api.post('/auth/signup', data),
  register: (data: any) =>
    api.post('/auth/register', data),
  me: () =>
    api.get('/auth/me'),
};

// ─── Dashboard (Public) ────────────────────────────────────────

export const dashboardAPI = {
  reserves: () => api.get('/dashboard/reserves'),
  gold: () => api.get('/dashboard/gold'),
  cocoa: () => api.get('/dashboard/cocoa'),
  circulation: () => api.get('/dashboard/circulation'),
  metrics: () => api.get('/dashboard/metrics'),
};

// ─── GBDC ──────────────────────────────────────────────────────

export const gbdcAPI = {
  mint: (data: any) => api.post('/gbdc/mint', data),
  transfer: (data: any) => api.post('/gbdc/transfer', data),
  redeem: (data: any) => api.post('/gbdc/redeem', data),
  get: (instrumentId: string) => api.get(`/gbdc/${instrumentId}`),
  circulationSummary: () => api.get('/gbdc/circulation/summary'),
};

// ─── CRDN ──────────────────────────────────────────────────────

export const crdnAPI = {
  issue: (data: any) => api.post('/crdn/issue', data),
  convert: (data: any) => api.post('/crdn/convert', data),
  getByFarmer: (farmerId: string) => api.get(`/crdn/farmer/${farmerId}`),
  getSeason: (year: string) => api.get(`/crdn/season/${year}`),
  get: (instrumentId: string) => api.get(`/crdn/${instrumentId}`),
};

// ─── Settlement ────────────────────────────────────────────────

export const settlementAPI = {
  interbank: (data: any) => api.post('/settlement/interbank', data),
  contractorPayment: (data: any) => api.post('/settlement/contractor-payment', data),
  farmerCashout: (data: any) => api.post('/settlement/farmer-cashout', data),
  bankSummary: (bankId: string) => api.get(`/settlement/bank/${bankId}/summary`),
  get: (settlementId: string) => api.get(`/settlement/${settlementId}`),
};

// ─── Oracle ────────────────────────────────────────────────────

export const oracleAPI = {
  goldVault: (vaultId: string) => api.get(`/oracle/gold/vault/${vaultId}`),
  goldAttestation: (data: any) => api.post('/oracle/gold/attestation', data),
  cocoaWarehouse: (warehouseId: string) => api.get(`/oracle/cocoa/warehouse/${warehouseId}`),
  cocoaDelivery: (data: any) => api.post('/oracle/cocoa/delivery', data),
  goldbodRoyalties: () => api.get('/oracle/goldbod/royalties'),
  productionReport: (data: any) => api.post('/oracle/goldbod/production-report', data),
};

// ─── Projects ──────────────────────────────────────────────────

export const projectAPI = {
  list: (page?: number) => api.get('/projects', { params: { page } }),
  get: (projectId: string) => api.get(`/projects/${projectId}`),
  create: (data: any) => api.post('/projects', data),
  approve: (projectId: string) => api.put(`/projects/${projectId}/approve`),
  disburse: (projectId: string, data: any) => api.post(`/projects/${projectId}/disburse`, data),
};

// ─── Ledger ────────────────────────────────────────────────────

export const ledgerAPI = {
  status: () => api.get('/ledger/status'),
  block: (height: number) => api.get(`/ledger/block/${height}`),
  transaction: (txId: string) => api.get(`/ledger/transaction/${txId}`),
  recentTransactions: (limit?: number) => api.get('/ledger/transactions/recent', { params: { limit } }),
  accountHistory: (accountId: string, page?: number) =>
    api.get(`/ledger/account/${accountId}/history`, { params: { page } }),
  auditTrail: (params?: any) => api.get('/ledger/audit-trail', { params }),
};

// ─── CBDC ──────────────────────────────────────────────────────

export const cbdcAPI = {
  status: () => api.get('/cbdc/status'),
  gbdcToEcedi: (data: any) => api.post('/cbdc/convert/gbdc-to-ecedi', data),
  crdnToEcedi: (data: any) => api.post('/cbdc/convert/crdn-to-ecedi', data),
  smartRoute: (data: any) => api.post('/cbdc/smart-route', data),
};

export default api;
