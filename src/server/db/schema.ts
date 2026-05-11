import { pgTable, text, timestamp, uuid, decimal, integer, boolean, jsonb } from 'drizzle-orm/pg-core';

export const restaurants = pgTable('restaurants', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull().default(''),
  slug: text('slug').unique(),
  description: text('description'),
  email: text('email'),
  foodType: text('food_type'),
  logoUrl: text('logo_url'),
  bannerUrl: text('banner_url'),
  primaryColor: text('primary_color'),
  address: text('address'),
  cep: text('cep'),
  complement: text('complement'),
  neighborhood: text('neighborhood'),
  city: text('city'),
  state: text('state'),
  phone: text('phone'),
  whatsapp: text('whatsapp'),
  openingHours: jsonb('opening_hours'),
  deliveryConfig: jsonb('delivery_config'),
  subscriptionPlan: text('subscription_plan').default('bronze'),
  stripeCustomerId: text('stripe_customer_id'),
  themePreference: text('theme_preference').default('light'),
  messageCredits: integer('message_credits').default(30),
  messagesSentThisMonth: integer('messages_sent_this_month').default(0),
  ownerId: uuid('owner_id'),
  evolutionApiUrl: text('evolution_api_url'),
  evolutionApiKey: text('evolution_api_key'),
  evolutionInstance: text('evolution_instance'),
  role: text('role').default('user'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const categories = pgTable('categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  restaurantId: uuid('restaurant_id').references(() => restaurants.id),
  name: text('name').notNull(),
  color: text('color'),
  order: integer('order').default(0),
  parentId: uuid('parent_id'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const products = pgTable('products', {
  id: uuid('id').defaultRandom().primaryKey(),
  restaurantId: uuid('restaurant_id').references(() => restaurants.id),
  categoryId: uuid('category_id').references(() => categories.id),
  subcategoryId: uuid('subcategory_id'),
  name: text('name').notNull(),
  description: text('description'),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  imageUrl: text('image_url'),
  optionals: jsonb('optionals'), 
  createdAt: timestamp('created_at').defaultNow(),
});

export const subcategories = pgTable('subcategories', {
  id: uuid('id').defaultRandom().primaryKey(),
  categoryId: uuid('category_id').references(() => categories.id),
  name: text('name').notNull(),
  order: integer('order').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

export const optionalGroups = pgTable('optional_groups', {
  id: uuid('id').defaultRandom().primaryKey(),
  restaurantId: uuid('restaurant_id').references(() => restaurants.id),
  name: text('name').notNull(),
  isMandatory: boolean('is_mandatory').default(false),
  maxSelection: integer('max_selection').default(1),
  createdAt: timestamp('created_at').defaultNow(),
});

export const optionalItems = pgTable('optional_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  groupId: uuid('group_id').references(() => optionalGroups.id),
  name: text('name').notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).default('0'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const settings = pgTable('settings', {
  id: uuid('id').defaultRandom().primaryKey(),
  key: text('key').unique().notNull(),
  value: jsonb('value').notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const customers = pgTable('customers', {
  id: uuid('id').defaultRandom().primaryKey(),
  restaurantId: uuid('restaurant_id').references(() => restaurants.id),
  name: text('name').notNull(),
  email: text('email').unique(),
  phone: text('phone').notNull(),
  password: text('password'), // Hash da senha para login
  createdAt: timestamp('created_at').defaultNow(),
});

export const customerAddresses = pgTable('customer_addresses', {
  id: uuid('id').defaultRandom().primaryKey(),
  customerId: uuid('customer_id').references(() => customers.id),
  name: text('name').notNull(), // Ex: Casa, Trabalho
  cep: text('cep').notNull(),
  address: text('address').notNull(),
  number: text('number').notNull(),
  complement: text('complement'),
  neighborhood: text('neighborhood').notNull(),
  city: text('city').notNull(),
  state: text('state').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const orders = pgTable('orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  restaurantId: uuid('restaurant_id').references(() => restaurants.id),
  customerId: uuid('customer_id').references(() => customers.id),
  items: jsonb('items').notNull(),
  total: decimal('total', { precision: 10, scale: 2 }).notNull(),
  status: text('status').default('pending'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const plans = pgTable('plans', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  stripePriceId: text('stripe_price_id'),
  iconName: text('icon_name').default('zap'),
  features: jsonb('features').default([]),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

export const coupons = pgTable('coupons', {
  id: uuid('id').defaultRandom().primaryKey(),
  restaurantId: uuid('restaurant_id').references(() => restaurants.id),
  code: text('code').notNull(),
  type: text('type').notNull(), // 'percentage' | 'fixed'
  value: decimal('value', { precision: 10, scale: 2 }).notNull(),
  expiresAt: timestamp('expires_at'),
  usageLimit: integer('usage_limit'),
  usageCount: integer('usage_count').default(0),
  active: boolean('active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});
