create table "public"."sources" (
    "created_at" timestamp with time zone default now(),
    "name" text,
    "url" text,
    "id" uuid not null default gen_random_uuid(),
    "description" text,
    "updated_at" timestamp with time zone
);


alter table "public"."sources" enable row level security;

create table "public"."tags" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone default now(),
    "name" text,
    "description" text,
    "updated_at" timestamp with time zone
);


alter table "public"."tags" enable row level security;

alter table "public"."artifacts" add column "short_description" text;

alter table "public"."artifacts" add column "source_id" uuid;

CREATE UNIQUE INDEX sources_pkey ON public.sources USING btree (id);

CREATE UNIQUE INDEX sources_uuid_key ON public.sources USING btree (id);

CREATE UNIQUE INDEX tags_pkey ON public.tags USING btree (id);

alter table "public"."sources" add constraint "sources_pkey" PRIMARY KEY using index "sources_pkey";

alter table "public"."tags" add constraint "tags_pkey" PRIMARY KEY using index "tags_pkey";

alter table "public"."artifacts" add constraint "artifacts_source_id_fkey" FOREIGN KEY (source_id) REFERENCES sources(id) ON DELETE SET NULL not valid;

alter table "public"."artifacts" validate constraint "artifacts_source_id_fkey";

alter table "public"."sources" add constraint "sources_uuid_key" UNIQUE using index "sources_uuid_key";


