import { toast } from "@/hooks/use-toast";

export const createBackup = async () => {
  try {
    // In an Electron app, we would use the main process to handle file operations
    // For now, we'll export data as JSON that can be saved manually
    
    const { getRooms, getOrders, getAppointments, getCafeProducts, getTransactions } = await import('@/services/dbService');
    
    const [rooms, orders, appointments, cafeProducts, transactions] = await Promise.all([
      getRooms(),
      getOrders(),
      getAppointments(),
      getCafeProducts(),
      getTransactions()
    ]);
    
    const backupData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      data: {
        rooms,
        orders,
        appointments,
        cafeProducts,
        transactions
      }
    };
    
    // Create downloadable backup file
    const dataStr = JSON.stringify(backupData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `gaming-center-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Backup Created",
      description: "Database backup has been downloaded successfully",
      duration: 5000,
    });
    
    return true;
  } catch (error) {
    console.error('Backup creation failed:', error);
    toast({
      title: "Backup Failed",
      description: "Failed to create database backup",
      variant: "destructive",
      duration: 5000,
    });
    return false;
  }
};

export const validateBackupFile = (file: File): Promise<boolean> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        // Basic validation
        if (!data.version || !data.timestamp || !data.data) {
          resolve(false);
          return;
        }
        
        // Check required tables
        const requiredTables = ['rooms', 'orders', 'appointments', 'cafeProducts', 'transactions'];
        const hasAllTables = requiredTables.every(table => Array.isArray(data.data[table]));
        
        resolve(hasAllTables);
      } catch {
        resolve(false);
      }
    };
    reader.readAsText(file);
  });
};