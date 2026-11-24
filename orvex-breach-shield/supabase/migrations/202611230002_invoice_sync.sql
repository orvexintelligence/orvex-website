begin;
create function public.guard_sync_paid_invoice(p_subscription_id text,p_customer_id text,
 p_price_id text,p_invoice_id text,p_paid_through timestamptz,p_status text)
returns boolean language plpgsql security definer set search_path = '' as $$
declare sub public.guard_stripe_subscriptions;
begin
  if p_status is null or p_status not in ('active','past_due') or p_paid_through is null or p_invoice_id is null then raise exception 'Invalid invoice'; end if;
  select * into sub from public.guard_stripe_subscriptions where stripe_subscription_id=p_subscription_id for update;
  if not found or sub.stripe_customer_id is distinct from p_customer_id or sub.stripe_price_id is distinct from p_price_id then
    raise exception 'Invoice mismatch';
  end if;
  -- A concurrently processed cancellation must never be reversed by an old checkout.
  if sub.status='canceled' then return true; end if;
  update public.guard_stripe_subscriptions set status=p_status,
    paid_through=greatest(paid_through,p_paid_through),
    last_paid_invoice_id=case when paid_through is null or p_paid_through >= paid_through then p_invoice_id else last_paid_invoice_id end,
    updated_at=now() where stripe_subscription_id=p_subscription_id;
  if sub.auth_user_id is not null then perform public.guard_refresh_user_plan(sub.auth_user_id); end if;
  return true;
end $$;
revoke all on function public.guard_sync_paid_invoice(text,text,text,text,timestamptz,text) from public,anon,authenticated;
grant execute on function public.guard_sync_paid_invoice(text,text,text,text,timestamptz,text) to service_role;
commit;
