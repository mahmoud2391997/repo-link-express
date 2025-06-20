import { supabase } from '@/integrations/supabase/client';

export interface Room {
  id: string;
  name: string;
  console_type: 'PS5' | 'Xbox';
  status: 'available' | 'occupied' | 'cleaning' | 'maintenance';
  current_mode?: 'single' | 'multiplayer';
  pricing_single: number;
  pricing_multiplayer: number;
  current_customer_name?: string;
  current_session_start?: string;
  current_session_end?: string;
  current_total_cost?: number;
  created_at?: string;
  updated_at?: string;
}

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

// Rooms CRUD Operations
export const getRooms = async (): Promise<Room[]> => {
  const { data, error } = await supabase.from('rooms').select('*').order('name');
  if (error) throw error;
  return data as Room[];
};

export const createRoom = async (room: Omit<Room, 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase.from('rooms').insert(room).select().single();
  if (error) throw error;
  return data as Room;
};

export const updateRoom = async (id: string, updates: Partial<Room>) => {
  const { data, error } = await supabase.from('rooms').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data as Room;
};

export const deleteRoom = async (id: string) => {
  const { error } = await supabase.from('rooms').delete().eq('id', id);
  if (error) throw error;
};

// Appointments CRUD Operations
export const createAppointment = async (appointment: Omit<Appointment, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase.from('appointments').insert(appointment).select().single();
  if (error) throw error;
  return data as Appointment;
};

export const getAppointments = async () => {
  const { data, error } = await supabase.from('appointments').select(`
    *,
    rooms (name, console_type)
  `).order('appointment_date', { ascending: true });
  if (error) throw error;
  return data;
};

export const updateAppointment = async (id: string, updates: Partial<Appointment>) => {
  const { data, error } = await supabase.from('appointments').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data as Appointment;
};

export const deleteAppointment = async (id: string) => {
  const { error } = await supabase.from('appointments').delete().eq('id', id);
  if (error) throw error;
};

// Orders CRUD Operations
export const createOrder = async (order: Omit<Order, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase.from('orders').insert(order).select().single();
  if (error) throw error;
  return data as Order;
};

export const getOrders = async (status?: string) => {
  let query = supabase.from('orders').select(`
    *,
    order_items (*),
    transactions (*),
    rooms (name, console_type)
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
  return data as Order;
};

export const deleteOrder = async (id: string) => {
  const { error } = await supabase.from('orders').delete().eq('id', id);
  if (error) throw error;
};

// Order Items CRUD Operations
export const createOrderItem = async (item: Omit<OrderItem, 'id' | 'created_at'>) => {
  const { data, error } = await supabase.from('order_items').insert(item).select().single();
  if (error) throw error;
  return data as OrderItem;
};

export const getOrderItems = async (orderId: string) => {
  const { data, error } = await supabase.from('order_items').select('*').eq('order_id', orderId);
  if (error) throw error;
  return data as OrderItem[];
};

export const updateOrderItem = async (id: string, updates: Partial<OrderItem>) => {
  const { data, error } = await supabase.from('order_items').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data as OrderItem;
};

export const deleteOrderItem = async (id: string) => {
  const { error } = await supabase.from('order_items').delete().eq('id', id);
  if (error) throw error;
};

// Transactions CRUD Operations
export const createTransaction = async (transaction: Omit<Transaction, 'id' | 'created_at'>) => {
  const { data, error } = await supabase.from('transactions').insert(transaction).select().single();
  if (error) throw error;
  return data as Transaction;
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

export const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
  const { data, error } = await supabase.from('transactions').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data as Transaction;
};

export const deleteTransaction = async (id: string) => {
  const { error } = await supabase.from('transactions').delete().eq('id', id);
  if (error) throw error;
};

// Cafe Products CRUD Operations
export const getCafeProducts = async (): Promise<CafeProduct[]> => {
  const { data, error } = await supabase.from('cafe_products').select('*').order('category');
  if (error) throw error;
  return data as CafeProduct[];
};

export const createCafeProduct = async (product: Omit<CafeProduct, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase.from('cafe_products').insert(product).select().single();
  if (error) throw error;
  return data as CafeProduct;
};

export const updateCafeProduct = async (id: string, updates: Partial<CafeProduct>) => {
  const { data, error } = await supabase.from('cafe_products').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data as CafeProduct;
};

export const deleteCafeProduct = async (id: string) => {
  const { error } = await supabase.from('cafe_products').delete().eq('id', id);
  if (error) throw error;
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

// Process Cafe Cart - Create order with items and transaction
export const processCafeCart = async (
  customerName: string,
  cartItems: { id: string; name: string; price: number; quantity: number }[],
  paymentMethod: 'cash' | 'card' | 'transfer' = 'cash'
) => {
  try {
    const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Create order
    const order = await createOrder({
      customer_name: customerName,
      order_type: 'cafe_order',
      total_amount: totalAmount,
      status: 'active'
    });

    // Create order items
    for (const item of cartItems) {
      await createOrderItem({
        order_id: order.id!,
        item_type: 'cafe_product',
        item_name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity
      });
    }

    // Create transaction
    await createTransaction({
      order_id: order.id!,
      transaction_type: 'payment',
      amount: totalAmount,
      payment_method: paymentMethod,
      description: `Cafe order for ${customerName}`
    });

    return order;
  } catch (error) {
    throw error;
  }
};

// User Profile Operations
export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) throw error;
  return data;
};

export const updateUserProfile = async (userId: string, updates: { email?: string; role?: string }) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

// Add the missing createTransaction and addOrder functions that are being imported
export const addOrder = createOrder; // Alias for consistency with Redux actions

// Enhanced updateOrder function to handle the response format expected by Redux
export const updateOrderEnhanced = async (params: { id: string; updates: Partial<Order> }) => {
  const { id, updates } = params;
  const updatedOrder = await updateOrder(id, updates);
  return { payload: updatedOrder };
};
