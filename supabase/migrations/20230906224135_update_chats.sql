alter table "public"."chats" add column "created_at" timestamp with time zone default now();

alter table "public"."chats" add column "deleted_at" timestamp with time zone;

alter table "public"."chats" add column "title" text;

alter table "public"."chats" add column "updated_at" timestamp with time zone default now();

create trigger handle_updated_at before
update
  on chats for each row execute procedure moddatetime (updated_at);