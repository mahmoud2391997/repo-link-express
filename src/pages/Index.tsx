import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { LogOutIcon, SettingsIcon, UsersIcon, CalendarIcon, ShieldIcon } from 'lucide-react';
import AdminDashboard from '@/components/AdminDashboard';
import CashierDashboard from '@/components/CashierDashboard';
import Reports from '@/components/Reports';
import UserEmailManagement from '@/components/UserEmailManagement';
import { useState } from 'react';

const Index = () => {
  const [userRole, setUserRole] = useState<'admin' | 'cashier'>('cashier');
  const [showRoleSelector, setShowRoleSelector] = useState(true);

  if (showRoleSelector) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black flex items-center justify-center">
        <div className="bg-slate-800 border-slate-700 rounded-lg p-8 max-w-md w-full mx-4">
          <div className="text-center mb-6">
            <ShieldIcon className="w-12 h-12 text-blue-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Zone 14 Gaming Center</h1>
            <p className="text-gray-400">Select your access level</p>
          </div>
          
          <div className="space-y-4">
            <Button 
              onClick={() => {
                setUserRole('admin');
                setShowRoleSelector(false);
              }}
              variant="destructive"
              className="w-full h-12"
            >
              <SettingsIcon className="w-5 h-5 mr-2" />
              Administrator Access
            </Button>
            
            <Button 
              onClick={() => {
                setUserRole('cashier');
                setShowRoleSelector(false);
              }}
              className="w-full h-12"
            >
              <UsersIcon className="w-5 h-5 mr-2" />
              Cashier Access
            </Button>
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Desktop Application v1.0
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Zone 14 Gaming Center</h1>
            <p className="text-gray-400">
              Welcome, {userRole === 'admin' ? 'Administrator' : 'Cashier'}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button 
              onClick={() => setShowRoleSelector(true)}
              variant="outline"
              className="text-white border-slate-600"
            >
              <LogOutIcon className="w-4 h-4 mr-2" />
              Switch User
            </Button>
          </div>
        </div>

        {/* Main Content */}
        {userRole === 'admin' ? <AdminDashboard /> : <CashierDashboard />}
      </div>
    </div>
  );
};

export default Index;


