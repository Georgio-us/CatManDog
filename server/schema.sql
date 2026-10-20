CREATE TABLE IF NOT EXISTS catalog_products (
  id text PRIMARY KEY,
  name text NOT NULL,
  brand text,
  category text,
  pet text,
  image_path text,
  source jsonb NOT NULL DEFAULT '{}'::jsonb,
  imported_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS catalog_variants (
  id text PRIMARY KEY,
  product_id text NOT NULL REFERENCES catalog_products(id),
  label text NOT NULL,
  source_price_cents integer CHECK (source_price_cents > 0),
  price_override_cents integer CHECK (price_override_cents > 0),
  purchase_price_cents integer CHECK (purchase_price_cents >= 0),
  price_confirmed boolean NOT NULL DEFAULT false,
  source_orderable boolean NOT NULL DEFAULT true,
  availability text NOT NULL DEFAULT 'source_on_demand'
    CHECK (availability IN ('on_hand', 'source_on_demand', 'unavailable')),
  stock_quantity integer CHECK (stock_quantity >= 0),
  source jsonb NOT NULL DEFAULT '{}'::jsonb,
  imported_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS catalog_variants_product_id_idx ON catalog_variants(product_id);
ALTER TABLE catalog_variants ADD COLUMN IF NOT EXISTS source_orderable boolean NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY,
  email text NOT NULL UNIQUE,
  password_hash text,
  google_sub text,
  name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  email_verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS email_verified_at timestamptz;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS google_sub text;
ALTER TABLE customers ALTER COLUMN password_hash DROP NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS customers_google_sub_idx ON customers(google_sub) WHERE google_sub IS NOT NULL;
CREATE TABLE IF NOT EXISTS customer_sessions (
  id uuid PRIMARY KEY,
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS customer_sessions_customer_id_idx ON customer_sessions(customer_id);

CREATE TABLE IF NOT EXISTS auth_links (
  id uuid PRIMARY KEY,
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('verify','reset')),
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS auth_links_customer_kind_idx ON auth_links(customer_id,kind);

CREATE TABLE IF NOT EXISTS pets (
  id uuid PRIMARY KEY,
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  name text NOT NULL,
  species text NOT NULL CHECK (species IN ('cat','dog')),
  profile jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS pets_customer_id_idx ON pets(customer_id);

CREATE TABLE IF NOT EXISTS customer_cabinet (
  customer_id uuid PRIMARY KEY REFERENCES customers(id) ON DELETE CASCADE,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  revision integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE customer_cabinet ADD COLUMN IF NOT EXISTS revision integer NOT NULL DEFAULT 0;

CREATE SEQUENCE IF NOT EXISTS order_number_seq START WITH 10000;
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY,
  number text NOT NULL UNIQUE,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  whatsapp_opt_in boolean NOT NULL DEFAULT false,
  delivery_address jsonb NOT NULL,
  delivery_preference jsonb NOT NULL,
  status text NOT NULL DEFAULT 'received'
    CHECK (status IN ('received','packing','delivering','delivered','cancelled')),
  payment_status text NOT NULL DEFAULT 'awaiting_payment'
    CHECK (payment_status IN ('awaiting_payment','pending','paid','failed','refunded')),
  subtotal_cents integer NOT NULL CHECK (subtotal_cents >= 0),
  discount_cents integer NOT NULL DEFAULT 0 CHECK (discount_cents >= 0),
  delivery_cents integer NOT NULL CHECK (delivery_cents >= 0),
  total_cents integer NOT NULL CHECK (total_cents >= 0),
  promo_code text,
  idempotency_key text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS orders_email_idx ON orders(lower(email));
CREATE INDEX IF NOT EXISTS orders_customer_id_idx ON orders(customer_id);
CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders(created_at DESC);

CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id text NOT NULL,
  variant_id text NOT NULL,
  name text NOT NULL,
  variant_label text NOT NULL,
  quantity integer NOT NULL CHECK (quantity BETWEEN 1 AND 99),
  unit_price_cents integer NOT NULL CHECK (unit_price_cents >= 0),
  source_mode text NOT NULL CHECK (source_mode IN ('on_hand','source_on_demand'))
);
CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON order_items(order_id);

CREATE TABLE IF NOT EXISTS order_events (
  id uuid PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  type text NOT NULL,
  actor text NOT NULL,
  note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS order_events_order_id_idx ON order_events(order_id);

CREATE TABLE IF NOT EXISTS service_requests (
  id uuid PRIMARY KEY,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  kind text NOT NULL CHECK (kind IN ('support','return')),
  email text NOT NULL,
  product_id text,
  variant_id text,
  quantity integer,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','in_progress','resolved')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS service_requests_order_id_idx ON service_requests(order_id);

CREATE TABLE IF NOT EXISTS promo_codes (
  code text PRIMARY KEY,
  percent_off integer NOT NULL DEFAULT 0 CHECK (percent_off BETWEEN 0 AND 100),
  free_delivery boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT false,
  max_uses integer CHECK (max_uses >= 0),
  used_count integer NOT NULL DEFAULT 0 CHECK (used_count >= 0),
  expires_at timestamptz
);
