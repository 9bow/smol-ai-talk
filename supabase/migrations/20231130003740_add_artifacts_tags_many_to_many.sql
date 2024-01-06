create table "public"."artifacts_tags" (
    "artifact_id" uuid not null,
    "tag_id" uuid not null
);


alter table "public"."artifacts_tags" enable row level security;

CREATE UNIQUE INDEX artifacts_tags_pkey ON public.artifacts_tags USING btree (artifact_id, tag_id);

alter table "public"."artifacts_tags" add constraint "artifacts_tags_pkey" PRIMARY KEY using index "artifacts_tags_pkey";

alter table "public"."artifacts_tags" add constraint "artifacts_tags_artifact_id_fkey" FOREIGN KEY (artifact_id) REFERENCES artifacts(id) ON DELETE CASCADE not valid;

alter table "public"."artifacts_tags" validate constraint "artifacts_tags_artifact_id_fkey";

alter table "public"."artifacts_tags" add constraint "artifacts_tags_tag_id_fkey" FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE not valid;

alter table "public"."artifacts_tags" validate constraint "artifacts_tags_tag_id_fkey";


