const localDbService = await import('./localDbService.js');
const { db } = localDbService;
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
  status: 'active' | 'completed' | 'cancelled' | 'paused';
  start_time?: string;
  end_time?: string;
  mode?: 'single' | 'multiplayer';
  is_open_time?: boolean;
  duration_hours?: number;
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
  const data = await db('rooms').select('*').orderBy('name');
  return data as Room[];
};

export const createRoom = async (room: Omit<Room, 'created_at' | 'updated_at'>) => {
  const [data] = await db('rooms').insert(room).returning('*');
  return data as Room;
};

export const updateRoom = async (id: string, updates: Partial<Room>) => {
  const [data] = await db('rooms').where({ id }).update(updates).returning('*');
  return data as Room;
};

export const deleteRoom = async (id: string) => {
  await db('rooms').where({ id }).delete();
};

// Appointments CRUD Operations
export const createAppointment = async (appointment: Omit<Appointment, 'id' | 'created_at' | 'updated_at'>) => {
  const [data] = await db('appointments').insert(appointment).returning('*');
  return data as Appointment;
};

export const getAppointments = async () => {
  const data = await db('appointments')
    .select('appointments.*', 'rooms.name as room_name', 'rooms.console_type as room_console_type')
    .leftJoin('rooms', 'appointments.room_id', 'rooms.id')
    .orderBy('appointment_date', 'asc');
  return data;
};

export const updateAppointment = async (id: string, updates: Partial<Appointment>) => {
  const [data] = await db('appointments').where({ id }).update(updates).returning('*');
  return data as Appointment;
};

export const deleteAppointment = async (id: string) => {
  await db('appointments').where({ id }).delete();
};

// Orders CRUD Operations
export const createOrder = async (order: Omit<Order, 'id' | 'created_at' | 'updated_at'>) => {
  const [data] = await db('orders').insert(order).returning('*');
  return data as Order;
};

export const getOrders = async (status?: string) => {
  let query = db('orders')
    .select('orders.*', 'order_items.*', 'transactions.*', 'rooms.name as room_name', 'rooms.console_type as room_console_type')
    .leftJoin('order_items', 'orders.id', 'order_items.order_id')
    .leftJoin('transactions', 'orders.id', 'transactions.order_id')
    .leftJoin('rooms', 'orders.room_id', 'rooms.id')
    .orderBy('orders.created_at', 'desc');
  
  if (status) {
    query = query.where('orders.status', status);
  }
  
  const data = await query;
  return data;
};

export const updateOrder = async (id: string, updates: Partial<Order>) => {
  const [data] = await db('orders').where({ id }).update(updates).returning('*');
  return data as Order;
};

export const deleteOrder = async (id: string) => {
  await db('orders').where({ id }).delete();
};

// Order Items CRUD Operations
export const createOrderItem = async (item: Omit<OrderItem, 'id' | 'created_at'>) => {
  const [data] = await db('order_items').insert(item).returning('*');
  return data as OrderItem;
};

export const getOrderItems = async (orderId: string) => {
  const data = await db('order_items').select('*').where({ order_id: orderId });
  return data as OrderItem[];
};

export const updateOrderItem = async (id: string, updates: Partial<OrderItem>) => {
  const [data] = await db('order_items').where({ id }).update(updates).returning('*');
  return data as OrderItem;
};

export const deleteOrderItem = async (id: string) => {
  await db('order_items').where({ id }).delete();
};

// Transactions CRUD Operations
export const createTransaction = async (transaction: Omit<Transaction, 'id' | 'created_at'>) => {
  const [data] = await db('transactions').insert(transaction).returning('*');
  return data as Transaction;
};

export const getTransactions = async (startDate?: string, endDate?: string) => {
  let query = db('transactions')
    .select('transactions.*', 'orders.*')
    .leftJoin('orders', 'transactions.order_id', 'orders.id')
    .orderBy('transactions.created_at', 'desc');
  
  if (startDate) {
    query = query.where('transactions.created_at', '>=', startDate);
  }
  if (endDate) {
    query = query.where('transactions.created_at', '<=', endDate);
  }
  
  const data = await query;
  return data;
};

export const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
  const [data] = await db('transactions').where({ id }).update(updates).returning('*');
  return data as Transaction;
};

export const deleteTransaction = async (id: string) => {
  await db('transactions').where({ id }).delete();
};

// Cafe Products CRUD Operations
export const getCafeProducts = async (): Promise<CafeProduct[]> => {
  const data = await db('cafe_products').select('*').orderBy('category');
  return data as CafeProduct[];
};

export const createCafeProduct = async (product: Omit<CafeProduct, 'id' | 'created_at' | 'updated_at'>) => {
  const [data] = await db('cafe_products').insert(product).returning('*');
  return data as CafeProduct;
};

export const updateCafeProduct = async (id: string, updates: Partial<CafeProduct>) => {
  const [data] = await db('cafe_products').where({ id }).update(updates).returning('*');
  return data as CafeProduct;
};

export const deleteCafeProduct = async (id: string) => {
  await db('cafe_products').where({ id }).delete();
};

// Reports
export const getReportData = async (period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'half-yearly' | 'yearly') => {
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
    case 'quarterly':
      const quarterStart = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      startDate = quarterStart.toISOString();
      break;
    case 'half-yearly':
      const halfYearStart = new Date(now.getFullYear(), now.getMonth() - 6, 1);
      startDate = halfYearStart.toISOString();
      break;
    case 'yearly':
      startDate = new Date(now.getFullYear(), 0, 1).toISOString();
      break;
  }
  
  const transactions = await db('transactions')
    .select('*', 'orders.*')
    .leftJoin('orders', 'transactions.order_id', 'orders.id')
    .where('transactions.created_at', '>=', startDate)
    .where('transaction_type', 'payment');
    
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
  const data = await db('profiles')
    .select('*')
    .where({ id: userId })
    .first();
  
  return data;
};

export const updateUserProfile = async (userId: string, updates: { email?: string; role?: string }) => {
  const [data] = await db('profiles')
    .where({ id: userId })
    .update(updates)
    .returning('*');
  
  return data;
};

// Check appointment conflicts
export const checkAppointmentConflicts = async (roomId: string, date: string, time: string, duration: number, excludeId?: string) => {
  const appointmentStart = new Date(`${date}T${time}`);
  const appointmentEnd = new Date(appointmentStart.getTime() + (duration * 60 * 60 * 1000));
  
  // Check for appointment conflicts
  let query = db('appointments')
    .select('*')
    .where({ room_id: roomId, appointment_date: date })
    .whereNot({ status: 'cancelled' });
    
  if (excludeId) {
    query = query.whereNot({ id: excludeId });
  }
  
  const appointments = await query;
  
  for (const appointment of appointments || []) {
    const existingStart = new Date(`${appointment.appointment_date}T${appointment.appointment_time}`);
    const existingEnd = new Date(existingStart.getTime() + (appointment.duration_hours * 60 * 60 * 1000));
    
    if (
      (appointmentStart >= existingStart && appointmentStart < existingEnd) ||
      (appointmentEnd > existingStart && appointmentEnd <= existingEnd) ||
      (appointmentStart <= existingStart && appointmentEnd >= existingEnd)
    ) {
      return true; // Conflict found
    }
  }
  
  return false; // No conflicts
};

// Add the missing createTransaction and addOrder functions that are being imported
export const addOrder = createOrder; // Alias for consistency with Redux actions

// Enhanced updateOrder function to handle the response format expected by Redux
export const updateOrderEnhanced = async (params: { id: string; updates: Partial<Order> }) => {
  const { id, updates } = params;
  const updatedOrder = await updateOrder(id, updates);
  return { payload: updatedOrder };
};


