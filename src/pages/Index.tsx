import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GamepadIcon, CoffeeIcon, BarChart3Icon, PlayIcon, PauseIcon, StopCircleIcon } from 'lucide-react';
import RoomCard from '@/components/RoomCard';
import BookingModal from '@/components/BookingModal';
import CafeSection from '@/components/CafeSection';
import { Room, roomsData } from '@/data/roomsData';
import { requestNotificationPermission } from '@/utils/notificationUtils';

const Index = () => {
  const [rooms, setRooms] = useState<Room[]>(roomsData);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  // Request notification permission on component mount
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  const activeRooms = rooms.filter(room => room.status === 'occupied').length;
  const availableRooms = rooms.filter(room => room.status === 'available').length;
  const totalRevenue = rooms.reduce((sum, room) => sum + (room.currentSession?.totalCost || 0), 0);

  const handleStartSession = (roomId: string) => {
    const room = rooms.find(r => r.id === roomId);
    if (room) {
      setSelectedRoom(room);
      setIsBookingModalOpen(true);
    }
  };

  const handleStopSession = (roomId: string) => {
    setRooms(rooms.map(room => 
      room.id === roomId 
        ? { ...room, status: 'available', currentSession: null }
        : room
    ));
  };

  const handleBookRoom = (roomId: string, customerName: string, hours: number) => {
    const now = new Date();
    const endTime = new Date(now.getTime() + hours * 60 * 60 * 1000);
    
    setRooms(rooms.map(room => 
      room.id === roomId 
        ? { 
            ...room, 
            status: 'occupied',
            currentSession: {
              customerName,
              startTime: now,
              endTime,
              hours,
              totalCost: hours * room.pricing[room.mode],
              products: []
            }
          }
        : room
    ));
    setIsBookingModalOpen(false);
    setSelectedRoom(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Game Zone Manager</h1>
            <p className="text-blue-200">Complete gaming center management system</p>
          </div>
          <div className="flex gap-2">
            <Badge variant="secondary" className="text-lg px-4 py-2">
              <GamepadIcon className="w-5 h-5 mr-2" />
              {activeRooms} Active
            </Badge>
            <Badge variant="outline" className="text-lg px-4 py-2 text-white border-white">
              <PlayIcon className="w-5 h-5 mr-2" />
              {availableRooms} Available
            </Badge>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-600 to-blue-700 border-0 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Rooms</CardTitle>
              <GamepadIcon className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeRooms}</div>
              <p className="text-xs text-blue-100">out of {rooms.length} rooms</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-600 to-green-700 border-0 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
              <BarChart3Icon className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalRevenue} EGP</div>
              <p className="text-xs text-green-100">+12% from yesterday</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-600 to-purple-700 border-0 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Session</CardTitle>
              <PlayIcon className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2.5h</div>
              <p className="text-xs text-purple-100">average duration</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-600 to-orange-700 border-0 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Café Sales</CardTitle>
              <CoffeeIcon className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,250 EGP</div>
              <p className="text-xs text-orange-100">45 items sold</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="rooms" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-slate-800 border-0">
            <TabsTrigger value="rooms" className="data-[state=active]:bg-blue-600 text-white">
              <GamepadIcon className="w-4 h-4 mr-2" />
              Rooms
            </TabsTrigger>
            <TabsTrigger value="cafe" className="data-[state=active]:bg-blue-600 text-white">
              <CoffeeIcon className="w-4 h-4 mr-2" />
              Café & Canteen
            </TabsTrigger>
            <TabsTrigger value="reports" className="data-[state=active]:bg-blue-600 text-white">
              <BarChart3Icon className="w-4 h-4 mr-2" />
              Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rooms" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {rooms.map((room) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  onStartSession={handleStartSession}
                  onStopSession={handleStopSession}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="cafe">
            <CafeSection />
          </TabsContent>

          <TabsContent value="reports">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Reports & Analytics</CardTitle>
              </CardHeader>
              <CardContent className="text-white">
                <p>Reports functionality coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Booking Modal */}
        <BookingModal
          isOpen={isBookingModalOpen}
          onClose={() => {
            setIsBookingModalOpen(false);
            setSelectedRoom(null);
          }}
          room={selectedRoom}
          onBook={handleBookRoom}
        />
      </div>
    </div>
  );
};

export default Index;
