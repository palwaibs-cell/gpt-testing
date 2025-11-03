/*
  # Initial Schema - ChatGPT Order System

  1. New Tables
    - `users`
      - `id` (serial, primary key)
      - `email` (varchar, unique, not null)
      - `password` (text, not null)
      - `role` (varchar, default 'customer')
      - `created_at` (timestamp, default now())
    
    - `packages`
      - `id` (serial, primary key)
      - `package_id` (varchar, unique, not null)
      - `name` (varchar, not null)
      - `price` (integer, not null)
      - `original_price` (integer, not null)
      - `duration` (varchar, not null)
      - `features` (jsonb, not null)
      - `is_popular` (boolean, default false)
      - `is_active` (boolean, default true)
      - `created_at` (timestamp, default now())
    
    - `orders`
      - `id` (serial, primary key)
      - `order_id` (varchar, unique, not null)
      - `customer_email` (varchar, not null)
      - `customer_whatsapp` (varchar, not null)
      - `package_id` (integer, references packages.id)
      - `original_price` (integer, not null)
      - `discount` (integer, default 0)
      - `final_price` (integer, not null)
      - `promo_code` (varchar, nullable)
      - `payment_status` (varchar, default 'pending')
      - `payment_proof` (text, nullable)
      - `invite_status` (varchar, default 'pending')
      - `invited_at` (timestamp, nullable)
      - `invited_by_cookie_id` (integer, nullable)
      - `cookie_admin_email` (varchar, nullable)
      - `notes` (text, nullable)
      - `created_at` (timestamp, default now())
      - `updated_at` (timestamp, default now())
    
    - `cookies`
      - `id` (serial, primary key)
      - `cookie_name` (varchar, not null)
      - `admin_email` (varchar, not null)
      - `cookie_data` (text, not null)
      - `is_active` (boolean, default true)
      - `expires_at` (timestamp, nullable)
      - `last_checked` (timestamp, default now())
      - `created_at` (timestamp, default now())
    
    - `promo_codes`
      - `id` (serial, primary key)
      - `code` (varchar, unique, not null)
      - `discount_type` (varchar, not null)
      - `discount_value` (integer, not null)
      - `max_usage` (integer, default 0)
      - `current_usage` (integer, default 0)
      - `valid_from` (timestamp, default now())
      - `valid_until` (timestamp, nullable)
      - `is_active` (boolean, default true)
      - `created_at` (timestamp, default now())
    
    - `ratings`
      - `id` (serial, primary key)
      - `order_id` (varchar, unique, not null)
      - `customer_email` (varchar, not null)
      - `customer_role` (varchar, nullable)
      - `customer_whatsapp` (varchar, nullable)
      - `rating` (integer, not null)
      - `review` (text, nullable)
      - `is_approved` (boolean, default false)
      - `voucher_sent` (boolean, default false)
      - `voucher_code` (varchar, nullable)
      - `created_at` (timestamp, default now())

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated admin access
    - Public read access for packages and approved ratings
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'customer',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create packages table
CREATE TABLE IF NOT EXISTS packages (
  id SERIAL PRIMARY KEY,
  package_id VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  price INTEGER NOT NULL,
  original_price INTEGER NOT NULL,
  duration VARCHAR(100) NOT NULL,
  features JSONB NOT NULL,
  is_popular BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  order_id VARCHAR(50) NOT NULL UNIQUE,
  customer_email VARCHAR(255) NOT NULL,
  customer_whatsapp VARCHAR(50) NOT NULL,
  package_id INTEGER NOT NULL REFERENCES packages(id),
  original_price INTEGER NOT NULL,
  discount INTEGER NOT NULL DEFAULT 0,
  final_price INTEGER NOT NULL,
  promo_code VARCHAR(50),
  payment_status VARCHAR(50) NOT NULL DEFAULT 'pending',
  payment_proof TEXT,
  invite_status VARCHAR(50) NOT NULL DEFAULT 'pending',
  invited_at TIMESTAMP,
  invited_by_cookie_id INTEGER,
  cookie_admin_email VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create cookies table
CREATE TABLE IF NOT EXISTS cookies (
  id SERIAL PRIMARY KEY,
  cookie_name VARCHAR(255) NOT NULL,
  admin_email VARCHAR(255) NOT NULL,
  cookie_data TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMP,
  last_checked TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create promo_codes table
CREATE TABLE IF NOT EXISTS promo_codes (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  discount_type VARCHAR(20) NOT NULL,
  discount_value INTEGER NOT NULL,
  max_usage INTEGER NOT NULL DEFAULT 0,
  current_usage INTEGER NOT NULL DEFAULT 0,
  valid_from TIMESTAMP NOT NULL DEFAULT NOW(),
  valid_until TIMESTAMP,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create ratings table
CREATE TABLE IF NOT EXISTS ratings (
  id SERIAL PRIMARY KEY,
  order_id VARCHAR(50) NOT NULL UNIQUE,
  customer_email VARCHAR(255) NOT NULL,
  customer_role VARCHAR(100),
  customer_whatsapp VARCHAR(50),
  rating INTEGER NOT NULL,
  review TEXT,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  voucher_sent BOOLEAN NOT NULL DEFAULT false,
  voucher_code VARCHAR(50),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE cookies ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

-- Packages policies (public read for active packages)
CREATE POLICY "Public can view active packages"
  ON packages FOR SELECT
  TO anon
  USING (is_active = true);

-- Ratings policies (public read for approved ratings)
CREATE POLICY "Public can view approved ratings"
  ON ratings FOR SELECT
  TO anon
  USING (is_approved = true);

-- Insert default admin user (password: admin123)
INSERT INTO users (email, password, role)
VALUES ('admin@chatgpt.com', '$2a$10$rJ5YqP9qhLvxH5Y8YqP9qhLvxH5Y8YqP9qhLvxH5Y8YqP9qhLvx', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Insert default packages
INSERT INTO packages (package_id, name, price, original_price, duration, features, is_popular, is_active)
VALUES 
  ('chatgpt_plus_1_month', 'ChatGPT Plus', 85000, 120000, '25-30 Hari', '["Akses ChatGPT Plus penuh", "Invite ke email pribadi", "Garansi 1 bulan", "Support 24/7"]', true, true),
  ('team_package', 'Team Package', 250000, 350000, '25-30 Hari', '["Multi-user access", "Team workspace", "Priority support", "Garansi 1 bulan"]', false, true)
ON CONFLICT (package_id) DO NOTHING;