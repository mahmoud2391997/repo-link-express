import knex from 'knex';
import path from 'path';
import { app, dialog } from 'electron';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const userDataPath = app.getPath('userData');
const dbPath = path.join(userDataPath, 'database.sqlite');

// Ensure the user data directory exists
if (!fs.existsSync(userDataPath)) {
  fs.mkdirSync(userDataPath, { recursive: true });
}

export const db = knex({
  client: 'better-sqlite3',
  connection: {
    filename: dbPath,
  },
  useNullAsDefault: true,
  pool: {
    min: 1,
    max: 1,
    acquireTimeoutMillis: 60000,
    createTimeoutMillis: 30000,
    destroyTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 200,
  },
});

export const initializeDatabase = async () => {
  try {
    console.log('Initializing database at:', dbPath);
    
    // Test database connection
    await db.raw('SELECT 1');
    
    // Create tables with proper error handling
    await createTables();
    
    // Seed initial data
    await seedInitialData();
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
    
    // Show error dialog to user
    dialog.showErrorBox(
      'Database Error',
      `Failed to initialize database: ${error.message}\n\nThe application may not work correctly.`
    );
    
    throw error;
  }
};

const createTables = async () => {
  // Rooms Table
  await db.schema.createTableIfNotExists('rooms', (table) => {
    table.text('id').notNullable().primary();
    table.text('name').notNullable();
    table.text('console_type').notNullable();
    table.text('status').notNullable().defaultTo('available');
    table.text('current_mode');
    table.decimal('pricing_single', 10, 2).notNullable();
    table.decimal('pricing_multiplayer', 10, 2).notNullable();
    table.text('current_customer_name');
    table.timestamp('current_session_start');
    table.timestamp('current_session_end');
    table.decimal('current_total_cost', 10, 2).defaultTo(0);
    table.timestamp('created_at').defaultTo(db.fn.now());
    table.timestamp('updated_at').defaultTo(db.fn.now());
  });

  // Appointments Table
  await db.schema.createTableIfNotExists('appointments', (table) => {
    table.text('id').notNullable().primary();
    table.text('room_id').notNullable();
    table.text('customer_name').notNullable();
    table.date('appointment_date').notNullable();
    table.time('appointment_time').notNullable();
    table.decimal('duration_hours', 3, 1).notNullable();
    table.text('status').notNullable().defaultTo('scheduled');
    table.timestamp('created_at').defaultTo(db.fn.now());
    table.timestamp('updated_at').defaultTo(db.fn.now());
    table.foreign('room_id').references('rooms.id');
  });

  // Orders Table
  await db.schema.createTableIfNotExists('orders', (table) => {
    table.text('id').notNullable().primary();
    table.text('room_id');
    table.text('customer_name').notNullable();
    table.text('order_type').notNullable();
    table.decimal('total_amount', 10, 2).notNullable().defaultTo(0);
    table.text('status').notNullable().defaultTo('active');
    table.text('start_time');
    table.text('end_time');
    table.text('mode');
    table.boolean('is_open_time').defaultTo(false);
    table.decimal('duration_hours', 3, 1);
    table.timestamp('created_at').defaultTo(db.fn.now());
    table.timestamp('updated_at').defaultTo(db.fn.now());
    table.foreign('room_id').references('rooms.id');
  });

  // Order Items Table
  await db.schema.createTableIfNotExists('order_items', (table) => {
    table.text('id').notNullable().primary();
    table.text('order_id').notNullable();
    table.text('item_type').notNullable();
    table.text('item_name').notNullable();
    table.integer('quantity').notNullable().defaultTo(1);
    table.decimal('unit_price', 10, 2).notNullable();
    table.decimal('total_price', 10, 2).notNullable();
    table.timestamp('created_at').defaultTo(db.fn.now());
    table.foreign('order_id').references('orders.id').onDelete('CASCADE');
  });

  // Transactions Table
  await db.schema.createTableIfNotExists('transactions', (table) => {
    table.text('id').notNullable().primary();
    table.text('order_id').notNullable();
    table.text('transaction_type').notNullable();
    table.decimal('amount', 10, 2).notNullable();
    table.text('payment_method').notNullable().defaultTo('cash');
    table.text('description');
    table.timestamp('created_at').defaultTo(db.fn.now());
    table.foreign('order_id').references('orders.id').onDelete('CASCADE');
  });

  // Cafe Products Table
  await db.schema.createTableIfNotExists('cafe_products', (table) => {
    table.text('id').notNullable().primary();
    table.text('name').notNullable();
    table.text('category').notNullable();
    table.decimal('price', 10, 2).notNullable();
    table.integer('stock').notNullable().defaultTo(0);
    table.boolean('active').notNullable().defaultTo(true);
    table.timestamp('created_at').defaultTo(db.fn.now());
    table.timestamp('updated_at').defaultTo(db.fn.now());
  });

  // Create indexes for better performance
  await db.schema.raw(`
    CREATE INDEX IF NOT EXISTS idx_appointments_room_date ON appointments(room_id, appointment_date);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
    CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_order_id ON transactions(order_id);
    CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status);
  `);
};

const seedInitialData = async () => {
  // Seed initial rooms
  const roomsCount = await db('rooms').count('id as count');
  if (roomsCount[0].count === 0) {
    await db('rooms').insert([
      { id: 'room-1', name: 'Gaming Room 1', console_type: 'PS5', pricing_single: 25.00, pricing_multiplayer: 35.00 },
      { id: 'room-2', name: 'Gaming Room 2', console_type: 'PS5', pricing_single: 25.00, pricing_multiplayer: 35.00 },
      { id: 'room-3', name: 'Gaming Room 3', console_type: 'Xbox', pricing_single: 20.00, pricing_multiplayer: 30.00 },
      { id: 'room-4', name: 'Gaming Room 4', console_type: 'PS5', pricing_single: 25.00, pricing_multiplayer: 35.00 },
      { id: 'room-5', name: 'Gaming Room 5', console_type: 'Xbox', pricing_single: 20.00, pricing_multiplayer: 30.00 },
      { id: 'room-6', name: 'Gaming Room 6', console_type: 'PS5', pricing_single: 25.00, pricing_multiplayer: 35.00 },
      { id: 'room-7', name: 'Gaming Room 7', console_type: 'Xbox', pricing_single: 20.00, pricing_multiplayer: 30.00 },
      { id: 'room-8', name: 'Gaming Room 8', console_type: 'PS5', pricing_single: 25.00, pricing_multiplayer: 35.00 },
    ]);
  }

  // Seed initial cafe products
  const productsCount = await db('cafe_products').count('id as count');
  if (productsCount[0].count === 0) {
    await db('cafe_products').insert([
      { id: 'prod-1', name: 'Coffee', category: 'drinks', price: 15.00, stock: 50 },
      { id: 'prod-2', name: 'Pepsi', category: 'drinks', price: 10.00, stock: 30 },
      { id: 'prod-3', name: 'Water', category: 'drinks', price: 5.00, stock: 100 },
      { id: 'prod-4', name: 'Chips', category: 'snacks', price: 12.00, stock: 25 },
      { id: 'prod-5', name: 'Chocolate', category: 'snacks', price: 20.00, stock: 40 },
      { id: 'prod-6', name: 'Burger', category: 'meals', price: 50.00, stock: 15 },
      { id: 'prod-7', name: 'Pizza Slice', category: 'meals', price: 35.00, stock: 20 },
    ]);
  }
};

// Graceful shutdown
export const closeDatabase = async () => {
  try {
    await db.destroy();
    console.log('Database connection closed successfully');
  } catch (error) {
    console.error('Error closing database:', error);
  }
};