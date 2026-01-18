create or replace function is_adult()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from profiles
    where id = auth.uid()
      and role = 'adult'
  );
$$;

create or replace function approve_completion_request(request_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  request_row completion_requests;
  chore_value int;
begin
  select * into request_row
  from completion_requests
  where id = request_id
  for update;

  if not found then
    raise exception 'Completion request not found';
  end if;

  if request_row.status <> 'pending' then
    return;
  end if;

  select value_pence into chore_value
  from chores
  where id = request_row.chore_id;

  update completion_requests
  set status = 'approved',
      reviewed_by = auth.uid(),
      reviewed_at = now()
  where id = request_id;

  insert into ledger_entries (kid_id, type, amount_pence, note)
  values (request_row.kid_id, 'earn', chore_value, 'Chore approved');
end;
$$;

create or replace function create_payout(target_kid_id uuid, note text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_balance int;
begin
  if not is_adult() then
    raise exception 'Only adults can create payouts';
  end if;

  select coalesce(sum(amount_pence), 0)
  into current_balance
  from ledger_entries
  where kid_id = target_kid_id;

  if current_balance = 0 then
    return;
  end if;

  insert into ledger_entries (kid_id, type, amount_pence, note)
  values (target_kid_id, 'payout', -current_balance, note);
end;
$$;

grant execute on function approve_completion_request(uuid) to authenticated;
grant execute on function create_payout(uuid, text) to authenticated;

alter table profiles enable row level security;
alter table chores enable row level security;
alter table chore_schedules enable row level security;
alter table kid_today_list enable row level security;
alter table completion_requests enable row level security;
alter table ledger_entries enable row level security;

create policy "Profiles readable by owner or adult"
  on profiles for select
  using (id = auth.uid() or is_adult());

create policy "Profiles update own or adult"
  on profiles for update
  using (id = auth.uid() or is_adult())
  with check (id = auth.uid() or is_adult());

create policy "Chores readable by authenticated"
  on chores for select
  using (auth.role() = 'authenticated');

create policy "Chores write by adult"
  on chores for insert
  with check (is_adult());

create policy "Chores update by adult"
  on chores for update
  using (is_adult())
  with check (is_adult());

create policy "Chores delete by adult"
  on chores for delete
  using (is_adult());

create policy "Schedules readable by authenticated"
  on chore_schedules for select
  using (auth.role() = 'authenticated');

create policy "Schedules write by adult"
  on chore_schedules for insert
  with check (is_adult());

create policy "Schedules update by adult"
  on chore_schedules for update
  using (is_adult())
  with check (is_adult());

create policy "Schedules delete by adult"
  on chore_schedules for delete
  using (is_adult());

create policy "Kid today list readable"
  on kid_today_list for select
  using (kid_id = auth.uid() or is_adult());

create policy "Kid today list insert"
  on kid_today_list for insert
  with check (kid_id = auth.uid() or is_adult());

create policy "Kid today list delete"
  on kid_today_list for delete
  using (kid_id = auth.uid() or is_adult());

create policy "Completion requests readable"
  on completion_requests for select
  using (kid_id = auth.uid() or is_adult());

create policy "Completion requests insert"
  on completion_requests for insert
  with check (kid_id = auth.uid());

create policy "Completion requests update by adult"
  on completion_requests for update
  using (is_adult())
  with check (is_adult());

create policy "Completion requests update by kid"
  on completion_requests for update
  using (kid_id = auth.uid() and status = 'pending')
  with check (kid_id = auth.uid() and status = 'pending');

create policy "Ledger readable"
  on ledger_entries for select
  using (kid_id = auth.uid() or is_adult());

create policy "Ledger insert by adult"
  on ledger_entries for insert
  with check (is_adult());
