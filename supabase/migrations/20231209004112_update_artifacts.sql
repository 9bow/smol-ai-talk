alter table "public"."artifacts" drop column "canonical_url";

alter table "public"."artifacts" drop column "text_content";

alter table "public"."artifacts" add column "content" text;


