\set ON_ERROR_STOP on
\prompt 'Runtime role name: ' runtime_role
\prompt 'Migration role name: ' migration_role
CREATE ROLE :"runtime_role" LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT;
\password :runtime_role
CREATE ROLE :"migration_role" LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT;
\password :migration_role
GRANT CONNECT ON DATABASE afya_core TO :"runtime_role", :"migration_role";
GRANT USAGE ON SCHEMA public TO :"runtime_role";
GRANT CREATE ON SCHEMA public TO :"migration_role";
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO :"runtime_role";
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO :"runtime_role";
ALTER DEFAULT PRIVILEGES FOR ROLE :"migration_role" IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO :"runtime_role";
ALTER DEFAULT PRIVILEGES FOR ROLE :"migration_role" IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO :"runtime_role";
