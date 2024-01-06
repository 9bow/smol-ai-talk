alter table "public"."scores" drop constraint "scores_artifact_id_fkey";

alter table "public"."scores" drop column "artifact_id";

alter table "public"."scores" add column "source_id" uuid;

alter table "public"."sources" drop column "description";

alter table "public"."sources" drop column "name";

alter table "public"."sources" add column "content" text;

alter table "public"."sources" add column "title" text;

alter table "public"."scores" add constraint "scores_source_id_fkey" FOREIGN KEY (source_id) REFERENCES sources(id) not valid;

alter table "public"."scores" validate constraint "scores_source_id_fkey";


