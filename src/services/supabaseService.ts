import { supabase } from '@/integrations/supabase/client';

export const getTransactions = async (startDate?: string, endDate?: string) => {
  let query = supabase
    .from('transactions')
    .select(`
      *,
      orders (
        customer_name,
        order_type
      )
    `)
    .order('created_at', { ascending: false });

  if (startDate) {
    query = query.gte('created_at', startDate);
  }
  
  if (endDate) {
    query = query.lte('created_at', endDate);
  }

  const { data, error } = await query;
  
  if (error) {
    throw error;
  }
  
  return data || [];
};

export const supabaseService = {
  getClient: () => supabase,
  getTransactions,
};