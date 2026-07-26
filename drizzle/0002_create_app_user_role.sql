-- Custom SQL migration file, put your code below! --
-- Dev-only credential, consistent with docker-compose.yml's plaintext postgres/postgres.
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'app_user') THEN
    CREATE ROLE app_user WITH LOGIN PASSWORD 'app_user';
  END IF;
END
$$;

GRANT USAGE ON SCHEMA public TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON tenants, users, projects TO app_user;
GRANT SELECT, INSERT ON audit_logs TO app_user;
