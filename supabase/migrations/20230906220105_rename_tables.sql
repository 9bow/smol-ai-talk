drop trigger if exists "handle_updated_at" on "public"."prompts";

drop policy "Allow full access to own prompts" on "public"."prompts";
drop policy "Allow logged-in read access to prompts." on "public"."prompts";

ALTER TABLE "public"."prompts" RENAME TO "personas";
ALTER TABLE "public"."personas" RENAME COLUMN "prompt_name" TO "name";
ALTER TABLE "public"."personas" RENAME COLUMN "prompt_body" TO "body";

create policy "Allow full access to own personas"
on "public"."personas"
as permissive
for all
to authenticated
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));

create policy "Allow logged-in read access to personas"
on "public"."personas"
as permissive
for select
to public
using ((auth.uid() = user_id));

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.personas FOR EACH ROW EXECUTE FUNCTION moddatetime('updated_at');