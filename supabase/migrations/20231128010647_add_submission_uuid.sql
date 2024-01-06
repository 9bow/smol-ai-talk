alter table "public"."chats" alter column "id" set default gen_random_uuid();

alter table "public"."messages" alter column "id" set default gen_random_uuid();

alter table "public"."submissions" alter column "id" set default gen_random_uuid();

alter table "public"."artifacts" alter column "id" set default gen_random_uuid();
