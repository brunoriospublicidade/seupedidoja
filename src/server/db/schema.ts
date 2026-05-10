import { pgTable, text, timestamp, uuid, decimal, integer, boolean, jsonb } from 'drizzle-orm/pg-core';

export const restaurants = pgTable('restaurants', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').unique(),
  description: text('description'),
  foodType: text('food_type'),
  logoUrl: text('logo_url'),
  bannerUrl: text('banner_url'),
  primaryColor: text('primary_color'),
  address: text('address'),
  phone: text('phone'),
  whatsapp: text('whatsapp'),
  openingHours: jsonb('opening_hours'),
  deliveryConfig: jsonb('delivery_config'),
  subscriptionPlan: text('subscription_plan').default('bronze'),
  themePreference: text('theme_preference').default('light'),
  ownerId: uuid('owner_id'),
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
  name: text('name').notNull(),
  description: text('description'),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  imageUrl: text('image_url'),
  optionals: jsonb('optionals'), 
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
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone').notNull(),
  address: text('address'),
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
  features: jsonb('features').default([]),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});
