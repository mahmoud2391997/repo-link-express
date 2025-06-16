
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlusIcon, EditIcon, TrashIcon, SettingsIcon } from 'lucide-react';
import RoomsManagement from './RoomsManagement';
import AppointmentsManagement from './AppointmentsManagement';
import OrdersManagement from './OrdersManagement';
import CafeManagement from './CafeManagement';
import TransactionsManagement from './TransactionsManagement';

const AdminDashboard = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Admin Dashboard</h2>
        <Badge variant="outline" className="text-white border-white">
          <SettingsIcon className="w-4 h-4 mr-2" />
          Management Panel
        </Badge>
      </div>

      <Tabs defaultValue="rooms" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 bg-slate-800 border-0">
          <TabsTrigger value="rooms" className="data-[state=active]:bg-blue-600 text-white">
            Rooms
          </TabsTrigger>
          <TabsTrigger value="appointments" className="data-[state=active]:bg-blue-600 text-white">
            Appointments
          </TabsTrigger>
          <TabsTrigger value="orders" className="data-[state=active]:bg-blue-600 text-white">
            Orders
          </TabsTrigger>
          <TabsTrigger value="cafe" className="data-[state=active]:bg-blue-600 text-white">
            Café Products
          </TabsTrigger>
          <TabsTrigger value="transactions" className="data-[state=active]:bg-blue-600 text-white">
            Transactions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rooms">
          <RoomsManagement />
        </TabsContent>

        <TabsContent value="appointments">
          <AppointmentsManagement />
        </TabsContent>

        <TabsContent value="orders">
          <OrdersManagement />
        </TabsContent>

        <TabsContent value="cafe">
          <CafeManagement />
        </TabsContent>

        <TabsContent value="transactions">
          <TransactionsManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
