alter table "public"."chats" alter column "created_at" set not null;

alter table "public"."messages" alter column "created_at" set not null;

create policy "Enable full access to own messages"
on "public"."messages"
as permissive
for select
to authenticated
using (true);



