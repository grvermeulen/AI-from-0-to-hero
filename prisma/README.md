To create migrations locally, set `DATABASE_URL` to a running PostgreSQL instance, e.g.:

```
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres?schema=public"
pnpm dlx prisma migrate dev --name init --schema prisma/schema.prisma
```

For CI, use `prisma generate` for types, and run `prisma migrate deploy` during deployment.

