import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SECRET_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

if (!supabaseUrl || !supabaseKey) {
  console.warn("Supabase credentials missing — some features may not work");
}

const TABLE: Record<string, string> = {
  user: "users",
  report: "reports",
  project: "projects",
  projectAssignment: "project_assignments",
};

function tn(m: string): string {
  return TABLE[m] || m;
}

function q(col: string): string {
  return `"${col}"`;
}

function qcols(fields: string[]): string {
  return fields.length ? fields.map(q).join(",") : "*";
}

function qlist(col: string): string {
  return q(col);
}

async function resolveRelations(records: any[], include: any): Promise<any[]> {
  if (!include || records.length === 0) return records;

  const tasks: Promise<void>[] = [];

  for (const relKey of Object.keys(include)) {
    if (relKey === "_count") continue;
    const sel = include[relKey].select || null;

    if (relKey === "project") {
      const ids = [...new Set(records.map((r: any) => r.projectId).filter(Boolean))];
      if (ids.length > 0) {
        tasks.push(
          (async () => {
            const c = sel ? qcols(Object.keys(sel).filter((k) => sel[k] === true)) : "*";
            const { data } = await supabase.from("projects").select(c).in(q("id"), ids);
            const m = new Map((data || []).map((p: any) => [p.id, p]));
            for (const r of records) r.project = m.get(r.projectId) || null;
          })()
        );
      }
    }

    if (relKey === "user") {
      const ids = [...new Set(records.map((r: any) => r.userId).filter(Boolean))];
      if (ids.length > 0) {
        tasks.push(
          (async () => {
            const c = sel ? qcols(Object.keys(sel).filter((k) => sel[k] === true)) : "*";
            const { data } = await supabase.from("users").select(c).in(q("id"), ids);
            const m = new Map((data || []).map((u: any) => [u.id, u]));
            for (const r of records) r.user = m.get(r.userId) || null;
          })()
        );
      }
    }

    if (relKey === "createdBy") {
      const ids = [...new Set(records.map((r: any) => r.createdById).filter(Boolean))];
      if (ids.length > 0) {
        tasks.push(
          (async () => {
            const c = sel ? qcols(Object.keys(sel).filter((k) => sel[k] === true)) : "*";
            const { data } = await supabase.from("users").select(c).in(q("id"), ids);
            const m = new Map((data || []).map((u: any) => [u.id, u]));
            for (const r of records) r.createdBy = m.get(r.createdById) || null;
          })()
        );
      }
    }

    if (relKey === "reports") {
      const ids = [...new Set(records.map((r: any) => r.id).filter(Boolean))];
      if (ids.length > 0) {
        tasks.push(
          (async () => {
            let query = supabase.from("reports").select("*");
            if (include[relKey].orderBy) {
              const ok = Object.keys(include[relKey].orderBy)[0];
              const od = include[relKey].orderBy[ok];
              query = query.order(q(ok), { ascending: od === "asc" });
            }
            const { data: relReports } = await query;
            if (include[relKey].take && relReports) {
              const grouped = new Map<string, any[]>();
              for (const rr of relReports) {
                const list = grouped.get(rr.userId) || [];
                if (list.length < include[relKey].take) list.push(rr);
                grouped.set(rr.userId, list);
              }
              for (const r of records) r.reports = grouped.get(r.id) || [];
            } else {
              for (const r of records)
                r.reports = (relReports || []).filter(
                  (rr: any) => rr.userId === r.id || rr.projectId === r.id
                );
            }
          })()
        );
      }
    }

    if (relKey === "assignments") {
      const ids = [...new Set(records.map((r: any) => r.id).filter(Boolean))];
      if (ids.length > 0) {
        tasks.push(
          (async () => {
            const { data } = await supabase.from("project_assignments").select("*");
            for (const r of records)
              r.assignments = (data || []).filter(
                (a: any) => a.userId === r.id || a.projectId === r.id
              );
          })()
        );
      }
    }
  }

  await Promise.all(tasks);

  for (const relKey of Object.keys(include)) {
    const val = include[relKey];
    if (relKey === "_count" && val.select) {
      for (const r of records) {
        r._count = r._count || {};
        for (const ck of Object.keys(val.select)) {
          const arr = r[ck === "reports" ? "reports" : ck];
          r._count[ck] = Array.isArray(arr) ? arr.length : 0;
        }
      }
    }
  }

  return records;
}

function buildSelect(table: string, select?: any): string {
  if (!select) return "*";
  const fields = Object.keys(select).filter((k) => select[k] === true);
  return fields.length ? fields.map(q).join(",") : "*";
}

function applyQuery(table: string, query: any, where: any) {
  if (!where) return query;

  if (where.OR && Array.isArray(where.OR)) {
    const orConditions = where.OR.map((cond: any) => {
      const key = Object.keys(cond)[0];
      const val = cond[key];
      const c = q(key);
      if (val && typeof val === "object" && val.ilike !== undefined) {
        return { column: c, operator: "ilike", value: val.ilike };
      }
      return { column: c, operator: "eq", value: val };
    });

    const orQuery = orConditions.map((oc: any) => `${oc.column}.${oc.operator}.${oc.value}`).join(",");
    query = query.or(orQuery);

    delete where.OR;
  }

  for (const key of Object.keys(where)) {
    const val = where[key];
    const c = q(key);
    if (val && typeof val === "object" && !Array.isArray(val)) {
      if (val.not !== undefined) query = query.neq(c, val.not);
      if (val.gte !== undefined) query = query.gte(c, val.gte instanceof Date ? val.gte.toISOString() : val.gte);
      if (val.lte !== undefined) query = query.lte(c, val.lte instanceof Date ? val.lte.toISOString() : val.lte);
      if (val.in !== undefined) query = query.in(c, val.in);
    } else {
      query = query.eq(c, val);
    }
  }
  return query;
}

function createModel(model: string) {
  const table = tn(model);

  return {
    findUnique: async (args: any): Promise<any> => {
      if (!supabaseUrl) return null;
      try {
        const key = q(Object.keys(args.where)[0]);
        const val = args.where[Object.keys(args.where)[0]];
        const cols = args.select ? buildSelect(table, args.select) : "*";
        const { data, error } = await supabase.from(table).select(cols).eq(key, val).single();
        if (error || !data) return null;
        let result = data;
        if (args.include) result = (await resolveRelations([result], args.include))[0];
        return result;
      } catch {
        return null;
      }
    },

    findMany: async (args: any = {}): Promise<any[]> => {
      if (!supabaseUrl) return [];
      try {
        const cols = args.select ? buildSelect(table, args.select) : "*";
        let query = supabase.from(table).select(cols);
        query = applyQuery(table, query, args.where);
        if (args.orderBy) {
          const ok = q(Object.keys(args.orderBy)[0]);
          const od = args.orderBy[Object.keys(args.orderBy)[0]];
          query = query.order(ok, { ascending: od === "asc" });
        }
        if (args.take) query = query.limit(args.take);
        if (args.skip) query = query.range(args.skip, args.skip + (args.take || 50) - 1);
        const { data, error } = await query;
        if (error || !data) return [];
        let results = data;
        if (args.include) results = await resolveRelations(results, args.include);
        return results;
      } catch {
        return [];
      }
    },

    count: async (args: any = {}): Promise<number> => {
      if (!supabaseUrl) return 0;
      try {
        let query = supabase.from(table).select("*", { count: "exact", head: true });
        query = applyQuery(table, query, args.where);
        const { count, error } = await query;
        return error ? 0 : count || 0;
      } catch {
        return 0;
      }
    },

    create: async (args: any = {}): Promise<any> => {
      if (!supabaseUrl) return null;
      try {
        const now = new Date();
        const insertData = { ...args.data, createdAt: now, updatedAt: now };
        const { data, error } = await supabase.from(table).insert([insertData]).select("*").single();
        if (error || !data) throw new Error(error?.message || "Create failed");
        let result = data;
        if (args.include) result = (await resolveRelations([result], args.include))[0];
        return result;
      } catch (err: unknown) {
        throw new Error(err instanceof Error ? err.message : "Create failed");
      }
    },

    update: async (args: any = {}): Promise<any> => {
      if (!supabaseUrl) return null;
      try {
        const key = q(Object.keys(args.where)[0]);
        const val = args.where[Object.keys(args.where)[0]];
        const updateData = { ...args.data, updatedAt: new Date() };
        const { data, error } = await supabase.from(table).update(updateData).eq(key, val).select("*").single();
        if (error || !data) throw new Error(error?.message || "Update failed");
        let result = data;
        if (args.include) result = (await resolveRelations([result], args.include))[0];
        return result;
      } catch (err: unknown) {
        throw new Error(err instanceof Error ? err.message : "Update failed");
      }
    },

    delete: async (args: any = {}): Promise<any> => {
      if (!supabaseUrl) return null;
      try {
        const key = q(Object.keys(args.where)[0]);
        const val = args.where[Object.keys(args.where)[0]];
        const { data, error } = await supabase.from(table).delete().eq(key, val).select("*").single();
        return error ? null : data;
      } catch {
        return null;
      }
    },

    deleteMany: async (args: any = {}): Promise<any> => {
      if (!supabaseUrl) return { count: 0 };
      try {
        let query = supabase.from(table).delete();
        query = applyQuery(table, query, args.where);
        const { error } = await query;
        return { count: error ? 0 : 1 };
      } catch {
        return { count: 0 };
      }
    },
  };
}

const prisma = {
  user: createModel("user"),
  report: createModel("report"),
  project: createModel("project"),
  projectAssignment: createModel("projectAssignment"),
  $disconnect: async () => {},
};

export default prisma;
