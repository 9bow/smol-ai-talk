create table "public"."artifacts" (
    "id" bigint generated by default as identity not null,
    "created_at" timestamp with time zone default now(),
    "text_content" text,
    "ai_score" numeric,
    "deleted_at" timestamp with time zone,
    "canonical_url" text
);


alter table "public"."artifacts" enable row level security;

create table "public"."submissions" (
    "id" bigint generated by default as identity not null,
    "created_at" timestamp with time zone default now(),
    "submitted_url" text,
    "meta" jsonb,
    "chat_id" text,
    "artifact_id" bigint,
    "deleted_at" timestamp with time zone
);


alter table "public"."submissions" enable row level security;

CREATE UNIQUE INDEX artifacts_pkey ON public.submissions USING btree (id);

CREATE UNIQUE INDEX artifacts_pkey1 ON public.artifacts USING btree (id);

alter table "public"."artifacts" add constraint "artifacts_pkey1" PRIMARY KEY using index "artifacts_pkey1";

alter table "public"."submissions" add constraint "artifacts_pkey" PRIMARY KEY using index "artifacts_pkey";

alter table "public"."submissions" add constraint "submissions_artifact_id_fkey" FOREIGN KEY (artifact_id) REFERENCES artifacts(id) not valid;

alter table "public"."submissions" validate constraint "submissions_artifact_id_fkey";

alter table "public"."submissions" add constraint "submissions_chat_id_fkey" FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE SET NULL not valid;

alter table "public"."submissions" validate constraint "submissions_chat_id_fkey";

create policy "Enable insert for authenticated users only"
on "public"."submissions"
as permissive
for insert
to authenticated
with check (true);



