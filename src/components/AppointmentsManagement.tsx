
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PlusIcon, EditIcon, TrashIcon, CalendarIcon, ClockIcon } from 'lucide-react';
import { getAppointments, createAppointment, updateAppointment, deleteAppointment, getRooms, Appointment, Room } from "@/services/dbService";
import { useToast } from '@/hooks/use-toast';

const AppointmentsManagement = () => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    room_id: '',
    customer_name: '',
    appointment_date: '',
    appointment_time: '',
    duration_hours: 1,
    status: 'scheduled' as 'scheduled' | 'active' | 'completed' | 'cancelled'
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [appointmentsData, roomsData] = await Promise.all([
        getAppointments(),
        getRooms()
      ]);
      setAppointments(appointmentsData);
      setRooms(roomsData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load appointments",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setFormData({
      room_id: '',
      customer_name: '',
      appointment_date: '',
      appointment_time: '',
      duration_hours: 1,
      status: 'scheduled'
    });
    setEditingAppointment(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (editingAppointment) {
        await updateAppointment(editingAppointment.id!, formData);
        toast({
          title: "Success",
          description: "Appointment updated successfully",
        });
      } else {
        await createAppointment(formData);
        toast({
          title: "Success",
          description: "Appointment created successfully",
        });
      }
      
      resetForm();
      setIsModalOpen(false);
      loadData();
    } catch (error) {
      console.error('Error saving appointment:', error);
      toast({
        title: "Error",
        description: "Failed to save appointment",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (appointment: any) => {
    setEditingAppointment(appointment);
    setFormData({
      room_id: appointment.room_id,
      customer_name: appointment.customer_name,
      appointment_date: appointment.appointment_date,
      appointment_time: appointment.appointment_time,
      duration_hours: appointment.duration_hours,
      status: appointment.status
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this appointment?')) return;
    
    try {
      await deleteAppointment(id);
      toast({
        title: "Success",
        description: "Appointment deleted successfully",
      });
      loadData();
    } catch (error) {
      console.error('Error deleting appointment:', error);
      toast({
        title: "Error",
        description: "Failed to delete appointment",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-600';
      case 'active': return 'bg-green-600';
      case 'completed': return 'bg-gray-600';
      case 'cancelled': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white">Appointments Management</h3>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="bg-blue-600 hover:bg-blue-700">
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Appointment
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-800 border-slate-700 text-white">
            <DialogHeader>
              <DialogTitle>{editingAppointment ? 'Edit Appointment' : 'Add New Appointment'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Room</Label>
                <Select value={formData.room_id} onValueChange={(value) => setFormData({...formData, room_id: value})}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="Select a room" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    {rooms.map((room) => (
                      <SelectItem key={room.id} value={room.id} className="text-white">
                        {room.name} ({room.console_type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="customer_name">Customer Name</Label>
                <Input
                  id="customer_name"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
                  className="bg-slate-700 border-slate-600 text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="appointment_date">Date</Label>
                  <Input
                    id="appointment_date"
                    type="date"
                    value={formData.appointment_date}
                    onChange={(e) => setFormData({...formData, appointment_date: e.target.value})}
                    className="bg-slate-700 border-slate-600 text-white"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="appointment_time">Time</Label>
                  <Input
                    id="appointment_time"
                    type="time"
                    value={formData.appointment_time}
                    onChange={(e) => setFormData({...formData, appointment_time: e.target.value})}
                    className="bg-slate-700 border-slate-600 text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="duration_hours">Duration (hours)</Label>
                <Input
                  id="duration_hours"
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={formData.duration_hours}
                  onChange={(e) => setFormData({...formData, duration_hours: parseFloat(e.target.value)})}
                  className="bg-slate-700 border-slate-600 text-white"
                  required
                />
              </div>

              <div>
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(value: any) => setFormData({...formData, status: value})}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="scheduled" className="text-white">Scheduled</SelectItem>
                    <SelectItem value="active" className="text-white">Active</SelectItem>
                    <SelectItem value="completed" className="text-white">Completed</SelectItem>
                    <SelectItem value="cancelled" className="text-white">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading} className="flex-1 bg-green-600 hover:bg-green-700">
                  {isLoading ? 'Saving...' : editingAppointment ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {appointments.map((appointment) => (
          <Card key={appointment.id} className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5" />
                  {appointment.customer_name}
                </CardTitle>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(appointment)}>
                    <EditIcon className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(appointment.id)}>
                    <TrashIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <Badge className={getStatusColor(appointment.status)}>
                {appointment.status}
              </Badge>
            </CardHeader>
            
            <CardContent className="space-y-2">
              <div className="text-sm text-gray-300">
                <div>Room: {appointment.rooms?.name}</div>
                <div className="flex items-center gap-2">
                  <ClockIcon className="w-4 h-4" />
                  {appointment.appointment_date} at {appointment.appointment_time}
                </div>
                <div>Duration: {appointment.duration_hours}h</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AppointmentsManagement;
