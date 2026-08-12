-- Create tables
CREATE TABLE businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT DEFAULT 'Retail',
  owner_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'Other',
  price NUMERIC DEFAULT 0,
  cost_price NUMERIC DEFAULT 0,
  stock INTEGER DEFAULT 0,
  minimum_stock INTEGER DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  total_orders INTEGER DEFAULT 0,
  total_spending NUMERIC DEFAULT 0,
  pending_payment NUMERIC DEFAULT 0,
  last_order_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES customers(id),
  customer_name TEXT,
  total_amount NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'New',
  payment_status TEXT DEFAULT 'Pending',
  items JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  category TEXT DEFAULT 'Other',
  amount NUMERIC DEFAULT 0,
  description TEXT,
  expense_date DATE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  customer_name TEXT,
  amount NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'Pending',
  order_id UUID REFERENCES orders(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  order_id UUID REFERENCES orders(id),
  invoice_number TEXT UNIQUE,
  subtotal NUMERIC DEFAULT 0,
  tax NUMERIC DEFAULT 0,
  total NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'Pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- RLS Policies (run for each table)
CREATE POLICY "Users can view own business" ON businesses FOR SELECT USING (owner_id = auth.uid());
CREATE POLICY "Users can insert own business" ON businesses FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Users can update own business" ON businesses FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Users can view own business data" ON products FOR SELECT USING (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));
CREATE POLICY "Users can insert own business data" ON products FOR INSERT WITH CHECK (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));
CREATE POLICY "Users can update own business data" ON products FOR UPDATE USING (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));
CREATE POLICY "Users can delete own business data" ON products FOR DELETE USING (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));

-- Repeat the above 4 policies for customers, orders, expenses, payments, invoices (replace table name)

##### Whatsapp schemas

-- ============================================================
-- 1. FIRST: Create the helper function
-- ============================================================
CREATE OR REPLACE FUNCTION get_my_business_id()
RETURNS UUID LANGUAGE sql STABLE AS $$
  SELECT id FROM businesses WHERE owner_id = auth.uid() LIMIT 1;
$$;

-- ============================================================
-- 2. Create WhatsApp tables
-- ============================================================

-- WhatsApp Contacts
CREATE TABLE IF NOT EXISTS wa_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  name TEXT,
  last_message TEXT,
  last_message_time TIMESTAMP WITH TIME ZONE,
  unread_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- WhatsApp Messages
CREATE TABLE IF NOT EXISTS wa_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES wa_contacts(id) ON DELETE CASCADE,
  sender_name TEXT,
  body TEXT NOT NULL,
  direction TEXT CHECK (direction IN ('incoming', 'outgoing')),
  status TEXT DEFAULT 'sent',
  wa_message_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 3. Enable RLS
-- ============================================================
ALTER TABLE wa_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE wa_messages ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 4. Create RLS Policies (now function exists)
-- ============================================================
CREATE POLICY "Users can view own wa_contacts" ON wa_contacts 
  FOR SELECT USING (business_id = get_my_business_id());

CREATE POLICY "Users can insert own wa_contacts" ON wa_contacts 
  FOR INSERT WITH CHECK (business_id = get_my_business_id());

CREATE POLICY "Users can update own wa_contacts" ON wa_contacts 
  FOR UPDATE USING (business_id = get_my_business_id());

CREATE POLICY "Users can delete own wa_contacts" ON wa_contacts 
  FOR DELETE USING (business_id = get_my_business_id());

CREATE POLICY "Users can view own wa_messages" ON wa_messages 
  FOR SELECT USING (business_id = get_my_business_id());

CREATE POLICY "Users can insert own wa_messages" ON wa_messages 
  FOR INSERT WITH CHECK (business_id = get_my_business_id());

CREATE POLICY "Users can update own wa_messages" ON wa_messages 
  FOR UPDATE USING (business_id = get_my_business_id());

CREATE POLICY "Users can delete own wa_messages" ON wa_messages 
  FOR DELETE USING (business_id = get_my_business_id());