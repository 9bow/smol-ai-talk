drop trigger if exists "handle_updated_at" on "public"."artifacts_taxonomies";

drop trigger if exists "handle_updated_at" on "public"."scores";

drop trigger if exists "handle_updated_at" on "public"."sources";

drop trigger if exists "handle_updated_at" on "public"."taxonomies";

alter table "public"."artifacts_taxonomies" add column "created_at" timestamp with time zone not null default now();

alter table "public"."artifacts_taxonomies" add column "deleted_at" timestamp with time zone;

alter table "public"."artifacts_taxonomies" add column "updated_at" timestamp with time zone not null;


