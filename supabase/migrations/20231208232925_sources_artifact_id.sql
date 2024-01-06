alter table "public"."artifacts" drop constraint "artifacts_source_id_fkey";

alter table "public"."artifacts" drop column "source_id";

alter table "public"."sources" add column "artifact_id" uuid;

alter table "public"."sources" add constraint "sources_artifact_id_fkey" FOREIGN KEY (artifact_id) REFERENCES artifacts(id) not valid;

alter table "public"."sources" validate constraint "sources_artifact_id_fkey";


