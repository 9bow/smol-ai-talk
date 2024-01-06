alter table "public"."artifacts" alter column "updated_at" set default now();

alter table "public"."artifacts_taxonomies" alter column "updated_at" set default now();

alter table "public"."personas" alter column "updated_at" set default now();

alter table "public"."scores" alter column "updated_at" set default now();

alter table "public"."sources" alter column "updated_at" set default now();

alter table "public"."submissions" add column "updated_at" timestamp with time zone not null default now();

alter table "public"."taxonomies" alter column "updated_at" set default now();

alter table "public"."users" add column "created_at" timestamp with time zone not null;

alter table "public"."users" add column "deleted_at" timestamp with time zone;

alter table "public"."users" add column "updated_at" timestamp with time zone not null;


