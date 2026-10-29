CREATE TABLE IF NOT EXISTS catalog_products (
  id text PRIMARY KEY,
  name text NOT NULL,
  brand text,
  category text,
  pet text,
  image_path text,
  description text NOT NULL DEFAULT '',
  details jsonb NOT NULL DEFAULT '[]'::jsonb,
  food_type text,
  active boolean NOT NULL DEFAULT true,
  source jsonb NOT NULL DEFAULT '{}'::jsonb,
  imported_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE catalog_products ADD COLUMN IF NOT EXISTS description text NOT NULL DEFAULT '';
ALTER TABLE catalog_products ADD COLUMN IF NOT EXISTS details jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE catalog_products ADD COLUMN IF NOT EXISTS food_type text;
ALTER TABLE catalog_products ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS catalog_migrations (
  name text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS catalog_variants (
  id text PRIMARY KEY,
  product_id text NOT NULL REFERENCES catalog_products(id),
  label text NOT NULL,
  image_path text,
  description text NOT NULL DEFAULT '',
  details jsonb NOT NULL DEFAULT '[]'::jsonb,
  source_price_cents integer CHECK (source_price_cents > 0),
  price_override_cents integer CHECK (price_override_cents > 0),
  purchase_price_cents integer CHECK (purchase_price_cents >= 0),
  price_confirmed boolean NOT NULL DEFAULT false,
  source_orderable boolean NOT NULL DEFAULT true,
  active boolean NOT NULL DEFAULT true,
  availability text NOT NULL DEFAULT 'source_on_demand'
    CHECK (availability IN ('on_hand', 'source_on_demand', 'unavailable')),
  stock_quantity integer CHECK (stock_quantity >= 0),
  tax_rate_bps integer CHECK (tax_rate_bps BETWEEN 0 AND 10000),
  reorder_point integer NOT NULL DEFAULT 2 CHECK (reorder_point BETWEEN 0 AND 99998),
  target_stock integer NOT NULL DEFAULT 6 CHECK (target_stock BETWEEN 1 AND 99999 AND target_stock > reorder_point),
  source jsonb NOT NULL DEFAULT '{}'::jsonb,
  imported_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS catalog_variants_product_id_idx ON catalog_variants(product_id);
ALTER TABLE catalog_variants ADD COLUMN IF NOT EXISTS source_orderable boolean NOT NULL DEFAULT true;
ALTER TABLE catalog_variants ADD COLUMN IF NOT EXISTS image_path text;
ALTER TABLE catalog_variants ADD COLUMN IF NOT EXISTS description text NOT NULL DEFAULT '';
ALTER TABLE catalog_variants ADD COLUMN IF NOT EXISTS details jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE catalog_variants ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;
ALTER TABLE catalog_variants ADD COLUMN IF NOT EXISTS display_priority integer NOT NULL DEFAULT 0
  CHECK (display_priority BETWEEN 0 AND 999);
ALTER TABLE catalog_variants ADD COLUMN IF NOT EXISTS review_note text NOT NULL DEFAULT '';
ALTER TABLE catalog_variants ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;
ALTER TABLE catalog_variants ADD COLUMN IF NOT EXISTS reserved_quantity integer NOT NULL DEFAULT 0
  CHECK (reserved_quantity >= 0);
ALTER TABLE catalog_variants ADD COLUMN IF NOT EXISTS reorder_point integer NOT NULL DEFAULT 2
  CHECK (reorder_point BETWEEN 0 AND 99998);
ALTER TABLE catalog_variants ADD COLUMN IF NOT EXISTS target_stock integer NOT NULL DEFAULT 6
  CHECK (target_stock BETWEEN 1 AND 99999 AND target_stock > reorder_point);
ALTER TABLE catalog_variants ADD COLUMN IF NOT EXISTS tax_rate_bps integer
  CHECK (tax_rate_bps BETWEEN 0 AND 10000);

CREATE TABLE IF NOT EXISTS billing_profile (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  legal_name text NOT NULL DEFAULT '',
  tax_id text NOT NULL DEFAULT '',
  street_address text NOT NULL DEFAULT '',
  postal_code text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  province text NOT NULL DEFAULT '',
  contact_email text NOT NULL DEFAULT '',
  delivery_tax_rate_bps integer CHECK (delivery_tax_rate_bps BETWEEN 0 AND 10000),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS suppliers (
  id uuid PRIMARY KEY,
  name text NOT NULL UNIQUE,
  contact_name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  website text NOT NULL DEFAULT '',
  terms text NOT NULL DEFAULT '',
  lead_days integer CHECK (lead_days BETWEEN 0 AND 365),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS supplier_offers (
  id uuid PRIMARY KEY,
  supplier_id uuid NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
  variant_id text NOT NULL REFERENCES catalog_variants(id) ON DELETE CASCADE,
  cost_cents integer CHECK (cost_cents >= 0),
  vat_included boolean NOT NULL DEFAULT true,
  minimum_quantity integer NOT NULL DEFAULT 1 CHECK (minimum_quantity BETWEEN 1 AND 99999),
  source_url text NOT NULL DEFAULT '',
  note text NOT NULL DEFAULT '',
  preferred boolean NOT NULL DEFAULT false,
  checked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(supplier_id, variant_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS supplier_offers_one_preferred_idx
  ON supplier_offers(variant_id) WHERE preferred=true;
CREATE INDEX IF NOT EXISTS supplier_offers_variant_idx ON supplier_offers(variant_id);

CREATE TABLE IF NOT EXISTS supplier_catalog_sources (
  id text PRIMARY KEY,
  supplier_name text NOT NULL,
  brand text NOT NULL,
  price_date date NOT NULL,
  source_file text NOT NULL,
  shop_price_tax_basis text NOT NULL DEFAULT 'unknown',
  retail_price_tax_basis text NOT NULL DEFAULT 'includes_iva',
  imported_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS supplier_catalog_items (
  id text PRIMARY KEY,
  source_id text NOT NULL REFERENCES supplier_catalog_sources(id) ON DELETE RESTRICT,
  article text NOT NULL,
  name text NOT NULL,
  line text NOT NULL DEFAULT '',
  weight text NOT NULL DEFAULT '',
  ean text NOT NULL DEFAULT '',
  shop_price_cents integer CHECK (shop_price_cents >= 0),
  recommended_price_cents integer CHECK (recommended_price_cents >= 0),
  minimum_price_cents integer CHECK (minimum_price_cents >= 0),
  raw_prices jsonb NOT NULL DEFAULT '{}'::jsonb,
  source_row integer NOT NULL,
  UNIQUE(source_id,article)
);
CREATE INDEX IF NOT EXISTS supplier_catalog_items_source_idx
  ON supplier_catalog_items(source_id,line,name);

CREATE TABLE IF NOT EXISTS staff_accounts (
  id uuid PRIMARY KEY,
  google_sub text NOT NULL UNIQUE,
  email text NOT NULL,
  name text NOT NULL DEFAULT '',
  role text NOT NULL CHECK (role IN ('owner','support')),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_login_at timestamptz
);
CREATE TABLE IF NOT EXISTS staff_sessions (
  id uuid PRIMARY KEY,
  staff_id uuid NOT NULL REFERENCES staff_accounts(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS staff_sessions_staff_idx ON staff_sessions(staff_id);

CREATE TABLE IF NOT EXISTS supplier_catalog_matches (
  item_id text PRIMARY KEY REFERENCES supplier_catalog_items(id) ON DELETE CASCADE,
  source_id text NOT NULL REFERENCES supplier_catalog_sources(id) ON DELETE CASCADE,
  variant_id text NOT NULL REFERENCES catalog_variants(id) ON DELETE CASCADE,
  match_method text NOT NULL CHECK (match_method IN ('ean','manual','draft')),
  matched_by uuid REFERENCES staff_accounts(id) ON DELETE SET NULL,
  matched_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(source_id,variant_id)
);

CREATE TABLE IF NOT EXISTS admin_audit_events (
  id uuid PRIMARY KEY,
  staff_id uuid REFERENCES staff_accounts(id) ON DELETE SET NULL,
  action text NOT NULL,
  target_id text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS admin_audit_events_created_idx ON admin_audit_events(created_at DESC);

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
  delivery_tax_rate_bps integer CHECK (delivery_tax_rate_bps BETWEEN 0 AND 10000),
  total_cents integer NOT NULL CHECK (total_cents >= 0),
  promo_code text,
  idempotency_key text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS orders_email_idx ON orders(lower(email));
CREATE INDEX IF NOT EXISTS orders_customer_id_idx ON orders(customer_id);
CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders(created_at DESC);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stock_state text NOT NULL DEFAULT 'legacy'
  CHECK (stock_state IN ('legacy','reserved','released','consumed'));
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_tax_rate_bps integer
  CHECK (delivery_tax_rate_bps BETWEEN 0 AND 10000);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_checkout_session_id text UNIQUE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_checkout_url text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_expires_at timestamptz;

CREATE TABLE IF NOT EXISTS stripe_events (
  id text PRIMARY KEY,
  type text NOT NULL,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  received_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id text NOT NULL,
  variant_id text NOT NULL,
  name text NOT NULL,
  variant_label text NOT NULL,
  quantity integer NOT NULL CHECK (quantity BETWEEN 1 AND 99),
  unit_price_cents integer NOT NULL CHECK (unit_price_cents >= 0),
  tax_rate_bps integer CHECK (tax_rate_bps BETWEEN 0 AND 10000),
  source_mode text NOT NULL CHECK (source_mode IN ('on_hand','source_on_demand'))
);
CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON order_items(order_id);
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS tax_rate_bps integer
  CHECK (tax_rate_bps BETWEEN 0 AND 10000);

CREATE TABLE IF NOT EXISTS order_events (
  id uuid PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  type text NOT NULL,
  actor text NOT NULL,
  note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS order_events_order_id_idx ON order_events(order_id);

CREATE SEQUENCE IF NOT EXISTS purchase_order_number_seq START WITH 1000;
CREATE TABLE IF NOT EXISTS purchase_orders (
  id uuid PRIMARY KEY,
  number text NOT NULL UNIQUE,
  supplier_id uuid NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
  created_by uuid REFERENCES staff_accounts(id) ON DELETE SET NULL,
  creation_key text NOT NULL UNIQUE,
  request_hash text NOT NULL,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','ordered','partially_received','received','cancelled')),
  note text NOT NULL DEFAULT '',
  expected_date date,
  ordered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS purchase_orders_supplier_idx ON purchase_orders(supplier_id,created_at DESC);
CREATE INDEX IF NOT EXISTS purchase_orders_status_idx ON purchase_orders(status,created_at DESC);

CREATE TABLE IF NOT EXISTS purchase_order_items (
  id uuid PRIMARY KEY,
  purchase_order_id uuid NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  variant_id text NOT NULL,
  name_snapshot text NOT NULL,
  variant_label_snapshot text NOT NULL,
  ordered_quantity integer NOT NULL CHECK (ordered_quantity BETWEEN 1 AND 99999),
  received_quantity integer NOT NULL DEFAULT 0 CHECK (received_quantity >= 0),
  unit_cost_cents integer NOT NULL CHECK (unit_cost_cents >= 0),
  vat_included boolean NOT NULL DEFAULT true,
  UNIQUE(purchase_order_id,variant_id),
  CHECK (received_quantity <= ordered_quantity)
);
CREATE INDEX IF NOT EXISTS purchase_order_items_order_idx
  ON purchase_order_items(purchase_order_id);
CREATE INDEX IF NOT EXISTS purchase_order_items_variant_idx
  ON purchase_order_items(variant_id);

CREATE TABLE IF NOT EXISTS inventory_movements (
  id uuid PRIMARY KEY,
  variant_id text NOT NULL,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  staff_id uuid REFERENCES staff_accounts(id) ON DELETE SET NULL,
  supplier_id uuid REFERENCES suppliers(id) ON DELETE SET NULL,
  unit_cost_cents integer CHECK (unit_cost_cents >= 0),
  idempotency_key text,
  reason text NOT NULL CHECK (reason IN ('receipt','adjustment','order_reserved',
    'order_released','order_fulfilled','legacy_order_cancelled')),
  delta_on_hand integer NOT NULL DEFAULT 0,
  delta_reserved integer NOT NULL DEFAULT 0,
  on_hand_after integer,
  reserved_after integer NOT NULL,
  note text NOT NULL DEFAULT '',
  purchase_order_item_id uuid REFERENCES purchase_order_items(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (delta_on_hand <> 0 OR delta_reserved <> 0)
);
ALTER TABLE inventory_movements ADD COLUMN IF NOT EXISTS supplier_id uuid REFERENCES suppliers(id) ON DELETE SET NULL;
ALTER TABLE inventory_movements ADD COLUMN IF NOT EXISTS unit_cost_cents integer CHECK (unit_cost_cents >= 0);
ALTER TABLE inventory_movements ADD COLUMN IF NOT EXISTS idempotency_key text;
ALTER TABLE inventory_movements ADD COLUMN IF NOT EXISTS purchase_order_item_id uuid
  REFERENCES purchase_order_items(id) ON DELETE SET NULL;
CREATE UNIQUE INDEX IF NOT EXISTS inventory_movements_idempotency_idx
  ON inventory_movements(idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS inventory_movements_variant_idx
  ON inventory_movements(variant_id,created_at DESC);
CREATE INDEX IF NOT EXISTS inventory_movements_order_idx ON inventory_movements(order_id);
CREATE INDEX IF NOT EXISTS inventory_movements_purchase_item_idx
  ON inventory_movements(purchase_order_item_id);

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
ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS order_number_input text;
ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS locale text NOT NULL DEFAULT 'ru'
  CHECK (locale IN ('ru','es'));
CREATE INDEX IF NOT EXISTS service_requests_order_id_idx ON service_requests(order_id);

CREATE TABLE IF NOT EXISTS service_request_replies (
  id uuid PRIMARY KEY,
  request_id uuid NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
  message text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS service_request_replies_request_id_idx ON service_request_replies(request_id);

CREATE TABLE IF NOT EXISTS promo_codes (
  code text PRIMARY KEY,
  percent_off integer NOT NULL DEFAULT 0 CHECK (percent_off BETWEEN 0 AND 100),
  free_delivery boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT false,
  max_uses integer CHECK (max_uses >= 0),
  used_count integer NOT NULL DEFAULT 0 CHECK (used_count >= 0),
  expires_at timestamptz
);
