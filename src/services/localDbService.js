import knex from 'knex';
import path from 'path';
import { app } from 'electron';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const userDataPath = app.getPath('userData');
const dbPath = path.join(userDataPath, 'database.sqlite');

export const db = knex({
  client: 'better-sqlite3',
  connection: {
    filename: dbPath,
  },
  useNullAsDefault: true,
});

export const initializeDatabase = async () => {
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
    table.uuid('id').notNullable().primary().defaultTo(db.raw('gen_random_uuid()'));
    table.text('room_id').notNullable().references('rooms.id');
    table.text('customer_name').notNullable();
    table.date('appointment_date').notNullable();
    table.time('appointment_time').notNullable();
    table.decimal('duration_hours', 3, 1).notNullable();
    table.text('status').notNullable().defaultTo('scheduled');
    table.timestamp('created_at').defaultTo(db.fn.now());
    table.timestamp('updated_at').defaultTo(db.fn.now());
  });

  // Orders Table
  await db.schema.createTableIfNotExists('orders', (table) => {
    table.uuid('id').notNullable().primary().defaultTo(db.raw('gen_random_uuid()'));
    table.text('room_id').references('rooms.id');
    table.text('customer_name').notNullable();
    table.text('order_type').notNullable();
    table.decimal('total_amount', 10, 2).notNullable().defaultTo(0);
    table.text('status').notNullable().defaultTo('active');
    table.timestamp('start_time');
    table.timestamp('end_time');
    table.timestamp('created_at').defaultTo(db.fn.now());
    table.timestamp('updated_at').defaultTo(db.fn.now());
  });

  // Order Items Table
  await db.schema.createTableIfNotExists('order_items', (table) => {
    table.uuid('id').notNullable().primary().defaultTo(db.raw('gen_random_uuid()'));
    table.uuid('order_id').notNullable().references('orders.id').onDelete('CASCADE');
    table.text('item_type').notNullable();
    table.text('item_name').notNullable();
    table.integer('quantity').notNullable().defaultTo(1);
    table.decimal('unit_price', 10, 2).notNullable();
    table.decimal('total_price', 10, 2).notNullable();
    table.timestamp('created_at').defaultTo(db.fn.now());
  });

  // Transactions Table
  await db.schema.createTableIfNotExists('transactions', (table) => {
    table.uuid('id').notNullable().primary().defaultTo(db.raw('gen_random_uuid()'));
    table.uuid('order_id').notNullable().references('orders.id').onDelete('CASCADE');
    table.text('transaction_type').notNullable();
    table.decimal('amount', 10, 2).notNullable();
    table.text('payment_method').notNullable().defaultTo('cash');
    table.text('description');
    table.timestamp('created_at').defaultTo(db.fn.now());
  });

  // Cafe Products Table
  await db.schema.createTableIfNotExists('cafe_products', (table) => {
    table.uuid('id').notNullable().primary().defaultTo(db.raw('gen_random_uuid()'));
    table.text('name').notNullable();
    table.text('category').notNullable();
    table.decimal('price', 10, 2).notNullable();
    table.text('image_url');
    table.timestamp('created_at').defaultTo(db.fn.now());
    table.timestamp('updated_at').defaultTo(db.fn.now());
  });

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
};