
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
    dispatch(fetchOrders(undefined));
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
    
    // Add appointments for the selected date
    appointments.forEach((appointment: any) => {
      if (appointment.room_id === roomId && appointment.appointment_date === selectedDate) {
        const startTime = appointment.appointment_time.substring(0, 5);
        const endHour = parseInt(appointment.appointment_time.substring(0, 2)) + appointment.duration_hours;
        const endTime = `${endHour.toString().padStart(2, '0')}:${appointment.appointment_time.substring(3, 5)}`;
        
        schedule[startTime] = {
          type: 'appointment',
          customer: appointment.customer_name,
          status: appointment.status,
          duration: appointment.duration_hours,
          endTime,
          id: appointment.id
        };
      }
    });

    // Add active sessions (only for today)
    const room = rooms.find(r => r.id === roomId);
    const today = new Date().toISOString().split('T')[0];
    
    if (room && room.status === 'occupied' && room.current_session_start && selectedDate === today) {
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
        endTime,
        id: `session-${room.id}`
      };
    }

    // Add paused orders (sessions that can be resumed)
    orders.forEach((order: any) => {
      if (order.room_id === roomId && order.status === 'paused' && order.start_time && order.end_time) {
        schedule[order.start_time] = {
          type: 'paused_session',
          customer: order.customer_name,
          status: 'paused',
          mode: order.mode,
          endTime: order.end_time,
          id: order.id
        };
      }
    });

    return schedule;
  };

  const isTimeSlotOccupied = (roomId: string, timeSlot: string) => {
    const schedule = getScheduleForRoom(roomId);
    const slotTime = new Date(`2000-01-01T${timeSlot}:00`);
    
    for (const [startTime, event] of Object.entries(schedule)) {
      const eventStartTime = new Date(`2000-01-01T${startTime}:00`);
      let eventEndTime;
      
      if (event.endTime === 'Open') {
        eventEndTime = new Date(`2000-01-01T23:59:59`);
      } else {
        eventEndTime = new Date(`2000-01-01T${event.endTime}:00`);
      }
      
      if (slotTime >= eventStartTime && slotTime < eventEndTime) {
        return event;
      }
    }
    
    return null;
  };

  const getEventColor = (event: any) => {
    switch (event.type) {
      case 'appointment':
        return event.status === 'scheduled' ? 'bg-purple-600 text-white' : 'bg-purple-400 text-white';
      case 'session':
        return 'bg-blue-600 text-white';
      case 'paused_session':
        return 'bg-orange-600 text-white';
      default:
        return 'bg-gray-600 text-white';
    }
  };

  const getEventLabel = (event: any) => {
    switch (event.type) {
      case 'appointment':
        return 'APT';
      case 'session':
        return 'LIVE';
      case 'paused_session':
        return 'PAUSE';
      default:
        return 'OCC';
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
                <div className="flex gap-2">
                  <Badge className={
                    room.status === 'available' ? 'bg-green-600' :
                    room.status === 'occupied' ? 'bg-red-600' :
                    room.status === 'cleaning' ? 'bg-yellow-600' :
                    'bg-orange-600'
                  }>
                    {room.status}
                  </Badge>
                  {room.current_customer_name && (
                    <Badge variant="outline" className="text-white border-white">
                      {room.current_customer_name}
                    </Badge>
                  )}
                </div>
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
                        p-2 rounded text-center relative min-h-[3rem] flex flex-col justify-center
                        ${event ? 
                          `${getEventColor(event)}` : 
                          'bg-slate-700 text-gray-300 hover:bg-slate-600 cursor-pointer'
                        }
                      `}
                      title={event ? 
                        `${event.customer} - ${event.type === 'appointment' ? 'Appointment' : event.type === 'session' ? 'Active Session' : 'Paused Session'} (${timeSlot} - ${event.endTime})` : 
                        `Available - ${timeSlot}`
                      }
                    >
                      <div className="text-xs font-medium">{timeSlot}</div>
                      {event && (
                        <div className="text-xs font-bold">
                          {getEventLabel(event)}
                        </div>
                      )}
                      {event && event.customer && (
                        <div className="text-xs truncate">
                          {event.customer.substring(0, 6)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              {/* Enhanced Legend */}
              <div className="flex flex-wrap gap-4 mt-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-purple-600 rounded"></div>
                  <span className="text-gray-300">Appointment</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-blue-600 rounded"></div>
                  <span className="text-gray-300">Live Session</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-orange-600 rounded"></div>
                  <span className="text-gray-300">Paused Session</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-slate-700 rounded"></div>
                  <span className="text-gray-300">Available</span>
                </div>
              </div>

              {/* Room Statistics */}
              <div className="mt-4 p-3 bg-slate-700 rounded-lg">
                <div className="text-sm text-gray-300 mb-2">Today's Schedule Summary:</div>
                <div className="grid grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-purple-400">Appointments: </span>
                    <span className="text-white">
                      {appointments.filter(apt => apt.room_id === room.id && apt.appointment_date === selectedDate).length}
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-400">Active: </span>
                    <span className="text-white">
                      {room.status === 'occupied' ? '1' : '0'}
                    </span>
                  </div>
                  <div>
                    <span className="text-orange-400">Paused: </span>
                    <span className="text-white">
                      {orders.filter(order => order.room_id === room.id && order.status === 'paused').length}
                    </span>
                  </div>
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
