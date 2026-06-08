-- Afrigo DB schema (initial)

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY,
  email text UNIQUE,
  display_name text,
  role text,
  company_id uuid,
  created_at timestamptz,
  updated_at timestamptz
);

CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY,
  name text,
  country text,
  kyc_status text,
  created_at timestamptz,
  updated_at timestamptz
);

CREATE TABLE IF NOT EXISTS lots (
  id uuid PRIMARY KEY,
  company_id uuid REFERENCES companies(id),
  title text,
  description text,
  quantity numeric,
  unit text,
  grade text,
  photos jsonb,
  created_at timestamptz,
  updated_at timestamptz
);

CREATE TABLE IF NOT EXISTS rfqs (
  id uuid PRIMARY KEY,
  buyer_id uuid REFERENCES users(id),
  title text,
  description text,
  quantity numeric,
  unit text,
  destination_country text,
  status text,
  created_at timestamptz,
  updated_at timestamptz
);

CREATE TABLE IF NOT EXISTS bids (
  id uuid PRIMARY KEY,
  rfq_id uuid REFERENCES rfqs(id),
  supplier_id uuid REFERENCES users(id),
  price numeric,
  terms jsonb,
  status text,
  created_at timestamptz
);

CREATE TABLE IF NOT EXISTS contracts (
  id uuid PRIMARY KEY,
  rfq_id uuid REFERENCES rfqs(id),
  buyer_id uuid REFERENCES users(id),
  supplier_id uuid REFERENCES users(id),
  amount numeric,
  status text,
  metadata jsonb,
  created_at timestamptz
);

CREATE TABLE IF NOT EXISTS shipments (
  id uuid PRIMARY KEY,
  contract_id uuid REFERENCES contracts(id),
  warehouse_id uuid,
  status text,
  tracking jsonb,
  created_at timestamptz
);

CREATE TABLE IF NOT EXISTS warehouses (
  id uuid PRIMARY KEY,
  name text,
  location jsonb,
  capacity numeric,
  created_at timestamptz
);

CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY,
  contract_id uuid REFERENCES contracts(id),
  escrow_amount numeric,
  released boolean DEFAULT false,
  tx_meta jsonb,
  created_at timestamptz
);

CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY,
  owner_id uuid,
  type text,
  meta jsonb,
  s3_key text,
  created_at timestamptz
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY,
  actor_id uuid,
  action text,
  object jsonb,
  created_at timestamptz
);
