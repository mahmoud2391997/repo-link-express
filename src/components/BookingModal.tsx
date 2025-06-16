
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { GamepadIcon, ClockIcon, DollarSignIcon, UserIcon, UsersIcon } from 'lucide-react';
import { Room } from '@/data/roomsData';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room | null;
  onBook: (roomId: string, customerName: string, hours: number, mode: 'single' | 'multiplayer') => void;
}

const BookingModal = ({ isOpen, onClose, room, onBook }: BookingModalProps) => {
  const [customerName, setCustomerName] = useState('');
  const [hours, setHours] = useState(1);
  const [selectedMode, setSelectedMode] = useState<'single' | 'multiplayer'>('single');

  if (!room) return null;

  const timeOptions = [
    { value: 0.5, label: '30 minutes' },
    { value: 1, label: '1 hour' },
    { value: 1.5, label: '1.5 hours' },
    { value: 2, label: '2 hours' },
    { value: 2.5, label: '2.5 hours' },
    { value: 3, label: '3 hours' },
    { value: 4, label: '4 hours' },
    { value: 5, label: '5 hours' },
    { value: 6, label: '6 hours' },
    { value: 8, label: '8 hours' },
    { value: 12, label: '12 hours' }
  ];

  const calculateCost = () => {
    return hours * room.pricing[selectedMode];
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customerName.trim()) {
      onBook(room.id, customerName.trim(), hours, selectedMode);
      setCustomerName('');
      setHours(1);
      setSelectedMode('single');
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
              <Label className="text-white mb-3 block">Game Mode</Label>
              <RadioGroup 
                value={selectedMode} 
                onValueChange={(value: 'single' | 'multiplayer') => setSelectedMode(value)}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="single" id="single" className="border-white" />
                  <Label htmlFor="single" className="text-white flex items-center gap-2 cursor-pointer">
                    <UserIcon className="w-4 h-4" />
                    Single Player
                    <span className="text-green-400">({room.pricing.single} EGP/hr)</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="multiplayer" id="multiplayer" className="border-white" />
                  <Label htmlFor="multiplayer" className="text-white flex items-center gap-2 cursor-pointer">
                    <UsersIcon className="w-4 h-4" />
                    Multiplayer
                    <span className="text-green-400">({room.pricing.multiplayer} EGP/hr)</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label className="text-white">Duration</Label>
              <Select value={hours.toString()} onValueChange={(value) => setHours(parseFloat(value))}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  {timeOptions.map((option) => (
                    <SelectItem 
                      key={option.value} 
                      value={option.value.toString()}
                      className="text-white hover:bg-slate-600"
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                <span>Mode:</span>
                <span className="flex items-center gap-1">
                  {selectedMode === 'single' ? <UserIcon className="w-4 h-4" /> : <UsersIcon className="w-4 h-4" />}
                  {selectedMode === 'single' ? 'Single Player' : 'Multiplayer'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Rate:</span>
                <span>{room.pricing[selectedMode]} EGP/hr</span>
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
