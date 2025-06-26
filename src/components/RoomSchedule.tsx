
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, ClockIcon } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/store/store';
import { fetchRooms } from '@/store/slices/roomsSlice';
import { fetchOrders } from '@/store/slices/ordersSlice';
import { fetchAppointments } from '@/store/slices/appointmentsSlice';

const RoomSchedule = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { rooms } = useSelector((state: RootState) => state.rooms);
  const { orders } = useSelector((state: RootState) => state.orders);
  const { appointments } = useSelector((state: RootState) => state.appointments);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedRoom, setSelectedRoom] = useState<string>('all');

  useEffect(() => {
    dispatch(fetchRooms());
    dispatch(fetchOrders());
    dispatch(fetchAppointments());
  }, [dispatch]);

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour < 24; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  const getScheduleForRoom = (roomId: string) => {
    const schedule: { [key: string]: any } = {};
    
    // Add appointments
    appointments.forEach((appointment: any) => {
      if (appointment.room_id === roomId && appointment.appointment_date === selectedDate) {
        const startTime = appointment.appointment_time.substring(0, 5);
        const endTime = new Date(new Date(`2000-01-01T${appointment.appointment_time}:00`).getTime() + 
          (appointment.duration_hours * 60 * 60 * 1000)).toTimeString().substring(0, 5);
        
        schedule[startTime] = {
          type: 'appointment',
          customer: appointment.customer_name,
          status: appointment.status,
          duration: appointment.duration_hours,
          endTime
        };
      }
    });

    // Add active sessions
    const room = rooms.find(r => r.id === roomId);
    if (room && room.status === 'occupied' && room.current_session_start) {
      const sessionStart = new Date(room.current_session_start);
      const startTime = sessionStart.toTimeString().substring(0, 5);
      const endTime = room.current_session_end ? 
        new Date(room.current_session_end).toTimeString().substring(0, 5) : 
        'Open';
      
      schedule[startTime] = {
        type: 'session',
        customer: room.current_customer_name,
        status: 'active',
        mode: room.current_mode,
        endTime
      };
    }

    return schedule;
  };

  const isTimeSlotOccupied = (roomId: string, timeSlot: string) => {
    const schedule = getScheduleForRoom(roomId);
    
    for (const [startTime, event] of Object.entries(schedule)) {
      const eventStartTime = new Date(`2000-01-01T${startTime}:00`);
      const eventEndTime = event.endTime === 'Open' ? 
        new Date(`2000-01-01T23:59:59`) : 
        new Date(`2000-01-01T${event.endTime}:00`);
      
      const slotTime = new Date(`2000-01-01T${timeSlot}:00`);
      
      if (slotTime >= eventStartTime && slotTime < eventEndTime) {
        return event;
      }
    }
    
    return null;
  };

  const getEventColor = (event: any) => {
    switch (event.type) {
      case 'appointment':
        return event.status === 'scheduled' ? 'bg-purple-600' : 'bg-purple-400';
      case 'session':
        return 'bg-blue-600';
      default:
        return 'bg-gray-600';
    }
  };

  const filteredRooms = selectedRoom === 'all' ? rooms : rooms.filter(room => room.id === selectedRoom);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-white">Room Schedule</h3>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white rounded px-3 py-1"
            />
          </div>
          <Select value={selectedRoom} onValueChange={setSelectedRoom}>
            <SelectTrigger className="bg-slate-700 border-slate-600 text-white w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-700 border-slate-600">
              <SelectItem value="all" className="text-white">All Rooms</SelectItem>
              {rooms.map(room => (
                <SelectItem key={room.id} value={room.id} className="text-white">
                  {room.name} - {room.console_type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {filteredRooms.map(room => (
          <Card key={room.id} className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  {room.name} - {room.console_type}
                </CardTitle>
                <Badge className={
                  room.status === 'available' ? 'bg-green-600' :
                  room.status === 'occupied' ? 'bg-red-600' :
                  room.status === 'cleaning' ? 'bg-yellow-600' :
                  'bg-orange-600'
                }>
                  {room.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-12 gap-1 text-xs">
                {timeSlots.map(timeSlot => {
                  const event = isTimeSlotOccupied(room.id, timeSlot);
                  return (
                    <div
                      key={timeSlot}
                      className={`
                        p-2 rounded text-center relative
                        ${event ? 
                          `${getEventColor(event)} text-white` : 
                          'bg-slate-700 text-gray-300 hover:bg-slate-600'
                        }
                      `}
                      title={event ? 
                        `${event.customer} (${event.type === 'appointment' ? 'Appointment' : 'Session'})` : 
                        timeSlot
                      }
                    >
                      {timeSlot}
                      {event && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded text-xs">
                          {event.customer?.substring(0, 8)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              {/* Legend */}
              <div className="flex gap-4 mt-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-purple-600 rounded"></div>
                  <span className="text-gray-300">Appointment</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-blue-600 rounded"></div>
                  <span className="text-gray-300">Active Session</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-slate-700 rounded"></div>
                  <span className="text-gray-300">Available</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default RoomSchedule;
