
export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  stock: number;
  active: boolean;
}

export interface Order {
  id: string;
  customer_name: string;
  order_type: string;
  total_amount: number;
  status: string;
  room_id?: string;
  start_time?: string;
  end_time?: string;
  created_at: string;
  order_items?: OrderItem[];
  transactions?: Transaction[];
  rooms?: {
    name: string;
    console_type: string;
  };
}

export interface OrderItem {
  id: string;
  order_id: string;
  item_type: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface Transaction {
  id: string;
  order_id: string;
  transaction_type: string;
  amount: number;
  payment_method: string;
  description?: string;
}
