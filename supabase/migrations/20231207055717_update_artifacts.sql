alter table "public"."artifacts" drop column "ai_score";

alter table "public"."artifacts" drop column "favicon";

alter table "public"."sources" add column "favicon" text;

alter table "public"."sources" alter column "created_at" set not null;

alter table "public"."sources" alter column "updated_at" set not null;


