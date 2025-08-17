# Prisma migrations

To apply the latest schema changes, either:

- Use db push for development:

```
pnpm db:push
```

- Or apply migrations in order:

```
psql "$DATABASE_URL" -f prisma/migrations/20250817_add_indexes/migration.sql
```

Ensure `DATABASE_URL` is set (see `scripts/db.sh env-docker`).

To create migrations locally, set `DATABASE_URL` to a running PostgreSQL instance, e.g.:

```
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres?schema=public"
pnpm dlx prisma migrate dev --name init --schema prisma/schema.prisma
```

For CI, use `prisma generate` for types, and run `prisma migrate deploy` during deployment.

