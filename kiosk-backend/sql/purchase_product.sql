-- Stored procedure for atomic product purchase
-- Run this on your Supabase instance to enable transactional purchases

create or replace function purchase_product(
  p_user_id uuid,
  p_user_name text,
  p_product_id uuid,
  p_product_name text,
  p_price numeric,
  p_quantity integer
)
returns void
language plpgsql
as $$
begin
  insert into purchases(
    user_id,
    user_name,
    product_id,
    product_name,
    price,
    quantity
  ) values (
    p_user_id,
    p_user_name,
    p_product_id,
    p_product_name,
    p_price,
    p_quantity
  );

  update users
    set balance = coalesce(balance, 0) - p_price
    where id = p_user_id;

  update products
    set stock = stock - p_quantity
    where id = p_product_id;

  update products
    set available = false
    where id = p_product_id and stock <= 0;
end;
$$;
