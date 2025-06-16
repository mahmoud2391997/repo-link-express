
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { GamepadIcon, ClockIcon, DollarSignIcon } from 'lucide-react';
import { Room } from '@/data/roomsData';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room | null;
  onBook: (roomId: string, customerName: string, hours: number) => void;
}

const BookingModal = ({ isOpen, onClose, room, onBook }: BookingModalProps) => {
  const [customerName, setCustomerName] = useState('');
  const [hours, setHours] = useState(1);

  if (!room) return null;

  const calculateCost = () => {
    return hours * room.pricing[room.mode];
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customerName.trim()) {
      onBook(room.id, customerName.trim(), hours);
      setCustomerName('');
      setHours(1);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GamepadIcon className="w-5 h-5" />
            Book {room.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Badge className={room.console === 'PS5' ? 'bg-blue-600' : 'bg-purple-600'}>
              {room.console}
            </Badge>
            <Badge variant="outline" className="text-white border-slate-500">
              {room.mode === 'single' ? 'Single Player' : 'Multiplayer'}
            </Badge>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="customerName" className="text-white">Customer Name</Label>
              <Input
                id="customerName"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter customer name"
                className="bg-slate-700 border-slate-600 text-white"
                required
              />
            </div>

            <div>
              <Label htmlFor="hours" className="text-white">Hours</Label>
              <Input
                id="hours"
                type="number"
                min="1"
                max="12"
                value={hours}
                onChange={(e) => setHours(parseInt(e.target.value) || 1)}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>

            <div className="bg-slate-700 p-4 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <ClockIcon className="w-4 h-4" />
                  Duration:
                </span>
                <span>{hours} hour(s)</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Rate:</span>
                <span>{room.pricing[room.mode]} EGP/hr</span>
              </div>
              <div className="flex items-center justify-between text-lg font-bold text-green-400 border-t border-slate-600 pt-2">
                <span className="flex items-center gap-2">
                  <DollarSignIcon className="w-4 h-4" />
                  Total:
                </span>
                <span>{calculateCost()} EGP</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700">
                Start Session
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BookingModal;
