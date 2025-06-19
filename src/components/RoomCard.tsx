
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlayIcon, StopCircleIcon, ClockIcon, UserIcon, GamepadIcon } from 'lucide-react';
import { Room } from '@/services/supabaseService';
import { showSessionEndNotification } from '@/utils/notificationUtils';

interface RoomCardProps {
  room: Room;
  onClick: () => void;
  onEndSession: () => void;
}

const RoomCard = ({ room, onClick, onEndSession }: RoomCardProps) => {
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [hasNotified, setHasNotified] = useState(false);

  useEffect(() => {
    if (room.status === 'occupied' && room.current_session_end) {
      const timer = setInterval(() => {
        const now = new Date();
        const endTime = new Date(room.current_session_end!);
        const diff = endTime.getTime() - now.getTime();
        
        if (diff <= 0) {
          setTimeRemaining('EXPIRED');
          
          // Show notification only once when session expires
          if (!hasNotified && room.current_customer_name) {
            showSessionEndNotification(room.name, room.current_customer_name);
            setHasNotified(true);
          }
          return;
        }
        
        // Reset notification flag if time is extended
        if (hasNotified && diff > 0) {
          setHasNotified(false);
        }
        
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        setTimeRemaining(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      }, 1000);

      return () => clearInterval(timer);
    } else {
      setHasNotified(false);
    }
  }, [room.status, room.current_session_end, hasNotified, room.current_customer_name, room.name]);

  const getStatusColor = () => {
    switch (room.status) {
      case 'available': return 'bg-green-500';
      case 'occupied': return 'bg-red-500';
      case 'cleaning': return 'bg-yellow-500';
      case 'maintenance': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getConsoleColor = () => {
    return room.console_type === 'PS5' ? 'bg-blue-600' : 'bg-green-600';
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
            {room.console_type}
          </Badge>
          {room.current_mode && (
            <Badge variant="outline" className="text-white border-slate-500">
              {room.current_mode === 'single' ? 'Single' : 'Multi'}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="text-sm text-gray-300">
          <div className="flex justify-between">
            <span>Single:</span>
            <span className="text-green-400">{room.pricing_single} EGP/hr</span>
          </div>
          <div className="flex justify-between">
            <span>Multi:</span>
            <span className="text-green-400">{room.pricing_multiplayer} EGP/hr</span>
          </div>
        </div>

        {room.status === 'occupied' && room.current_customer_name && (
          <div className={`bg-slate-700 p-3 rounded-lg space-y-2 ${timeRemaining === 'EXPIRED' ? 'border-2 border-red-500 animate-pulse' : ''}`}>
            <div className="flex items-center gap-2 text-white">
              <UserIcon className="w-4 h-4" />
              <span className="text-sm">{room.current_customer_name}</span>
            </div>
            <div className="flex items-center gap-2 text-white">
              <ClockIcon className="w-4 h-4" />
              <span className={`text-sm font-mono ${timeRemaining === 'EXPIRED' ? 'text-red-400 font-bold' : ''}`}>
                {timeRemaining}
              </span>
            </div>
            <div className="text-sm text-green-400">
              Total: {room.current_total_cost || 0} EGP
            </div>
          </div>
        )}

        <div className="flex gap-2">
          {room.status === 'available' && (
            <Button 
              onClick={onClick}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <PlayIcon className="w-4 h-4 mr-2" />
              Start
            </Button>
          )}
          
          {room.status === 'occupied' && (
            <Button 
              onClick={onEndSession}
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

          {room.status === 'maintenance' && (
            <Button disabled className="flex-1 bg-orange-600">
              Maintenance
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RoomCard;
