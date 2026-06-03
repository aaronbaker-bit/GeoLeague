-- Profiles table (auto-created on signup via trigger)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique,
  display_name text,
  avatar_url text,
  elo_rating integer not null default 1200,
  total_games integer not null default 0,
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  total_score bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Daily challenges
create table public.daily_challenges (
  id uuid primary key default gen_random_uuid(),
  challenge_number integer not null unique,
  date date not null unique,
  location_id text not null,
  location_name text not null,
  lat double precision not null,
  lng double precision not null,
  country text not null,
  continent text not null,
  category text not null,
  difficulty text not null,
  hints jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.daily_challenges enable row level security;

create policy "Challenges are viewable by everyone"
  on public.daily_challenges for select using (true);

-- Game results
create table public.game_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  challenge_id uuid not null references public.daily_challenges(id),
  challenge_number integer not null,
  score integer not null check (score >= 0 and score <= 1000),
  guesses jsonb not null,
  hints_used integer not null default 0,
  time_ms integer not null,
  best_distance_km double precision not null,
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique(user_id, challenge_id)
);

alter table public.game_results enable row level security;

create policy "Users can view all results"
  on public.game_results for select using (true);

create policy "Users can insert own results"
  on public.game_results for insert with check (auth.uid() = user_id);

create index idx_game_results_challenge on public.game_results(challenge_id);
create index idx_game_results_user on public.game_results(user_id);
create index idx_game_results_score on public.game_results(challenge_number, score desc);

-- Friendships
create table public.friendships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  friend_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'blocked')),
  created_at timestamptz not null default now(),
  unique(user_id, friend_id)
);

alter table public.friendships enable row level security;

create policy "Users can view own friendships"
  on public.friendships for select using (auth.uid() = user_id or auth.uid() = friend_id);

create policy "Users can create friendships"
  on public.friendships for insert with check (auth.uid() = user_id);

create policy "Users can update own friendships"
  on public.friendships for update using (auth.uid() = user_id or auth.uid() = friend_id);

-- Daily leaderboard view
create or replace view public.daily_leaderboard as
select
  gr.user_id,
  p.username,
  p.display_name,
  p.avatar_url,
  gr.score,
  gr.guesses,
  gr.time_ms,
  gr.best_distance_km,
  row_number() over (order by gr.score desc, gr.time_ms asc) as rank
from public.game_results gr
join public.profiles p on p.id = gr.user_id
join public.daily_challenges dc on dc.id = gr.challenge_id
where dc.date = current_date;

-- Submit score function (server-side scoring integrity)
create or replace function public.submit_score(
  p_challenge_id uuid,
  p_challenge_number integer,
  p_score integer,
  p_guesses jsonb,
  p_hints_used integer,
  p_time_ms integer,
  p_best_distance_km double precision
)
returns json as $$
declare
  v_user_id uuid;
  v_rank integer;
  v_total integer;
  v_percentile numeric;
  v_yesterday date;
  v_played_yesterday boolean;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.game_results (user_id, challenge_id, challenge_number, score, guesses, hints_used, time_ms, best_distance_km)
  values (v_user_id, p_challenge_id, p_challenge_number, p_score, p_guesses, p_hints_used, p_time_ms, p_best_distance_km);

  v_yesterday := current_date - interval '1 day';
  select exists(
    select 1 from public.game_results gr
    join public.daily_challenges dc on dc.id = gr.challenge_id
    where gr.user_id = v_user_id and dc.date = v_yesterday
  ) into v_played_yesterday;

  update public.profiles set
    total_games = total_games + 1,
    total_score = total_score + p_score,
    current_streak = case when v_played_yesterday then current_streak + 1 else 1 end,
    longest_streak = greatest(longest_streak, case when v_played_yesterday then current_streak + 1 else 1 end),
    updated_at = now()
  where id = v_user_id;

  select count(*) + 1 into v_rank
  from public.game_results
  where challenge_id = p_challenge_id and score > p_score;

  select count(*) into v_total
  from public.game_results
  where challenge_id = p_challenge_id;

  v_percentile := round((1.0 - (v_rank::numeric / v_total::numeric)) * 100, 1);

  return json_build_object('rank', v_rank, 'total_players', v_total, 'percentile', v_percentile);
end;
$$ language plpgsql security definer;
