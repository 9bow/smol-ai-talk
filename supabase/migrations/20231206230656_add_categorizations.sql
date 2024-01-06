alter table "public"."artifacts_tags" drop constraint "artifacts_tags_tag_id_fkey";

alter table "public"."tags" drop constraint "tags_pkey";

drop index if exists "public"."tags_pkey";

drop table "public"."tags";

create table "public"."categorizations" (
    "created_at" timestamp with time zone default now(),
    "name" text not null,
    "description" text,
    "updated_at" timestamp with time zone,
    "id" uuid not null default gen_random_uuid(),
    "deleted_at" timestamp with time zone,
    "type" text not null
);


alter table "public"."categorizations" enable row level security;

alter table "public"."sources" add column "deleted_at" timestamp with time zone;

CREATE UNIQUE INDEX tags_pkey ON public.categorizations USING btree (id);

alter table "public"."categorizations" add constraint "tags_pkey" PRIMARY KEY using index "tags_pkey";

alter table "public"."artifacts_tags" add constraint "artifacts_tags_tag_id_fkey" FOREIGN KEY (tag_id) REFERENCES categorizations(id) ON DELETE CASCADE not valid;

alter table "public"."artifacts_tags" validate constraint "artifacts_tags_tag_id_fkey";
