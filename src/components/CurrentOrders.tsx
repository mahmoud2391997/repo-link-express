import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ShoppingCartIcon, PlusIcon, ClockIcon, PlayIcon, StopCircleIcon, DollarSignIcon } from 'lucide-react';
import { fetchOrders, editOrder, addOrder } from '@/store/slices/ordersSlice';
import { fetchRooms, editRoom } from '@/store/slices/roomsSlice';
import { fetchCafeProducts } from '@/store/slices/cafeProductsSlice';
import { RootState, AppDispatch } from '@/store/store';
import { createOrderItem, createTransaction } from '@/services/supabaseService';
import { useToast } from '@/hooks/use-toast';
import CafeCartProcessor from '@/components/CafeCartProcessor';

const CurrentOrders = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { orders, loading } = useSelector((state: RootState) => state.orders);
  const { rooms } = useSelector((state: RootState) => state.rooms);
  const { products } = useSelector((state: RootState) => state.cafeProducts);
  const { toast } = useToast();

  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [newOrderDialog, setNewOrderDialog] = useState(false);
  const [extendTimeDialog, setExtendTimeDialog] = useState(false);
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [reactivateDialog, setReactivateDialog] = useState(false);
  const [roomOrderForm, setRoomOrderForm] = useState({
    customer_name: '',
    room_id: '',
    mode: 'single' as 'single' | 'multiplayer',
    is_open_time: false,
    duration_hours: 1
  });
  const [timeExtension, setTimeExtension] = useState({
    orderId: '',
    roomId: '',
    hours: 1
  });
  const [reactivateForm, setReactivateForm] = useState({
    duration_hours: 1,
    is_open_time: false
  });

  useEffect(() => {
    dispatch(fetchOrders(undefined));
    dispatch(fetchRooms());
    dispatch(fetchCafeProducts());
  }, [dispatch]);

  // Auto-refresh orders every 30 seconds to sync with room statuses
  useEffect(() => {
    const interval = setInterval(() => {
      dispatch(fetchOrders(undefined));
      dispatch(fetchRooms());
    }, 30000);

    return () => clearInterval(interval);
  }, [dispatch]);

  // Filter for active and paused orders
  const currentOrders = orders.filter((order: any) => order.status === 'active' || order.status === 'paused');

  const adjustOrderTime = async (orderId: string, roomId: string, adjustment: number) => {
    try {
      const room = rooms.find(r => r.id === roomId);
      const order = orders.find(o => o.id === orderId);
      
      if (!room || !order || !room.current_session_end) {
        toast({
          title: "Error",
          description: "Cannot adjust time for this session",
          variant: "destructive",
          duration: 3000,
        });
        return;
      }

      const currentEndTime = new Date(room.current_session_end);
      const newEndTime = new Date(currentEndTime.getTime() + (adjustment * 60 * 60 * 1000));

      // Update room end time
      await dispatch(editRoom({
        id: roomId,
        updates: {
          current_session_end: newEndTime.toISOString()
        }
      }));

      // Update order end time and total amount
      const hourlyRate = room.current_mode === 'single' ? room.pricing_single : room.pricing_multiplayer;
      const additionalCost = adjustment * hourlyRate;
      const newTotalAmount = order.total_amount + additionalCost;

      await dispatch(editOrder({
        id: orderId,
        updates: {
          end_time: newEndTime.toISOString(),
          total_amount: newTotalAmount
        }
      }));

      toast({
        title: adjustment > 0 ? "Time Added" : "Time Reduced",
        description: `${Math.abs(adjustment * 60)} minutes ${adjustment > 0 ? 'added to' : 'removed from'} session. Cost updated: ${newTotalAmount.toFixed(2)} EGP`,
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to adjust session time",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const startRoomSession = async (order: any) => {
    try {
      const room = rooms.find(r => r.id === order.room_id);
      if (!room) return;

      const startTime = new Date().toISOString();
      const formattedStartTime = new Date().toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      let endTime = null;
      
      // Only set end time if it's not open time
      if (!order.is_open_time && order.duration_hours) {
        const end = new Date();
        end.setHours(end.getHours() + order.duration_hours);
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
          current_mode: order.mode || roomOrderForm.mode,
          current_total_cost: order.total_amount
        }
      }));

      // Update order
      await dispatch(editOrder({
        id: order.id,
        updates: {
          start_time: formattedStartTime,
          end_time: endTime,
          status: 'active'
        }
      }));

      toast({
        title: "Session Started",
        description: `Room ${room.name} session started for ${order.customer_name}`,
        duration: 5000,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start room session",
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  const stopRoomSession = async (order: any, forceComplete = false) => {
    try {
      const room = rooms.find(r => r.id === order.room_id);
      if (!room) return;

      const endTime = new Date();
      const formattedEndTime = endTime.toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      
      const startTime = new Date(room.current_session_start || new Date());
      const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
      
      const pricing = (order.mode || roomOrderForm.mode) === 'single' ? room.pricing_single : room.pricing_multiplayer;
      const roomCost = order.is_open_time ? durationHours * pricing : order.total_amount;
      
      // Calculate total cost including existing cafe items
      const cafeItemsCost = order.order_items?.reduce((sum: number, item: any) => {
        if (item.item_type === 'cafe_product') {
          return sum + item.total_price;
        }
        return sum;
      }, 0) || 0;
      
      const totalCost = roomCost + cafeItemsCost;

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

      // Update order - if forced complete or if it's an open time session, complete it
      const newStatus = forceComplete || order.is_open_time ? 'completed' : 'paused';
      
      await dispatch(editOrder({
        id: order.id,
        updates: {
          end_time: formattedEndTime,
          total_amount: totalCost,
          status: newStatus
        }
      }));

      // Create transaction only if completing the order
      if (newStatus === 'completed') {
        await createTransaction({
          order_id: order.id,
          transaction_type: 'payment',
          amount: totalCost,
          payment_method: 'cash',
          description: `Room ${room.name} session - ${durationHours.toFixed(2)} hours`
        });
      }

      const message = newStatus === 'completed' 
        ? `Room ${room.name} session completed. Total: ${totalCost.toFixed(2)} EGP`
        : `Room ${room.name} session stopped. Order moved to pending completion.`;

      toast({
        title: newStatus === 'completed' ? "Session Completed" : "Session Stopped",
        description: message,
        duration: 5000,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to stop room session",
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  const reactivateOrder = async () => {
    if (!selectedOrder) return;

    try {
      const room = rooms.find(r => r.id === selectedOrder.room_id);
      if (!room || room.status !== 'available') {
        toast({
          title: "Error",
          description: "Room is not available for reactivation",
          variant: "destructive",
          duration: 3000,
        });
        return;
      }

      const startTime = new Date().toISOString();
      const formattedStartTime = new Date().toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      let endTime = null;
      
      if (!reactivateForm.is_open_time) {
        const end = new Date();
        end.setHours(end.getHours() + reactivateForm.duration_hours);
        endTime = end.toISOString();
      }

      // Update room status
      await dispatch(editRoom({
        id: selectedOrder.room_id,
        updates: {
          status: 'occupied',
          current_customer_name: selectedOrder.customer_name,
          current_session_start: startTime,
          current_session_end: endTime,
          current_mode: selectedOrder.mode || roomOrderForm.mode,
          current_total_cost: selectedOrder.total_amount
        }
      }));

      // Update order
      await dispatch(editOrder({
        id: selectedOrder.id,
        updates: {
          start_time: formattedStartTime,
          end_time: endTime,
          status: 'active'
        }
      }));

      setReactivateDialog(false);
      setSelectedOrder(null);
      setReactivateForm({ duration_hours: 1, is_open_time: false });

      toast({
        title: "Order Reactivated",
        description: `Room session resumed for ${selectedOrder.customer_name}`,
        duration: 5000,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reactivate order",
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  const extendTime = async () => {
    try {
      const room = rooms.find(r => r.id === timeExtension.roomId);
      const order = orders.find(o => o.id === timeExtension.orderId);
      
      if (!room || !order) return;

      const hourlyRate = room.current_mode === 'single' ? room.pricing_single : room.pricing_multiplayer;
      const additionalCost = timeExtension.hours * hourlyRate;
      const newTotalAmount = order.total_amount + additionalCost;

      let newEndTime = null;
      if (room.current_session_end) {
        const currentEndTime = new Date(room.current_session_end);
        newEndTime = new Date(currentEndTime.getTime() + (timeExtension.hours * 60 * 60 * 1000));
      } else if (order.end_time) {
        const currentEndTime = new Date(order.end_time);
        newEndTime = new Date(currentEndTime.getTime() + (timeExtension.hours * 60 * 60 * 1000));
      }

      // Update room if session is active
      if (room.status === 'occupied' && newEndTime) {
        await dispatch(editRoom({
          id: timeExtension.roomId,
          updates: {
            current_session_end: newEndTime.toISOString()
          }
        }));
      }

      // Update order
      await dispatch(editOrder({
        id: timeExtension.orderId,
        updates: {
          end_time: newEndTime?.toISOString() || order.end_time,
          total_amount: newTotalAmount
        }
      }));

      setExtendTimeDialog(false);
      setTimeExtension({ orderId: '', roomId: '', hours: 1 });

      toast({
        title: "Time Extended",
        description: `${timeExtension.hours} hour(s) added. New total: ${newTotalAmount.toFixed(2)} EGP`,
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to extend time",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const completePayment = async (order: any) => {
    try {
      await dispatch(editOrder({
        id: order.id,
        updates: {
          status: 'completed'
        }
      }));

      await createTransaction({
        order_id: order.id,
        transaction_type: 'payment',
        amount: order.total_amount,
        payment_method: 'cash',
        description: `Payment for order ${order.id}`
      });

      setPaymentDialog(false);
      setSelectedOrder(null);

      toast({
        title: "Payment Completed",
        description: `Order completed. Total: ${order.total_amount.toFixed(2)} EGP`,
        duration: 5000,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to complete payment",
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  const createRoomOrder = async () => {
    if (!roomOrderForm.customer_name || !roomOrderForm.room_id) {
      toast({
        title: "Error",
        description: "Please fill all required fields",
        variant: "destructive",
        duration: 5000,
      });
      return;
    }

    try {
      const room = rooms.find(r => r.id === roomOrderForm.room_id);
      if (!room) return;

      const pricing = roomOrderForm.mode === 'single' ? room.pricing_single : room.pricing_multiplayer;
      const estimatedCost = roomOrderForm.is_open_time ? 0 : roomOrderForm.duration_hours * pricing;

      const orderData = {
        customer_name: roomOrderForm.customer_name,
        order_type: 'room_reservation' as const,
        room_id: roomOrderForm.room_id,
        total_amount: estimatedCost,
        status: 'paused' as const,
        mode: roomOrderForm.mode,
        is_open_time: roomOrderForm.is_open_time,
        duration_hours: roomOrderForm.is_open_time ? null : roomOrderForm.duration_hours
      };

      const newOrderResult = await dispatch(addOrder(orderData));
      const newOrder = newOrderResult.payload as any;

      await createOrderItem({
        order_id: newOrder.id,
        item_type: 'room_time',
        item_name: `${room.name} - ${roomOrderForm.mode}${roomOrderForm.is_open_time ? ' (Open Time)' : ` (${roomOrderForm.duration_hours}h)`}`,
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
        duration: 5000,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create room order",
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  const getSessionDuration = (startTime: string) => {
    if (!startTime) return '0:00';
    const start = new Date(startTime);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  };

  const getRemainingTime = (endTime: string) => {
    if (!endTime) return null;
    const end = new Date(endTime);
    const now = new Date();
    const diffMs = end.getTime() - now.getTime();
    
    if (diffMs <= 0) return 'Time Up!';
    
    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}:${minutes.toString().padStart(2, '0')} left`;
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
          <Button onClick={() => setNewOrderDialog(true)} className="bg-blue-600 hover:bg-blue-700">
            <ClockIcon className="w-4 h-4 mr-2" />
            New Room Order
          </Button>
          
          <CafeCartProcessor cafeProducts={products} onOrderProcessed={() => dispatch(fetchOrders(undefined))} />
        </div>
      </div>

      {currentOrders.length === 0 ? (
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-8 text-center">
            <div className="text-gray-400 text-lg">No current orders</div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {currentOrders.map((order: any) => {
            const room = rooms.find(r => r.id === order.room_id);
            const isRoomOrder = order.order_type === 'room_reservation' || order.order_type === 'combo';
            const isSessionActive = room && room.status === 'occupied' && room.current_customer_name === order.customer_name;
            const isPaused = order.status === 'paused';

            return (
              <Card key={order.id} className={`bg-slate-800 border-slate-700 ${isPaused ? 'border-yellow-500' : ''}`}>
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
                        {isPaused && (
                          <Badge className="bg-yellow-600 text-white">
                            PAUSED
                          </Badge>
                        )}
                        {order.is_open_time && (
                          <Badge className="bg-purple-600 text-white">
                            OPEN TIME
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-green-400 font-bold">
                        {order.is_open_time && isSessionActive ? 'Pay on Stop' : `${order.total_amount?.toFixed(2) || '0.00'} EGP`}
                      </div>
                      {order.start_time && (
                        <div className="text-sm text-gray-400">
                          Started: {order.start_time}
                        </div>
                      )}
                      {order.end_time && isPaused && (
                        <div className="text-sm text-gray-400">
                          Ended: {order.end_time}
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
                          {item.quantity > 0 ? `${item.quantity}x ` : ''}{item.item_name}
                        </span>
                        <span className="text-white">{item.total_price?.toFixed(2) || '0.00'} EGP</span>
                      </div>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    {isRoomOrder && room && (
                      <>
                        {isPaused ? (
                          <Button 
                            onClick={() => {
                              setSelectedOrder(order);
                              setReactivateDialog(true);
                            }}
                            className="flex-1 bg-green-600 hover:bg-green-700"
                            size="sm"
                            disabled={room.status !== 'available'}
                          >
                            <PlayIcon className="w-4 h-4 mr-1" />
                            Reactivate
                          </Button>
                        ) : isSessionActive ? (
                          <Button 
                            onClick={() => stopRoomSession(order)}
                            className="flex-1 bg-red-600 hover:bg-red-700"
                            size="sm"
                          >
                            <StopCircleIcon className="w-4 h-4 mr-1" />
                            Stop
                          </Button>
                        ) : null}
                      </>
                    )}
                    
                    <CafeCartProcessor 
                      cafeProducts={products} 
                      existingOrderId={order.id}
                      onOrderProcessed={() => dispatch(fetchOrders(undefined))}
                    />
                    
                    <Button 
                      onClick={() => {
                        setSelectedOrder(order);
                        setPaymentDialog(true);
                      }}
                      className="bg-green-600 hover:bg-green-700"
                      size="sm"
                    >
                      <DollarSignIcon className="w-4 h-4 mr-1" />
                      Pay Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Reactivate Dialog */}
      <Dialog open={reactivateDialog} onOpenChange={setReactivateDialog}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>Reactivate Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-gray-300">
              Customer: <span className="text-white font-medium">{selectedOrder?.customer_name}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="openTime"
                checked={reactivateForm.is_open_time}
                onChange={(e) => setReactivateForm({...reactivateForm, is_open_time: e.target.checked})}
                className="rounded"
              />
              <Label htmlFor="openTime">Open Time (Pay when session ends)</Label>
            </div>

            {!reactivateForm.is_open_time && (
              <div>
                <Label>Duration (Hours)</Label>
                <Input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={reactivateForm.duration_hours}
                  onChange={(e) => setReactivateForm({...reactivateForm, duration_hours: parseFloat(e.target.value)})}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={reactivateOrder} className="flex-1 bg-green-600 hover:bg-green-700">
                <PlayIcon className="w-4 h-4 mr-2" />
                Reactivate Session
              </Button>
              <Button onClick={() => setReactivateDialog(false)} variant="outline" className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Room Order Dialog */}
      <Dialog open={newOrderDialog} onOpenChange={setNewOrderDialog}>
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
              <Label htmlFor="openTime">Open Time (Pay when session ends)</Label>
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

      {/* Extend Time Dialog */}
      <Dialog open={extendTimeDialog} onOpenChange={setExtendTimeDialog}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>Extend Time</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Additional Hours</Label>
              <Select value={timeExtension.hours.toString()} onValueChange={(value) => setTimeExtension({...timeExtension, hours: parseFloat(value)})}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="0.5" className="text-white">30 minutes</SelectItem>
                  <SelectItem value="1" className="text-white">1 hour</SelectItem>
                  <SelectItem value="1.5" className="text-white">1.5 hours</SelectItem>
                  <SelectItem value="2" className="text-white">2 hours</SelectItem>
                  <SelectItem value="3" className="text-white">3 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button onClick={extendTime} className="flex-1 bg-blue-600 hover:bg-blue-700">
                Extend Time
              </Button>
              <Button onClick={() => setExtendTimeDialog(false)} variant="outline" className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={paymentDialog} onOpenChange={setPaymentDialog}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>Complete Payment</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-lg font-bold text-white">Total Amount</div>
                <div className="text-2xl font-bold text-green-400">{selectedOrder.total_amount.toFixed(2)} EGP</div>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => completePayment(selectedOrder)} className="flex-1 bg-green-600 hover:bg-green-700">
                  <DollarSignIcon className="w-4 h-4 mr-2" />
                  Complete Payment
                </Button>
                <Button onClick={() => setPaymentDialog(false)} variant="outline" className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CurrentOrders;
