
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ShoppingCartIcon, PlusIcon, ClockIcon, PlayIcon, StopCircleIcon, EditIcon, CheckIcon, XIcon } from 'lucide-react';
import { fetchOrders, editOrder, addOrder } from '@/store/slices/ordersSlice';
import { fetchRooms, editRoom } from '@/store/slices/roomsSlice';
import { fetchCafeProducts } from '@/store/slices/cafeProductsSlice';
import { RootState, AppDispatch } from '@/store/store';
import { createOrderItem, createTransaction, updateRoom } from '@/services/supabaseService';
import { useToast } from '@/hooks/use-toast';
import CafeCartProcessor from '@/components/CafeCartProcessor';

const CurrentOrders = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { orders, loading } = useSelector((state: RootState) => state.orders);
  const { rooms } = useSelector((state: RootState) => state.rooms);
  const { products } = useSelector((state: RootState) => state.cafeProducts);
  const { toast } = useToast();

  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [newOrderDialog, setNewOrderDialog] = useState(false);
  const [roomOrderForm, setRoomOrderForm] = useState({
    customer_name: '',
    room_id: '',
    mode: 'single' as 'single' | 'multiplayer',
    is_open_time: false,
    duration_hours: 1
  });

  useEffect(() => {
    dispatch(fetchOrders('active'));
    dispatch(fetchRooms());
    dispatch(fetchCafeProducts());
  }, [dispatch]);

  const activeOrders = orders.filter(order => order.status === 'active');

  const startRoomSession = async (order: any) => {
    try {
      const room = rooms.find(r => r.id === order.room_id);
      if (!room) return;

      const startTime = new Date().toISOString();
      let endTime = null;
      
      if (!roomOrderForm.is_open_time) {
        const end = new Date();
        end.setHours(end.getHours() + roomOrderForm.duration_hours);
        endTime = end.toISOString();
      }

      // Update room status
      await dispatch(editRoom({
        id: order.room_id,
        updates: {
          status: 'occupied',
          current_customer_name: order.customer_name,
          current_session_start: startTime,
          current_session_end: endTime,
          current_mode: roomOrderForm.mode,
          current_total_cost: order.total_amount
        }
      }));

      // Update order
      await dispatch(editOrder({
        id: order.id,
        updates: {
          start_time: startTime,
          end_time: endTime,
          status: 'active'
        }
      }));

      toast({
        title: "Session Started",
        description: `Room ${room.name} session started for ${order.customer_name}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start room session",
        variant: "destructive",
      });
    }
  };

  const stopRoomSession = async (order: any) => {
    try {
      const room = rooms.find(r => r.id === order.room_id);
      if (!room) return;

      const endTime = new Date().toISOString();
      const startTime = new Date(order.start_time);
      const durationHours = (new Date().getTime() - startTime.getTime()) / (1000 * 60 * 60);
      
      const pricing = roomOrderForm.mode === 'single' ? room.pricing_single : room.pricing_multiplayer;
      const totalCost = durationHours * pricing;

      // Update room status
      await dispatch(editRoom({
        id: order.room_id,
        updates: {
          status: 'available',
          current_customer_name: null,
          current_session_start: null,
          current_session_end: null,
          current_mode: null,
          current_total_cost: 0
        }
      }));

      // Update order
      await dispatch(editOrder({
        id: order.id,
        updates: {
          end_time: endTime,
          total_amount: totalCost,
          status: 'completed'
        }
      }));

      // Create transaction
      await createTransaction({
        order_id: order.id,
        transaction_type: 'payment',
        amount: totalCost,
        payment_method: 'cash',
        description: `Room ${room.name} session - ${durationHours.toFixed(2)} hours`
      });

      toast({
        title: "Session Completed",
        description: `Room ${room.name} session ended. Total: ${totalCost.toFixed(2)} EGP`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to stop room session",
        variant: "destructive",
      });
    }
  };

  const createRoomOrder = async () => {
    if (!roomOrderForm.customer_name || !roomOrderForm.room_id) {
      toast({
        title: "Error",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const room = rooms.find(r => r.id === roomOrderForm.room_id);
      if (!room) return;

      const pricing = roomOrderForm.mode === 'single' ? room.pricing_single : room.pricing_multiplayer;
      const estimatedCost = roomOrderForm.is_open_time ? 0 : roomOrderForm.duration_hours * pricing;

      await dispatch(addOrder({
        customer_name: roomOrderForm.customer_name,
        order_type: 'room_reservation',
        room_id: roomOrderForm.room_id,
        total_amount: estimatedCost,
        status: 'active'
      }));

      // Create order item
      await createOrderItem({
        order_id: '', // Will be filled by the created order
        item_type: 'room_time',
        item_name: `${room.name} - ${roomOrderForm.mode}`,
        quantity: roomOrderForm.is_open_time ? 0 : roomOrderForm.duration_hours,
        unit_price: pricing,
        total_price: estimatedCost
      });

      setNewOrderDialog(false);
      setRoomOrderForm({
        customer_name: '',
        room_id: '',
        mode: 'single',
        is_open_time: false,
        duration_hours: 1
      });

      toast({
        title: "Success",
        description: "Room order created successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create room order",
        variant: "destructive",
      });
    }
  };

  const getSessionDuration = (startTime: string) => {
    if (!startTime) return '0:00';
    const start = new Date(startTime);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  };

  const getOrderTypeColor = (orderType: string) => {
    switch (orderType) {
      case 'room_reservation': return 'bg-blue-500';
      case 'cafe_order': return 'bg-orange-500';
      case 'combo': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-white">Loading orders...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Current Orders</h2>
        <div className="flex gap-2">
          <Dialog open={newOrderDialog} onOpenChange={setNewOrderDialog}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <ClockIcon className="w-4 h-4 mr-2" />
                New Room Order
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 border-slate-700 text-white">
              <DialogHeader>
                <DialogTitle>Create Room Order</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Customer Name</Label>
                  <Input
                    value={roomOrderForm.customer_name}
                    onChange={(e) => setRoomOrderForm({...roomOrderForm, customer_name: e.target.value})}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="Enter customer name"
                  />
                </div>
                
                <div>
                  <Label>Room</Label>
                  <Select value={roomOrderForm.room_id} onValueChange={(value) => setRoomOrderForm({...roomOrderForm, room_id: value})}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue placeholder="Select room" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      {rooms.filter(room => room.status === 'available').map(room => (
                        <SelectItem key={room.id} value={room.id} className="text-white">
                          {room.name} - {room.console_type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Mode</Label>
                  <Select value={roomOrderForm.mode} onValueChange={(value: 'single' | 'multiplayer') => setRoomOrderForm({...roomOrderForm, mode: value})}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      <SelectItem value="single" className="text-white">Single Player</SelectItem>
                      <SelectItem value="multiplayer" className="text-white">Multiplayer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="openTime"
                    checked={roomOrderForm.is_open_time}
                    onChange={(e) => setRoomOrderForm({...roomOrderForm, is_open_time: e.target.checked})}
                    className="rounded"
                  />
                  <Label htmlFor="openTime">Open Time (No specific end time)</Label>
                </div>

                {!roomOrderForm.is_open_time && (
                  <div>
                    <Label>Duration (Hours)</Label>
                    <Input
                      type="number"
                      min="0.5"
                      step="0.5"
                      value={roomOrderForm.duration_hours}
                      onChange={(e) => setRoomOrderForm({...roomOrderForm, duration_hours: parseFloat(e.target.value)})}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                )}

                <Button onClick={createRoomOrder} className="w-full bg-blue-600 hover:bg-blue-700">
                  Create Room Order
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          
          <CafeCartProcessor cafeProducts={products} onOrderProcessed={() => dispatch(fetchOrders('active'))} />
        </div>
      </div>

      {activeOrders.length === 0 ? (
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-8 text-center">
            <div className="text-gray-400 text-lg">No active orders</div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {activeOrders.map((order) => {
            const room = rooms.find(r => r.id === order.room_id);
            const isRoomOrder = order.order_type === 'room_reservation' || order.order_type === 'combo';
            const isSessionActive = room && room.status === 'occupied' && room.current_customer_name === order.customer_name;

            return (
              <Card key={order.id} className="bg-slate-800 border-slate-700">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-white text-lg">{order.customer_name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={`${getOrderTypeColor(order.order_type)} text-white`}>
                          {order.order_type.replace('_', ' ').toUpperCase()}
                        </Badge>
                        {isRoomOrder && room && (
                          <Badge variant="outline" className="text-gray-300">
                            {room.name} - {room.console_type}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-green-400 font-bold">
                        {order.total_amount.toFixed(2)} EGP
                      </div>
                      {isSessionActive && order.start_time && (
                        <div className="text-blue-400 text-sm">
                          {getSessionDuration(order.start_time)}
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Order Items */}
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-300">Items:</div>
                    {order.order_items?.map((item: any, index: number) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-gray-300">
                          {item.quantity}x {item.item_name}
                        </span>
                        <span className="text-white">{item.total_price.toFixed(2)} EGP</span>
                      </div>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    {isRoomOrder && room && (
                      <>
                        {!isSessionActive ? (
                          <Button 
                            onClick={() => startRoomSession(order)}
                            className="flex-1 bg-green-600 hover:bg-green-700"
                            size="sm"
                          >
                            <PlayIcon className="w-4 h-4 mr-1" />
                            Start Session
                          </Button>
                        ) : (
                          <Button 
                            onClick={() => stopRoomSession(order)}
                            className="flex-1 bg-red-600 hover:bg-red-700"
                            size="sm"
                          >
                            <StopCircleIcon className="w-4 h-4 mr-1" />
                            Stop Session
                          </Button>
                        )}
                      </>
                    )}
                    
                    <CafeCartProcessor 
                      cafeProducts={products} 
                      existingOrderId={order.id}
                      onOrderProcessed={() => dispatch(fetchOrders('active'))}
                    />
                    
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingOrderId(editingOrderId === order.id ? null : order.id)}
                    >
                      <EditIcon className="w-4 h-4" />
                    </Button>
                  </div>

                  {editingOrderId === order.id && (
                    <div className="border-t border-slate-600 pt-3 space-y-2">
                      <div className="text-sm text-gray-300">Quick Actions:</div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            dispatch(editOrder({
                              id: order.id,
                              updates: { status: 'completed' }
                            }));
                            setEditingOrderId(null);
                          }}
                        >
                          <CheckIcon className="w-4 h-4 mr-1" />
                          Complete
                        </Button>
                        <Button 
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            dispatch(editOrder({
                              id: order.id,
                              updates: { status: 'cancelled' }
                            }));
                            setEditingOrderId(null);
                          }}
                        >
                          <XIcon className="w-4 h-4 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CurrentOrders;
