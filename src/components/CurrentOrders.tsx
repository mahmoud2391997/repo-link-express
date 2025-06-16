
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ClockIcon, UserIcon, DollarSignIcon, CheckCircleIcon, XCircleIcon } from 'lucide-react';
import { getOrders, updateOrder, createTransaction } from '@/services/supabaseService';
import { useToast } from '@/hooks/use-toast';

const CurrentOrders = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const data = await getOrders('active');
      setOrders(data);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleCompleteOrder = async (orderId: string, totalAmount: number) => {
    try {
      await updateOrder(orderId, { status: 'completed', end_time: new Date().toISOString() });
      await createTransaction({
        order_id: orderId,
        transaction_type: 'payment',
        amount: totalAmount,
        payment_method: 'cash',
        description: 'Order completion payment'
      });

      toast({
        title: "Order Completed",
        description: "Order has been completed and payment recorded",
      });
      
      loadOrders();
    } catch (error) {
      console.error('Error completing order:', error);
      toast({
        title: "Error",
        description: "Failed to complete order",
        variant: "destructive",
      });
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    try {
      await updateOrder(orderId, { status: 'cancelled' });
      toast({
        title: "Order Cancelled",
        description: "Order has been cancelled",
      });
      loadOrders();
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast({
        title: "Error",
        description: "Failed to cancel order",
        variant: "destructive",
      });
    }
  };

  const getOrderTypeColor = (orderType: string) => {
    switch (orderType) {
      case 'room_reservation': return 'bg-blue-600';
      case 'cafe_order': return 'bg-orange-600';
      case 'combo': return 'bg-purple-600';
      default: return 'bg-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Current Orders</h2>
        <Button onClick={loadOrders} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
          {isLoading ? 'Loading...' : 'Refresh'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {orders.map((order) => (
          <Card key={order.id} className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  <UserIcon className="w-5 h-5" />
                  {order.customer_name}
                </CardTitle>
                <Badge className={`${getOrderTypeColor(order.order_type)} text-white border-0`}>
                  {order.order_type.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {order.room_id && (
                <div className="text-sm text-gray-300">
                  <strong>Room:</strong> {order.room_id}
                </div>
              )}
              
              <div className="text-sm text-gray-300">
                <div className="flex items-center gap-2">
                  <ClockIcon className="w-4 h-4" />
                  <span>Started: {new Date(order.start_time || order.created_at).toLocaleString()}</span>
                </div>
              </div>

              {order.order_items && order.order_items.length > 0 && (
                <div className="space-y-2">
                  <strong className="text-white">Items:</strong>
                  {order.order_items.map((item: any) => (
                    <div key={item.id} className="text-sm text-gray-300 flex justify-between">
                      <span>{item.item_name} x{item.quantity}</span>
                      <span>{item.total_price} EGP</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between text-lg font-bold text-green-400 border-t border-slate-600 pt-3">
                <span className="flex items-center gap-2">
                  <DollarSignIcon className="w-4 h-4" />
                  Total:
                </span>
                <span>{order.total_amount} EGP</span>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={() => handleCompleteOrder(order.id, order.total_amount)}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircleIcon className="w-4 h-4 mr-2" />
                  Complete
                </Button>
                <Button 
                  onClick={() => handleCancelOrder(order.id)}
                  variant="destructive"
                  className="flex-1"
                >
                  <XCircleIcon className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {orders.length === 0 && !isLoading && (
          <Card className="bg-slate-800 border-slate-700 col-span-full">
            <CardContent className="text-center py-8">
              <div className="text-gray-400">No active orders found</div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CurrentOrders;
