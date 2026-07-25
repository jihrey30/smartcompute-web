import axios from 'axios';

// Interfaces for our API resources
export interface Category {
  id: string;
  name: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetItem {
  id: string;
  name: string;
  amount: number;
  type: string;
  isStarred: boolean;
  status: string;
  categoryId: string | null;
  payPeriodId: string;
  createdAt: string;
  updatedAt: string;
  category?: Category;
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

export interface BudgetItemTemplate {
  id: string;
  name: string;
  amount: number;
  type: string;
  categoryId: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
  category?: Category;
}

// Create an Axios instance
// In production, this would point to the deployed Render backend URL.
// Since the frontend runs in browser, we can use an environment variable.
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});
