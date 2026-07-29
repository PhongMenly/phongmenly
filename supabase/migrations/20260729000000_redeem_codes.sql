-- Mã nhập-1-lần để mở khóa Học Viện (thay cho mật mã tĩnh "tudo")
create table if not exists redeem_codes (
  code text primary key,
  used boolean not null default false,
  used_by_email text,
  used_at timestamptz,
  note text,
  created_at timestamptz not null default now()
);

alter table redeem_codes enable row level security;
-- Không có policy cho anon/authenticated: bảng chỉ được đọc/ghi qua Edge Function
-- (dùng service_role key), giống các bảng orders/leads hiện có.
