import { sql } from "drizzle-orm";
import { db } from "@/db";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Sets `app.tenant_id` for the RLS policies on `projects` (see schema.ts) and runs `fn`
 * inside that transaction. `set_config(..., true)` scopes the setting to this transaction
 * only — required because pooled connections are reused across requests/tenants.
 */
export const withTenantContext = <T>(
  tenantId: string,
  fn: (tx: Tx) => Promise<T>,
): Promise<T> =>
  db.transaction(async (tx) => {
    await tx.execute(
      sql`select set_config('app.tenant_id', ${tenantId}, true)`,
    );
    return fn(tx);
  });
