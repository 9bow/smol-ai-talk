-- Drop the existing policy for public read access on shared chats
drop policy "Allow public read for shared chats" on "public"."chats";

-- Remove the payload column from the chats table
alter table "public"."chats" drop column "payload";

-- Add a new boolean column 'shared' to the chats table with a default value of false
alter table "public"."chats" add column "shared" boolean default false;

-- Remove foreign key constraints related to the 'id' column from the messages and submissions tables
alter table "public"."messages" drop constraint if exists "messages_chat_id_fkey";
alter table "public"."submissions" drop constraint if exists "submissions_chat_id_fkey";
alter table "public"."submissions" drop constraint if exists "submissions_artifact_id_fkey";
alter table "public"."submissions" drop constraint if exists "submissions_pkey";
alter table "public"."artifacts" drop constraint if exists "artifacts_pkey";

-- Remove primary key and foreign key constraints from the chats table
alter table "public"."chats" drop constraint if exists "chats_pkey";
alter table "public"."chats" drop constraint if exists "chats_user_id_fkey";

-- Drop the 'id' column from the chats table
alter table "public"."chats" drop column "id";

-- Add a new 'id' column of type UUID to the chats table and set it as the primary key
alter table "public"."chats" add column "id" uuid not null;
alter table "public"."chats" add constraint "chats_pkey" primary key ("id");

-- Recreate the foreign key constraint on the user_id column in the chats table
alter table "public"."chats" add constraint "chats_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Remove unused columns from the messages table
alter table "public"."messages" drop column "function_call";
alter table "public"."messages" drop column "name";

-- Add a new column 'tool_logs' of type JSONB array to the messages table
alter table "public"."messages" add column "tool_logs" jsonb[];

-- Add a new column 'updated_at' with the current timestamp as the default value to the messages table
alter table "public"."messages" add column "updated_at" timestamp with time zone not null default now();

-- Drop the 'id' column from the messages table and recreate it as a UUID
alter table "public"."messages" drop column "id";
alter table "public"."messages" add column "id" uuid not null;
alter table "public"."messages" drop constraint if exists "messages_pkey";
alter table "public"."messages" add constraint "messages_pkey" primary key ("id");

-- Change the type of the 'chat_id' column in the messages table to UUID and add a foreign key constraint
alter table "public"."messages" alter column "chat_id" type uuid using "chat_id"::uuid;
alter table "public"."messages" add constraint "messages_chat_id_fkey" FOREIGN KEY (chat_id) REFERENCES "public"."chats"("id");

-- Drop the 'id' column from the submissions table and recreate it as a UUID
alter table "public"."submissions" drop column "id";
alter table "public"."submissions" add column "id" uuid not null;
alter table "public"."submissions" add constraint "submissions_pkey" primary key ("id");

-- Drop the existing 'id' column from the artifacts table and recreate it as a UUID
alter table "public"."artifacts" drop column "id";
alter table "public"."artifacts" add column "id" uuid not null;
alter table "public"."artifacts" add constraint "artifacts_pkey" primary key ("id");

-- Change the type of the 'chat_id' column in the submissions table to UUID and add a foreign key constraint
alter table "public"."submissions" alter column "chat_id" type uuid using "chat_id"::uuid;
alter table "public"."submissions" add constraint "submissions_chat_id_fkey" FOREIGN KEY (chat_id) REFERENCES "public"."chats"("id");

-- Change the type of the 'chat_id' column in the submissions table to UUID and add a foreign key constraint
alter table "public"."submissions" drop column "artifact_id";
alter table "public"."submissions" add column "artifact_id" uuid not null;
alter table "public"."submissions" add constraint "submissions_artifact_id_fkey" FOREIGN KEY (artifact_id) REFERENCES "public"."artifacts"("id");

-- Recreate the policy for public read access on shared chats
create policy "Allow public read for shared chats"
on "public"."chats"
as permissive
for select
to public
using ((shared = true));
