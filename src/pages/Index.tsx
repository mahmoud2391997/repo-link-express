
import { User } from '@supabase/supabase-js';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { LogOutIcon, SettingsIcon } from 'lucide-react';
import AdminDashboard from '@/components/AdminDashboard';
import CashierDashboard from '@/components/CashierDashboard';
import Reports from '@/components/Reports';

interface UserProfile {
  id: string;
  email: string;
  role: string;
}

interface IndexProps {
  user: User;
  userProfile: UserProfile;
  onSignOut: () => void;
}

const Index = ({ user, userProfile, onSignOut }: IndexProps) => {
  const isAdmin = userProfile.role === 'admin';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Zone 14 Gaming Center</h1>
            <p className="text-gray-400">
              Welcome back, {user.email} ({userProfile.role})
            </p>
          </div>
          <Button onClick={onSignOut} variant="outline" className="text-white border-white hover:bg-white hover:text-black">
            <LogOutIcon className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>

        {/* Main Content */}
        {isAdmin ? (
          <Tabs defaultValue="admin" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 bg-slate-800 border-0 max-w-md">
              <TabsTrigger value="admin" className="data-[state=active]:bg-blue-600 text-white">
                <SettingsIcon className="w-4 h-4 mr-2" />
                Admin Panel
              </TabsTrigger>
              <TabsTrigger value="reports" className="data-[state=active]:bg-blue-600 text-white">
                Reports
              </TabsTrigger>
            </TabsList>

            <TabsContent value="admin">
              <AdminDashboard />
            </TabsContent>

            <TabsContent value="reports">
              <Reports />
            </TabsContent>
          </Tabs>
        ) : (
          <CashierDashboard />
        )}
      </div>
    </div>
  );
};

export default Index;
