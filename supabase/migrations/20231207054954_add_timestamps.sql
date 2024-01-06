alter table "public"."artifacts" add column "updated_at" timestamp with time zone not null;

alter table "public"."artifacts" alter column "created_at" set not null;

alter table "public"."taxonomies" alter column "created_at" set not null;

alter table "public"."taxonomies" alter column "updated_at" set not null;


