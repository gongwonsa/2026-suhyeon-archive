-- 초기 스키마. 실제 학생 데이터, 교사 이메일, 접속 코드는 여기에 넣지 않는다.
begin;

create table public.genres (
  id bigint generated always as identity primary key,
  code text not null unique,
  label text not null,
  sort_order integer not null default 0
);

create sequence public.work_no_seq;

create table public.works (
  id bigint generated always as identity primary key,
  work_no bigint not null unique default nextval('public.work_no_seq'),
  title text not null check (char_length(title) between 1 and 200),
  artist_name text not null check (char_length(artist_name) between 1 and 100),
  genre_id bigint not null references public.genres (id) on delete restrict,
  description text not null default '' check (char_length(description) <= 5000),
  link_url text not null check (link_url ~* '^https?://'),
  is_ai boolean not null default false,
  thumb_path text,
  status text not null default '대기' check (status in ('대기', '공개', '숨김', '삭제요청')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter sequence public.work_no_seq owned by public.works.work_no;

create index works_public_list_idx on public.works (status, created_at desc);

create table public.work_edits (
  id bigint generated always as identity primary key,
  work_id bigint not null references public.works (id) on delete cascade,
  edited_at timestamptz not null default now(),
  before_json jsonb not null,
  after_json jsonb not null
);

create index work_edits_work_id_idx on public.work_edits (work_id);

create table public.consents (
  id bigint generated always as identity primary key,
  work_id bigint not null references public.works (id) on delete cascade,
  consent_version text not null,
  agreed_at timestamptz not null default now(),
  agreed_public boolean not null
);

create index consents_work_id_idx on public.consents (work_id);

create table public.settings (
  key text primary key,
  value text not null
);

create table public.teachers (
  email text primary key check (email = lower(email))
);

-- 수정 시각을 갱신하고, 한 번 정한 전시 번호는 바뀌지 않게 막는다.
create function public.works_before_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.work_no := old.work_no;
  new.updated_at := now();
  return new;
end;
$$;

revoke execute on function public.works_before_update() from public, anon, authenticated;

create trigger works_before_update
before update on public.works
for each row execute function public.works_before_update();

alter table public.genres enable row level security;
alter table public.works enable row level security;
alter table public.work_edits enable row level security;
alter table public.consents enable row level security;
alter table public.settings enable row level security;
alter table public.teachers enable row level security;

-- 익명과 로그인 사용자는 읽기만 한다. 쓰기는 Edge Function(service_role)에서만 한다.
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

grant usage on schema public to anon, authenticated, service_role;
grant select on public.genres, public.works to anon, authenticated;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;

create policy "장르는 누구나 읽는다"
on public.genres for select
to anon, authenticated
using (true);

create policy "공개 작품만 누구나 읽는다"
on public.works for select
to anon, authenticated
using (status = '공개');

insert into public.genres (code, label, sort_order) values
  ('game', '게임', 1),
  ('anim', '애니메이션', 2),
  ('sim', '시뮬레이션', 3),
  ('agent', 'AI 에이전트 도구(바이브코딩)', 4),
  ('etc', '기타', 5);

-- 썸네일은 공개 URL로 읽고, 업로드는 Edge Function에서만 한다. storage.objects 정책은 만들지 않는다.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('thumbnails', 'thumbnails', true, 5242880, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

commit;
