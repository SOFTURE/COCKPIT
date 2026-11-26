-- Project groups (CT-30): the owner orders the watched projects into named groups; a project is in at most one.
-- Each existing repository starts in the group of its forge owner: one group per distinct owner, named as the forge
-- writes the owner, whose lower case becomes the group's "new projects from" owner.
-- Rollback:
--   ALTER TABLE projects.repositories DROP COLUMN group_id;
--   DROP TABLE projects.project_groups;
--   then DELETE FROM softure.migrations WHERE module = 'projects' AND version = 9;
CREATE TABLE project_groups (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL CONSTRAINT project_groups_name_check CHECK (name = btrim(name) AND char_length(name) BETWEEN 1 AND 60),
  default_owner text CONSTRAINT project_groups_default_owner_check CHECK (default_owner ~ '^[a-z0-9-]{1,39}$'),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX project_groups_name_unique ON project_groups (lower(name));
CREATE UNIQUE INDEX project_groups_default_owner_unique ON project_groups (default_owner);

ALTER TABLE repositories ADD COLUMN group_id bigint REFERENCES project_groups (id) ON DELETE SET NULL;
CREATE INDEX repositories_group_id_index ON repositories (group_id);

INSERT INTO project_groups (name, default_owner)
SELECT min(split_part(full_name, '/', 1)), split_part(repository_key, '/', 1)
FROM repositories
GROUP BY split_part(repository_key, '/', 1)
ORDER BY split_part(repository_key, '/', 1);

UPDATE repositories
SET group_id = project_groups.id
FROM project_groups
WHERE project_groups.default_owner = split_part(repositories.repository_key, '/', 1);
