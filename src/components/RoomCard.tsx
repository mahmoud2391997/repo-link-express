
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlayIcon, StopCircleIcon, ClockIcon, UserIcon, GamepadIcon } from 'lucide-react';
import { Room } from '@/data/roomsData';

interface RoomCardProps {
  room: Room;
  onStartSession: (roomId: string) => void;
  onStopSession: (roomId: string) => void;
}

const RoomCard = ({ room, onStartSession, onStopSession }: RoomCardProps) => {
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  useEffect(() => {
    if (room.status === 'occupied' && room.currentSession) {
      const timer = setInterval(() => {
        const now = new Date();
        const endTime = new Date(room.currentSession!.endTime);
        const diff = endTime.getTime() - now.getTime();
        
        if (diff <= 0) {
          setTimeRemaining('EXPIRED');
          return;
        }
        
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        setTimeRemaining(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [room.status, room.currentSession]);

  const getStatusColor = () => {
    switch (room.status) {
      case 'available': return 'bg-green-500';
      case 'occupied': return 'bg-red-500';
      case 'cleaning': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getConsoleColor = () => {
    return room.console === 'PS5' ? 'bg-blue-600' : 'bg-purple-600';
  };

  return (
    <Card className="bg-slate-800 border-slate-700 hover:border-blue-500 transition-all duration-300 hover:scale-105">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <GamepadIcon className="w-5 h-5" />
            {room.name}
          </CardTitle>
          <div className={`w-3 h-3 rounded-full ${getStatusColor()}`} />
        </div>
        <div className="flex gap-2">
          <Badge className={`${getConsoleColor()} text-white border-0`}>
            {room.console}
          </Badge>
          <Badge variant="outline" className="text-white border-slate-500">
            {room.mode === 'single' ? 'Single' : 'Multi'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="text-sm text-gray-300">
          <div className="flex justify-between">
            <span>Single:</span>
            <span className="text-green-400">{room.pricing.single} EGP/hr</span>
          </div>
          <div className="flex justify-between">
            <span>Multi:</span>
            <span className="text-green-400">{room.pricing.multiplayer} EGP/hr</span>
          </div>
        </div>

        {room.status === 'occupied' && room.currentSession && (
          <div className="bg-slate-700 p-3 rounded-lg space-y-2">
            <div className="flex items-center gap-2 text-white">
              <UserIcon className="w-4 h-4" />
              <span className="text-sm">{room.currentSession.customerName}</span>
            </div>
            <div className="flex items-center gap-2 text-white">
              <ClockIcon className="w-4 h-4" />
              <span className="text-sm font-mono">{timeRemaining}</span>
            </div>
            <div className="text-sm text-green-400">
              Total: {room.currentSession.totalCost} EGP
            </div>
          </div>
        )}

        <div className="flex gap-2">
          {room.status === 'available' && (
            <Button 
              onClick={() => onStartSession(room.id)}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <PlayIcon className="w-4 h-4 mr-2" />
              Start
            </Button>
          )}
          
          {room.status === 'occupied' && (
            <Button 
              onClick={() => onStopSession(room.id)}
              variant="destructive"
              className="flex-1"
            >
              <StopCircleIcon className="w-4 h-4 mr-2" />
              Stop
            </Button>
          )}

          {room.status === 'cleaning' && (
            <Button disabled className="flex-1 bg-yellow-600">
              Cleaning...
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RoomCard;
