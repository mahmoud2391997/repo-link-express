
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/store/store';
import { fetchRooms, editRoom } from '@/store/slices/roomsSlice';
import RoomCard from '@/components/RoomCard';
import BookingModal from '@/components/BookingModal';
import { Room } from '@/services/supabaseService';

const RoomsGrid = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { rooms, loading, error } = useSelector((state: RootState) => state.rooms);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchRooms());
  }, [dispatch]);

  const handleBookRoom = async (roomId: string, customerName: string, hours: number, mode: 'single' | 'multiplayer') => {
    try {
      const endTime = new Date();
      endTime.setHours(endTime.getHours() + hours);

      await dispatch(editRoom({
        id: roomId,
        updates: {
          status: 'occupied',
          current_customer_name: customerName,
          current_mode: mode,
          current_session_start: new Date().toISOString(),
          current_session_end: endTime.toISOString()
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

  const handleEndSession = async (roomId: string) => {
    try {
      await dispatch(editRoom({
        id: roomId,
        updates: {
          status: 'available',
          current_customer_name: null,
          current_mode: null,
          current_session_start: null,
          current_session_end: null,
          current_total_cost: 0
        }
      }));
    } catch (error) {
      console.error('Error ending session:', error);
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
        {rooms.map((room) => (
          <RoomCard
            key={room.id}
            room={room}
            onClick={() => handleRoomClick(room)}
            onEndSession={() => handleEndSession(room.id)}
          />
        ))}
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
