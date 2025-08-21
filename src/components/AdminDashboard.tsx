
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GamepadIcon, ShoppingCartIcon, CalendarIcon, DollarSignIcon, SettingsIcon, DatabaseIcon, CogIcon } from 'lucide-react';
import RoomsManagement from '@/components/RoomsManagement';
import CafeManagement from '@/components/CafeManagement';
import RoomSchedule from '@/components/RoomSchedule';
import UserManagement from '@/components/UserManagement';
import BackupRestore from '@/components/BackupRestore';
import Reports from '@/components/Reports';
import SystemSettings from '@/components/SystemSettings';

const AdminDashboard = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Total Rooms</CardTitle>
            <GamepadIcon className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">8</div>
            <p className="text-xs text-gray-400">4 PS5, 4 Xbox</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Monthly Revenue</CardTitle>
            <DollarSignIcon className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">45,250 EGP</div>
            <p className="text-xs text-gray-400">+12% from last month</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Active Sessions</CardTitle>
            <CalendarIcon className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">5</div>
            <p className="text-xs text-gray-400">Currently running</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Cafe Products</CardTitle>
            <ShoppingCartIcon className="h-4 w-4 text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">45</div>
            <p className="text-xs text-gray-400">Items available</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="rooms" className="space-y-6">
        <TabsList className="grid w-full grid-cols-8 bg-slate-800 border-0">
          <TabsTrigger value="rooms" className="data-[state=active]:bg-blue-600 text-white">
            <GamepadIcon className="w-4 h-4 mr-2" />
            Rooms
          </TabsTrigger>
          <TabsTrigger value="schedule" className="data-[state=active]:bg-purple-600 text-white">
            <CalendarIcon className="w-4 h-4 mr-2" />
            Schedule
          </TabsTrigger>
          <TabsTrigger value="cafe" className="data-[state=active]:bg-orange-600 text-white">
            <ShoppingCartIcon className="w-4 h-4 mr-2" />
            Café Products
          </TabsTrigger>
          <TabsTrigger value="users" className="data-[state=active]:bg-green-600 text-white">
            <SettingsIcon className="w-4 h-4 mr-2" />
            Users
          </TabsTrigger>
          <TabsTrigger value="reports" className="data-[state=active]:bg-indigo-600 text-white">
            <DollarSignIcon className="w-4 h-4 mr-2" />
            Reports
          </TabsTrigger>
          <TabsTrigger value="backup" className="data-[state=active]:bg-purple-600 text-white">
            <DatabaseIcon className="w-4 h-4 mr-2" />
            Backup
          </TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-gray-600 text-white">
            <CogIcon className="w-4 h-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rooms">
          <RoomsManagement />
        </TabsContent>

        <TabsContent value="schedule">
          <RoomSchedule />
        </TabsContent>

        <TabsContent value="cafe">
          <CafeManagement />
        </TabsContent>

        <TabsContent value="users">
          <UserManagement />
        </TabsContent>

        <TabsContent value="reports">
          <Reports />
        </TabsContent>

        <TabsContent value="backup">
          <BackupRestore />
        </TabsContent>

        <TabsContent value="settings">
          <SystemSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
