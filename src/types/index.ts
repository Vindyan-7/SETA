export interface Expense {
  id: string;
  user_id?: string;
  category: ExpenseCategory;
  amount: number;
  title?: string;
  created_at: string;
}

export type ExpenseCategory = 
  | 'food' 
  | 'travel' 
  | 'groceries' 
  | 'shopping' 
  | 'entertainment' 
  | 'stationary' 
  | 'others';

export interface CategoryData {
  name: string;
  value: number;
  color: string;
  percentage: number;
  legendFontColor: string;
  legendFontSize: number;
}

export type TimeFilter = 'today' | '7days' | '15days' | '30days' | 'all';
