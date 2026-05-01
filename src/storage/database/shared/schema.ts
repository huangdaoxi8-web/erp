import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer, jsonb, index } from "drizzle-orm/pg-core";
import { createSchemaFactory } from "drizzle-zod";
import { z } from "zod";

// ============ 用户资料表 ============
export const profiles = pgTable(
  "profiles",
  {
    id: varchar("id", { length: 36 }).primaryKey(), // 关联 auth.users.id
    phone: varchar("phone", { length: 20 }).notNull().unique(),
    nickname: varchar("nickname", { length: 100 }),
    avatar: text("avatar"),
    role: varchar("role", { length: 20 }).notNull().default("user"), // admin, manager, user
    is_active: boolean("is_active").default(true).notNull(),
    last_login_at: timestamp("last_login_at", { withTimezone: true }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("profiles_phone_idx").on(table.phone),
    index("profiles_role_idx").on(table.role),
  ]
);

// ============ 客户表 ============
export const customers = pgTable(
  "customers",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    name: varchar("name", { length: 200 }).notNull(),
    contact_person: varchar("contact_person", { length: 100 }),
    phone: varchar("phone", { length: 20 }),
    address: text("address"),
    remark: text("remark"),
    created_by: varchar("created_by", { length: 36 }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("customers_name_idx").on(table.name),
    index("customers_phone_idx").on(table.phone),
  ]
);

// ============ 订单主表 ============
export const orders = pgTable(
  "orders",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    order_no: varchar("order_no", { length: 50 }).notNull().unique(),
    customer_id: varchar("customer_id", { length: 36 }).references(() => customers.id),
    customer_name: varchar("customer_name", { length: 200 }),
    status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, received, in_production, completed, shipped, returned
    total_amount: integer("total_amount").default(0), // 金额单位：分
    delivery_date: timestamp("delivery_date", { withTimezone: true }),
    remark: text("remark"),
    received_at: timestamp("received_at", { withTimezone: true }),
    received_by: varchar("received_by", { length: 36 }),
    created_by: varchar("created_by", { length: 36 }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("orders_order_no_idx").on(table.order_no),
    index("orders_customer_id_idx").on(table.customer_id),
    index("orders_status_idx").on(table.status),
    index("orders_created_at_idx").on(table.created_at),
    index("orders_delivery_date_idx").on(table.delivery_date),
  ]
);

// ============ 订单明细表 ============
export const order_items = pgTable(
  "order_items",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    order_id: varchar("order_id", { length: 36 }).notNull().references(() => orders.id, { onDelete: "cascade" }),
    product_name: varchar("product_name", { length: 200 }).notNull(),
    specification: varchar("specification", { length: 500 }),
    quantity: integer("quantity").notNull().default(1),
    unit: varchar("unit", { length: 20 }).default("件"),
    unit_price: integer("unit_price").default(0), // 单价单位：分
    subtotal: integer("subtotal").default(0), // 小计单位：分
    workshop_id: varchar("workshop_id", { length: 36 }).references(() => workshops.id),
    production_status: varchar("production_status", { length: 20 }).default("pending"), // pending, in_progress, completed
    completed_quantity: integer("completed_quantity").default(0),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("order_items_order_id_idx").on(table.order_id),
    index("order_items_workshop_id_idx").on(table.workshop_id),
    index("order_items_production_status_idx").on(table.production_status),
  ]
);

// ============ 车间表 ============
export const workshops = pgTable(
  "workshops",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    name: varchar("name", { length: 100 }).notNull(),
    code: varchar("code", { length: 20 }).notNull().unique(),
    location: varchar("location", { length: 200 }),
    manager_id: varchar("manager_id", { length: 36 }),
    status: varchar("status", { length: 20 }).default("active"), // active, inactive
    remark: text("remark"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("workshops_code_idx").on(table.code),
    index("workshops_status_idx").on(table.status),
  ]
);

// ============ 任务表 ============
export const tasks = pgTable(
  "tasks",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    title: varchar("title", { length: 200 }).notNull(),
    order_item_id: varchar("order_item_id", { length: 36 }).references(() => order_items.id),
    workshop_id: varchar("workshop_id", { length: 36 }).references(() => workshops.id),
    assigned_to: varchar("assigned_to", { length: 36 }),
    assigned_by: varchar("assigned_by", { length: 36 }),
    priority: varchar("priority", { length: 10 }).default("normal"), // low, normal, high, urgent
    status: varchar("status", { length: 20 }).default("pending"), // pending, in_progress, completed, cancelled
    due_date: timestamp("due_date", { withTimezone: true }),
    completed_at: timestamp("completed_at", { withTimezone: true }),
    remark: text("remark"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("tasks_order_item_id_idx").on(table.order_item_id),
    index("tasks_workshop_id_idx").on(table.workshop_id),
    index("tasks_assigned_to_idx").on(table.assigned_to),
    index("tasks_status_idx").on(table.status),
    index("tasks_priority_idx").on(table.priority),
    index("tasks_due_date_idx").on(table.due_date),
  ]
);

// ============ 生产进度表 ============
export const production_progress = pgTable(
  "production_progress",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    order_item_id: varchar("order_item_id", { length: 36 }).notNull().references(() => order_items.id, { onDelete: "cascade" }),
    workshop_id: varchar("workshop_id", { length: 36 }).references(() => workshops.id),
    progress: integer("progress").notNull().default(0), // 0-100
    stage: varchar("stage", { length: 50 }),
    description: text("description"),
    operator_id: varchar("operator_id", { length: 36 }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("production_progress_order_item_id_idx").on(table.order_item_id),
    index("production_progress_workshop_id_idx").on(table.workshop_id),
    index("production_progress_created_at_idx").on(table.created_at),
  ]
);

// ============ 发货表 ============
export const shipping = pgTable(
  "shipping",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    shipping_no: varchar("shipping_no", { length: 50 }).notNull().unique(),
    order_id: varchar("order_id", { length: 36 }).references(() => orders.id),
    customer_id: varchar("customer_id", { length: 36 }).references(() => customers.id),
    receiver_name: varchar("receiver_name", { length: 100 }),
    receiver_phone: varchar("receiver_phone", { length: 20 }),
    receiver_address: text("receiver_address"),
    logistics_company: varchar("logistics_company", { length: 100 }),
    tracking_no: varchar("tracking_no", { length: 100 }),
    status: varchar("status", { length: 20 }).default("pending"), // pending, shipped, in_transit, delivered
    shipped_at: timestamp("shipped_at", { withTimezone: true }),
    delivered_at: timestamp("delivered_at", { withTimezone: true }),
    remark: text("remark"),
    created_by: varchar("created_by", { length: 36 }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("shipping_shipping_no_idx").on(table.shipping_no),
    index("shipping_order_id_idx").on(table.order_id),
    index("shipping_customer_id_idx").on(table.customer_id),
    index("shipping_status_idx").on(table.status),
    index("shipping_tracking_no_idx").on(table.tracking_no),
  ]
);

// ============ 操作日志表 ============
export const operation_logs = pgTable(
  "operation_logs",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    operator_id: varchar("operator_id", { length: 36 }),
    action: varchar("action", { length: 50 }).notNull(),
    entity_type: varchar("entity_type", { length: 50 }),
    entity_id: varchar("entity_id", { length: 36 }),
    detail: jsonb("detail"),
    ip_address: varchar("ip_address", { length: 50 }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("operation_logs_operator_id_idx").on(table.operator_id),
    index("operation_logs_action_idx").on(table.action),
    index("operation_logs_entity_type_idx").on(table.entity_type),
    index("operation_logs_created_at_idx").on(table.created_at),
  ]
);

// ============ Zod Schema 生成 ============
const { createInsertSchema: createProfileInsertSchema } = createSchemaFactory({ coerce: { date: true } });
export const insertProfileSchema = createProfileInsertSchema(profiles).omit({ created_at: true });
export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = z.infer<typeof insertProfileSchema>;

const { createInsertSchema: createCustomerInsertSchema } = createSchemaFactory({ coerce: { date: true } });
export const insertCustomerSchema = createCustomerInsertSchema(customers).omit({ id: true, created_at: true });
export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;

const { createInsertSchema: createOrderInsertSchema } = createSchemaFactory({ coerce: { date: true } });
export const insertOrderSchema = createOrderInsertSchema(orders).omit({ id: true, created_at: true });
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

const { createInsertSchema: createOrderItemInsertSchema } = createSchemaFactory({ coerce: { date: true } });
export const insertOrderItemSchema = createOrderItemInsertSchema(order_items).omit({ id: true, created_at: true });
export type OrderItem = typeof order_items.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;

const { createInsertSchema: createWorkshopInsertSchema } = createSchemaFactory({ coerce: { date: true } });
export const insertWorkshopSchema = createWorkshopInsertSchema(workshops).omit({ id: true, created_at: true });
export type Workshop = typeof workshops.$inferSelect;
export type InsertWorkshop = z.infer<typeof insertWorkshopSchema>;

const { createInsertSchema: createTaskInsertSchema } = createSchemaFactory({ coerce: { date: true } });
export const insertTaskSchema = createTaskInsertSchema(tasks).omit({ id: true, created_at: true });
export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

const { createInsertSchema: createShippingInsertSchema } = createSchemaFactory({ coerce: { date: true } });
export const insertShippingSchema = createShippingInsertSchema(shipping).omit({ id: true, created_at: true });
export type Shipping = typeof shipping.$inferSelect;
export type InsertShipping = z.infer<typeof insertShippingSchema>;

const { createInsertSchema: createProductionProgressInsertSchema } = createSchemaFactory({ coerce: { date: true } });
export const insertProductionProgressSchema = createProductionProgressInsertSchema(production_progress).omit({ id: true, created_at: true });
export type ProductionProgress = typeof production_progress.$inferSelect;
export type InsertProductionProgress = z.infer<typeof insertProductionProgressSchema>;
