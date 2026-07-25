import axios from 'axios';

// Interfaces for our API resources
export interface Category {
  id: number;
  name: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetItem {
  id: number;
  title: string;
  amount: number;
  type: string;
  isRecurring: boolean;
  categoryId: number | null;
  payPeriodId: number | null;
  createdAt: string;
  updatedAt: string;
  category?: Category;
}

export interface PayPeriod {
  id: number;
  startDate: string;
  endDate: string;
  totalIncome: number;
  totalAllocated: number;
  userId: number;
  createdAt: string;
  updatedAt: string;
  budgetItems?: BudgetItem[];
}

export interface BudgetItemTemplate {
  id: number;
  title: string;
  amount: number;
  type: string;
  categoryId: number | null;
  userId: number;
  createdAt: string;
  updatedAt: string;
  category?: Category;
}

// Create an Axios instance
// In production, this would point to the deployed Render backend URL.
// Since the frontend runs in browser, we can use an environment variable.
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});
