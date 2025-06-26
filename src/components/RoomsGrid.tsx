import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/store/store';
import { fetchRooms, editRoom } from '@/store/slices/roomsSlice';
import { editOrder, fetchOrders } from '@/store/slices/ordersSlice';
import RoomCard from '@/components/RoomCard';
import BookingModal from '@/components/BookingModal';
import { Room } from '@/services/supabaseService';
import { useToast } from '@/hooks/use-toast';

const RoomsGrid = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { rooms, loading, error } = useSelector((state: RootState) => state.rooms);
  const { orders } = useSelector((state: RootState) => state.orders);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    dispatch(fetchRooms());
    dispatch(fetchOrders());
  }, [dispatch]);

  const handleBookRoom = async (roomId: string, customerName: string, hours: number, mode: 'single' | 'multiplayer') => {
    try {
      const startTime = new Date().toISOString();
      let endTime = null;
      
      // Only set end time if it's not open time (hours > 0)
      if (hours > 0) {
        const end = new Date();
        end.setHours(end.getHours() + hours);
        endTime = end.toISOString();
      }

      await dispatch(editRoom({
        id: roomId,
        updates: {
          status: 'occupied',
          current_customer_name: customerName,
          current_mode: mode,
          current_session_start: startTime,
          current_session_end: endTime, // null for open time
          current_total_cost: null // Reset total cost
        }
      }));
      
      setIsBookingModalOpen(false);
      setSelectedRoom(null);
    } catch (error) {
      console.error('Error booking room:', error);
    }
  };

  const handleRoomClick = (room: Room) => {
    if (room.status === 'available') {
      setSelectedRoom(room);
      setIsBookingModalOpen(true);
    }
  };

  const handleStartSession = async (roomId: string) => {
    try {
      // Find the paused order for this room
      const pausedOrder = orders.find(order => 
        order.room_id === roomId && 
        order.status === 'paused'
      );

      if (!pausedOrder) {
        toast({
          title: "Error",
          description: "No paused session found for this room",
          variant: "destructive",
          duration: 3000,
        });
        return;
      }

      const room = rooms.find(r => r.id === roomId);
      if (!room) return;

      const startTime = new Date().toISOString();
      const formattedStartTime = new Date().toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit' 
      });

      // Update room to occupied
      await dispatch(editRoom({
        id: roomId,
        updates: {
          status: 'occupied',
          current_customer_name: pausedOrder.customer_name,
          current_mode: pausedOrder.mode || 'single',
          current_session_start: startTime,
          current_session_end: null, // Will be set based on session type
          current_total_cost: pausedOrder.total_amount
        }
      }));

      // Update order to active and record start time
      await dispatch(editOrder({
        id: pausedOrder.id,
        updates: {
          status: 'active',
          start_time: formattedStartTime
        }
      }));

      toast({
        title: "Session Started",
        description: `Room ${room.name} session resumed for ${pausedOrder.customer_name}`,
        duration: 5000,
      });
    } catch (error) {
      console.error('Error starting session:', error);
      toast({
        title: "Error",
        description: "Failed to start session",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const handleEndSession = async (roomId: string) => {
    try {
      const room = rooms.find(r => r.id === roomId);
      if (!room || !room.current_session_start) {
        console.error('Room or session start time not found');
        return;
      }

      const endTime = new Date();
      const formattedEndTime = endTime.toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      
      const startTime = new Date(room.current_session_start);
      const elapsedHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
      
      // Calculate cost based on actual elapsed time
      const hourlyRate = room.current_mode === 'single' ? room.pricing_single : room.pricing_multiplayer;
      const calculatedCost = elapsedHours * hourlyRate;

      // Find the active order for this room
      const activeOrder = orders.find(order => 
        order.room_id === roomId && 
        order.status === 'active' && 
        order.customer_name === room.current_customer_name
      );

      // Update room status to available
      await dispatch(editRoom({
        id: roomId,
        updates: {
          status: 'available',
          current_customer_name: null,
          current_mode: null,
          current_session_start: null,
          current_session_end: null,
          current_total_cost: calculatedCost
        }
      }));

      // Update order status to 'paused' and record end time and calculated cost
      if (activeOrder) {
        await dispatch(editOrder({
          id: activeOrder.id,
          updates: {
            status: 'paused',
            total_amount: calculatedCost,
            end_time: formattedEndTime
          }
        }));
      }

      console.log(`Session paused. Duration: ${elapsedHours.toFixed(2)} hours, Cost: ${calculatedCost.toFixed(2)} EGP`);
      
      toast({
        title: "Session Paused",
        description: `Session moved to Current Orders. Elapsed time: ${elapsedHours.toFixed(2)} hours, Cost: ${calculatedCost.toFixed(2)} EGP`,
        duration: 5000,
      });
    } catch (error) {
      console.error('Error ending session:', error);
    }
  };

  const handleAdjustTime = async (roomId: string, adjustment: number) => {
    try {
      const room = rooms.find(r => r.id === roomId);
      if (!room || !room.current_session_end) {
        console.error('Room or session end time not found');
        return;
      }

      const currentEndTime = new Date(room.current_session_end);
      const newEndTime = new Date(currentEndTime.getTime() + (adjustment * 60 * 60 * 1000));

      await dispatch(editRoom({
        id: roomId,
        updates: {
          current_session_end: newEndTime.toISOString()
        }
      }));

      toast({
        title: adjustment > 0 ? "Time Added" : "Time Reduced",
        description: `${Math.abs(adjustment * 60)} minutes ${adjustment > 0 ? 'added to' : 'removed from'} session`,
        duration: 3000,
      });
    } catch (error) {
      console.error('Error adjusting time:', error);
      toast({
        title: "Error",
        description: "Failed to adjust session time",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-white text-lg">Loading rooms...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-red-400 text-lg">Error loading rooms: {error}</div>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {rooms.map((room) => {
          // Check if there's a paused order for this room
          const pausedOrder = orders.find(order => 
            order.room_id === room.id && 
            order.status === 'paused'
          );

          return (
            <RoomCard
              key={room.id}
              room={room}
              onClick={() => handleRoomClick(room)}
              onEndSession={() => handleEndSession(room.id)}
              onAdjustTime={handleAdjustTime}
              onStartSession={pausedOrder ? () => handleStartSession(room.id) : undefined}
              showStartButton={!!pausedOrder && room.status === 'available'}
            />
          );
        })}
      </div>

      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => {
          setIsBookingModalOpen(false);
          setSelectedRoom(null);
        }}
        room={selectedRoom}
        onBook={handleBookRoom}
      />
    </>
  );
};

export default RoomsGrid;
