
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlayIcon, StopCircleIcon, ClockIcon, UserIcon, GamepadIcon, PlusIcon, MinusIcon } from 'lucide-react';
import { Room } from '@/services/supabaseService';
import { showSessionEndNotification } from '@/utils/notificationUtils';

interface RoomCardProps {
  room: Room;
  onClick: () => void;
  onEndSession: () => void;
  onAdjustTime?: (roomId: string, adjustment: number) => void;
}

const RoomCard = ({ room, onClick, onEndSession, onAdjustTime }: RoomCardProps) => {
  const [timeDisplay, setTimeDisplay] = useState<string>('');
  const [hasNotified, setHasNotified] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    if (room.status === 'occupied' && room.current_customer_name && room.current_session_start) {
      if (!room.current_session_end) {
        // Open time: count up from start (start from 0)
        const updateElapsedTime = () => {
          const now = new Date();
          const startTime = new Date(room.current_session_start!);
          const diff = now.getTime() - startTime.getTime();
          const seconds = Math.floor(diff / 1000);
          setElapsedSeconds(seconds);
          
          const hours = Math.floor(seconds / 3600);
          const minutes = Math.floor((seconds % 3600) / 60);
          const remainingSeconds = seconds % 60;
          
          setTimeDisplay(
            `${hours.toString().padStart(2, '0')}:${minutes
              .toString()
              .padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
          );
        };

        // Initial update
        updateElapsedTime();
        
        // Set up interval
        timer = setInterval(updateElapsedTime, 1000);
      } else {
        // Fixed time: count down to end
        timer = setInterval(() => {
          const now = new Date();
          const endTime = new Date(room.current_session_end!);
          const diff = endTime.getTime() - now.getTime();

          if (diff <= 0) {
            setTimeDisplay('EXPIRED');
            if (!hasNotified && room.current_customer_name) {
              showSessionEndNotification(room.name, room.current_customer_name);
              setHasNotified(true);
            }
            return;
          }

          if (hasNotified && diff > 0) {
            setHasNotified(false);
          }

          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);

          setTimeDisplay(
            `${hours.toString().padStart(2, '0')}:${minutes
              .toString()
              .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
          );
        }, 1000);
      }
      return () => {
        if (timer) clearInterval(timer);
      };
    } else {
      setHasNotified(false);
      setTimeDisplay('');
      setElapsedSeconds(0);
    }
  }, [
    room.status,
    room.current_session_end,
    room.current_session_start,
    hasNotified,
    room.current_customer_name,
    room.name,
  ]);

  const calculateEstimatedCost = () => {
    if (!room.current_session_start) {
      return null;
    }

    const hourlyRate = room.current_mode === 'single' 
      ? room.pricing_single 
      : room.pricing_multiplayer;
    
    const hours = elapsedSeconds / 3600;
    return (hours * hourlyRate).toFixed(2);
  };

  const getStatusColor = () => {
    switch (room.status) {
      case 'available':
        return 'bg-green-500';
      case 'occupied':
        return 'bg-red-500';
      case 'cleaning':
        return 'bg-yellow-500';
      case 'maintenance':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getConsoleColor = () => {
    return room.console_type === 'PS5' ? 'bg-blue-600' : 'bg-green-600';
  };

  const handleTimeAdjustment = (adjustment: number) => {
    if (onAdjustTime) {
      onAdjustTime(room.id, adjustment);
    }
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
          <div className={`bg-slate-700 p-3 rounded-lg space-y-2 ${timeDisplay === 'EXPIRED' ? 'border-2 border-red-500 animate-pulse' : ''}`}>
            <div className="flex items-center gap-2 text-white">
              <UserIcon className="w-4 h-4" />
              <span className="text-sm">{room.current_customer_name}</span>
            </div>
            <div className="flex items-center gap-2 text-white">
              <ClockIcon className="w-4 h-4" />
              <span className={`text-sm font-mono ${timeDisplay === 'EXPIRED' ? 'text-red-400 font-bold' : ''}`}>
                {timeDisplay || '00:00:00'}
              </span>
              {!room.current_session_end && (
                <span className="ml-2 text-xs text-orange-400">(Open Time)</span>
              )}
            </div>
            
            {/* Time adjustment buttons for active sessions */}
            {room.current_session_end && (
              <div className="flex items-center gap-2 justify-center">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleTimeAdjustment(-0.5)}
                  className="h-6 w-6 p-0"
                >
                  <MinusIcon className="w-3 h-3" />
                </Button>
                <span className="text-xs text-gray-400 px-2">Adjust Time</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleTimeAdjustment(0.5)}
                  className="h-6 w-6 p-0"
                >
                  <PlusIcon className="w-3 h-3" />
                </Button>
              </div>
            )}
            
            {/* Show live estimated cost for active open time sessions */}
            {!room.current_session_end && (
              <div className="text-sm text-blue-400">
                Current Cost: ~{calculateEstimatedCost()} EGP
              </div>
            )}
            
            {/* Show remaining time for fixed time sessions */}
            {room.current_session_end && (
              <div className="text-sm text-yellow-400">
                {timeDisplay !== 'EXPIRED' ? 'Time Remaining' : 'Session Expired'}
              </div>
            )}

            {/* Add time button for expired sessions */}
            {timeDisplay === 'EXPIRED' && (
              <div className="flex justify-center">
                <Button
                  size="sm"
                  onClick={() => handleTimeAdjustment(0.5)}
                  className="bg-yellow-600 hover:bg-yellow-700"
                >
                  <PlusIcon className="w-3 h-3 mr-1" />
                  Add 30min
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Show final cost briefly after session ends - Fixed the comparison */}
        {room.status === 'available' && room.current_total_cost != null && (
          <div className="bg-green-900 p-2 rounded text-center">
            <div className="text-green-400 text-sm font-bold">
              Last Session: {room.current_total_cost.toFixed(2)} EGP
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
