
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3Icon, DollarSignIcon, TrendingUpIcon, UsersIcon } from 'lucide-react';
import { getReportData } from '@/services/supabaseService';

const Reports = () => {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [reportData, setReportData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    roomRevenue: 0,
    cafeRevenue: 0,
  });

  const loadReportData = async () => {
    setIsLoading(true);
    try {
      const data = await getReportData(period);
      setReportData(data);
      
      // Calculate stats - convert to numbers explicitly
      const totalRevenue = data.reduce((sum, tx) => sum + Number(tx.amount), 0);
      const totalOrders = data.length;
      const roomRevenue = data
        .filter(tx => tx.orders?.order_type === 'room_reservation')
        .reduce((sum, tx) => sum + Number(tx.amount), 0);
      const cafeRevenue = data
        .filter(tx => tx.orders?.order_type === 'cafe_order')
        .reduce((sum, tx) => sum + Number(tx.amount), 0);
      
      setStats({ totalRevenue, totalOrders, roomRevenue, cafeRevenue });
    } catch (error) {
      console.error('Error loading report data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReportData();
  }, [period]);

  const getPeriodLabel = () => {
    switch (period) {
      case 'daily': return 'Today';
      case 'weekly': return 'This Week';
      case 'monthly': return 'This Month';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Reports & Analytics</h2>
        <div className="flex gap-4">
          <Select value={period} onValueChange={(value: 'daily' | 'weekly' | 'monthly') => setPeriod(value)}>
            <SelectTrigger className="w-40 bg-slate-700 border-slate-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-700 border-slate-600">
              <SelectItem value="daily" className="text-white hover:bg-slate-600">Daily</SelectItem>
              <SelectItem value="weekly" className="text-white hover:bg-slate-600">Weekly</SelectItem>
              <SelectItem value="monthly" className="text-white hover:bg-slate-600">Monthly</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={loadReportData} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
            {isLoading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-green-600 to-green-700 border-0 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSignIcon className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRevenue.toFixed(2)} EGP</div>
            <p className="text-xs text-green-100">{getPeriodLabel()}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-600 to-blue-700 border-0 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <UsersIcon className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-blue-100">{getPeriodLabel()}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-600 to-purple-700 border-0 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Room Revenue</CardTitle>
            <TrendingUpIcon className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.roomRevenue.toFixed(2)} EGP</div>
            <p className="text-xs text-purple-100">{getPeriodLabel()}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-600 to-orange-700 border-0 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Café Revenue</CardTitle>
            <BarChart3Icon className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.cafeRevenue.toFixed(2)} EGP</div>
            <p className="text-xs text-orange-100">{getPeriodLabel()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Transactions List */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Recent Transactions - {getPeriodLabel()}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {reportData.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                <div className="text-white">
                  <div className="font-medium">{transaction.orders?.customer_name || 'Unknown'}</div>
                  <div className="text-sm text-gray-300">
                    {transaction.orders?.order_type?.replace('_', ' ').toUpperCase()} - {transaction.payment_method}
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(transaction.created_at).toLocaleString()}
                  </div>
                </div>
                <div className="text-green-400 font-bold">
                  +{Number(transaction.amount).toFixed(2)} EGP
                </div>
              </div>
            ))}
            {reportData.length === 0 && !isLoading && (
              <div className="text-center text-gray-400 py-8">
                No transactions found for {getPeriodLabel().toLowerCase()}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
