import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { LogOutIcon, SettingsIcon, UsersIcon, CalendarIcon } from 'lucide-react';
import AdminDashboard from '@/components/AdminDashboard';
import CashierDashboard from '@/components/CashierDashboard';
import Reports from '@/components/Reports';
import UserEmailManagement from '@/components/UserEmailManagement';

const Index = () => {
  // For a local desktop application, we can assume admin privileges or simplify the UI.
  // For now, we'll directly render the CashierDashboard.
  // If admin functionality is still desired, it would need a local authentication mechanism.

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Zone 14 Gaming Center</h1>
            <p className="text-gray-400">
              Welcome to the desktop application.
            </p>
          </div>
        </div>

        {/* Main Content */}
        <CashierDashboard />
      </div>
    </div>
  );
};

export default Index;


