import axios from 'axios';

// Interfaces for our API resources
export interface Category {
  id: string;
  name: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface Status {
  id: string;
  name: string;
  color: string;
  sortOrder: number;
  slug: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetItem {
  id: string;
  name: string;
  amount: number;
  type: string;
  isStarred: boolean;
  statusId: string | null;
  categoryId: string | null;
  payPeriodId: string;
  createdAt: string;
  updatedAt: string;
  category?: Category;
  status?: Status;
}

export interface PayPeriod {
  id: string;
  label: string;
  payDate: string;
  totalIncome: number;
  totalAllocated: number;
  totalBalance: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
  items?: BudgetItem[];
}

export interface Automation {
  id: string;
  name: string;
  defaultAmount: number | string;
  type: string;
  categoryId: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
  recurrence?: string;
  category?: Category;
}

// Create an Axios instance
// In production, this would point to the deployed Render backend URL.
// Since the frontend runs in browser, we can use an environment variable.
const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api/';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

import Cookies from 'js-cookie';

api.interceptors.request.use((config) => {
  const token = Cookies.get('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
