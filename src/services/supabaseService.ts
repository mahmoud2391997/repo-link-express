
import { supabase } from '@/integrations/supabase/client';

export interface Appointment {
  id?: string;
  room_id: string;
  customer_name: string;
  appointment_date: string;
  appointment_time: string;
  duration_hours: number;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  created_at?: string;
  updated_at?: string;
}

export interface Order {
  id?: string;
  room_id?: string;
  customer_name: string;
  order_type: 'room_reservation' | 'cafe_order' | 'combo';
  total_amount: number;
  status: 'active' | 'completed' | 'cancelled';
  start_time?: string;
  end_time?: string;
  created_at?: string;
  updated_at?: string;
}

export interface OrderItem {
  id?: string;
  order_id: string;
  item_type: 'room_time' | 'cafe_product';
  item_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at?: string;
}

export interface Transaction {
  id?: string;
  order_id: string;
  transaction_type: 'payment' | 'refund';
  amount: number;
  payment_method: 'cash' | 'card' | 'transfer';
  description?: string;
  created_at?: string;
}

export interface CafeProduct {
  id?: string;
  name: string;
  category: 'drinks' | 'snacks' | 'meals';
  price: number;
  stock: number;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

// Appointments
export const createAppointment = async (appointment: Omit<Appointment, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase.from('appointments').insert(appointment).select().single();
  if (error) throw error;
  return data;
};

export const getAppointments = async () => {
  const { data, error } = await supabase.from('appointments').select('*').order('appointment_date', { ascending: true });
  if (error) throw error;
  return data;
};

export const updateAppointment = async (id: string, updates: Partial<Appointment>) => {
  const { data, error } = await supabase.from('appointments').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
};

// Orders
export const createOrder = async (order: Omit<Order, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase.from('orders').insert(order).select().single();
  if (error) throw error;
  return data;
};

export const getOrders = async (status?: string) => {
  let query = supabase.from('orders').select(`
    *,
    order_items (*),
    transactions (*)
  `).order('created_at', { ascending: false });
  
  if (status) {
    query = query.eq('status', status);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data;
};

export const updateOrder = async (id: string, updates: Partial<Order>) => {
  const { data, error } = await supabase.from('orders').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
};

// Order Items
export const createOrderItem = async (item: Omit<OrderItem, 'id' | 'created_at'>) => {
  const { data, error } = await supabase.from('order_items').insert(item).select().single();
  if (error) throw error;
  return data;
};

// Transactions
export const createTransaction = async (transaction: Omit<Transaction, 'id' | 'created_at'>) => {
  const { data, error } = await supabase.from('transactions').insert(transaction).select().single();
  if (error) throw error;
  return data;
};

export const getTransactions = async (startDate?: string, endDate?: string) => {
  let query = supabase.from('transactions').select(`
    *,
    orders (*)
  `).order('created_at', { ascending: false });
  
  if (startDate) {
    query = query.gte('created_at', startDate);
  }
  if (endDate) {
    query = query.lte('created_at', endDate);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data;
};

// Cafe Products
export const getCafeProducts = async () => {
  const { data, error } = await supabase.from('cafe_products').select('*').eq('active', true).order('category');
  if (error) throw error;
  return data;
};

export const updateCafeProduct = async (id: string, updates: Partial<CafeProduct>) => {
  const { data, error } = await supabase.from('cafe_products').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
};

export const createCafeProduct = async (product: Omit<CafeProduct, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase.from('cafe_products').insert(product).select().single();
  if (error) throw error;
  return data;
};

// Reports
export const getReportData = async (period: 'daily' | 'weekly' | 'monthly') => {
  const now = new Date();
  let startDate: string;
  
  switch (period) {
    case 'daily':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      break;
    case 'weekly':
      const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
      startDate = weekStart.toISOString();
      break;
    case 'monthly':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      break;
  }
  
  const { data: transactions, error } = await supabase
    .from('transactions')
    .select(`
      *,
      orders (*)
    `)
    .gte('created_at', startDate)
    .eq('transaction_type', 'payment');
    
  if (error) throw error;
  return transactions;
};
