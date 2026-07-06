import bcrypt from "bcryptjs";

function uuid(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

interface Store {
  user: Map<string, any>;
  report: Map<string, any>;
  project: Map<string, any>;
  projectAssignment: Map<string, any>;
}

const store: Store = {
  user: new Map(),
  report: new Map(),
  project: new Map(),
  projectAssignment: new Map(),
};

function toArray(map: Map<string, any>): any[] {
  return Array.from(map.values());
}

function matchWhere(record: any, where: any): boolean {
  if (!where || Object.keys(where).length === 0) return true;
  for (const key of Object.keys(where)) {
    const val = where[key];
    if (val && typeof val === "object" && !Array.isArray(val)) {
      const ops = val as Record<string, any>;
      if (ops.not !== undefined && record[key] === ops.not) return false;
      if (ops.gte !== undefined && record[key] < ops.gte) return false;
      if (ops.lte !== undefined && record[key] > ops.lte) return false;
      if (ops.gt !== undefined && record[key] <= ops.gt) return false;
      if (ops.lt !== undefined && record[key] >= ops.lt) return false;
      if (ops.in !== undefined && !ops.in.includes(record[key])) return false;
      if (ops.contains !== undefined && !record[key]?.includes(ops.contains)) return false;
      if (ops.startsWith !== undefined && !record[key]?.startsWith(ops.startsWith)) return false;
      if (ops.endsWith !== undefined && !record[key]?.endsWith(ops.endsWith)) return false;
    } else if (record[key] !== val) {
      return false;
    }
  }
  return true;
}

function orderResults(results: any[], orderBy: any): any[] {
  if (!orderBy) return results;
  const key = Object.keys(orderBy)[0];
  const dir = orderBy[key];
  return [...results].sort((a, b) => {
    if (dir === "asc") return a[key] > b[key] ? 1 : -1;
    return a[key] < b[key] ? 1 : -1;
  });
}

function applySelect(record: any, select: any, relations: Record<string, any[]>): any {
  if (!select) return record;
  const result: any = {};
  for (const key of Object.keys(select)) {
    const val = select[key];
    if (val === true) {
      result[key] = record[key];
    } else if (typeof val === "object") {
      if (val.select || val.where || val.orderBy || val.take) {
        const relData = relations[key] || [];
        let filtered = relData.filter((r: any) => matchWhere(r, val.where || {}));
        filtered = orderResults(filtered, val.orderBy);
        if (val.take) filtered = filtered.slice(0, val.take);
        result[key] = filtered.map((r: any) => applySelect(r, val.select, {}));
      } else {
        result[key] = applySelect(record[key], val, {});
      }
    }
  }
  return result;
}

function resolveIncludes(record: any, include: any): any {
  if (!include) return record;
  const result = { ...record };
  for (const key of Object.keys(include)) {
    const val = include[key];

    if (key === "_count") {
      if (val.select) {
        result._count = {};
        for (const countKey of Object.keys(val.select)) {
          const relName = countKey === "reports" ? "report" : countKey;
          const relStore = (store as any)[relName === "reports" ? "report" : relName];
          if (relStore) {
            const fk = relName === "report" ? "projectId" : "projectId";
            result._count[countKey] = toArray(relStore).filter(
              (r: any) => r[fk] === record.id || r.userId === record.id
            ).length;
          }
        }
      }
      continue;
    }

    const select = val.select || null;
    let related: any[] = [];

    if (key === "project") {
      related = toArray(store.project).filter((p) => p.id === record.projectId);
    } else if (key === "user") {
      related = toArray(store.user).filter((u) => u.id === record.userId || u.id === record.createdById);
    } else if (key === "createdBy") {
      related = toArray(store.user).filter((u) => u.id === record.createdById);
    } else if (key === "reports") {
      related = toArray(store.report).filter((r) => r.projectId === record.id || r.userId === record.id);
      if (val.where) related = related.filter((r) => matchWhere(r, val.where));
      if (val.orderBy) related = orderResults(related, val.orderBy);
      if (val.take) related = related.slice(0, val.take);
    } else if (key === "assignments") {
      related = toArray(store.projectAssignment).filter((a) => a.projectId === record.id || a.userId === record.id);
    }

    if (select) {
      const resolved = related.map((r) => {
        if (key === "user" || key === "createdBy") {
          return applySelect(r, select, {});
        }
        if (key === "project") {
          return applySelect(r, select, {});
        }
        return applySelect(r, select, {});
      });
      result[key] = resolved.length === 1 ? resolved[0] : resolved;
    } else {
      result[key] = related.length === 1 ? related[0] : related;
    }
  }
  return result;
}

function createModel(name: keyof Store) {
  const table = store[name];
  return {
    findUnique: (args: any) => {
      const key = Object.keys(args.where)[0];
      const val = args.where[key];
      const record = toArray(table).find((r: any) => r[key] === val);
      if (!record) return Promise.resolve(null);
      if (args.include) return Promise.resolve(resolveIncludes(record, args.include));
      if (args.select) return Promise.resolve(applySelect(record, args.select, {}));
      return Promise.resolve(record);
    },
    findMany: (args: any = {}) => {
      let results = toArray(table).filter((r: any) => matchWhere(r, args.where || {}));
      results = orderResults(results, args.orderBy);

      if (args.include || args.select) {
        results = results.map((r: any) => {
          let resolved = r;
          if (args.include) resolved = resolveIncludes(r, args.include);
          if (args.select) {
            const relKeys = Object.keys(args.select).filter((k: string) => typeof args.select[k] === "object");
            const relData: Record<string, any[]> = {};
            for (const rk of relKeys) {
              if (rk === "reports") {
                relData[rk] = toArray(store.report).filter((rep: any) => rep.userId === r.id);
              } else if (rk === "assignments") {
                relData[rk] = toArray(store.projectAssignment).filter((a: any) => a.userId === r.id);
              }
            }
            resolved = applySelect(resolved, args.select, relData);
          }
          return resolved;
        });
      }

      if (args.take) results = results.slice(0, args.take);
      return Promise.resolve(results);
    },
    findFirst: (args: any = {}) => {
      let results = toArray(table).filter((r: any) => matchWhere(r, args.where || {}));
      results = orderResults(results, args.orderBy);
      return Promise.resolve(results[0] || null);
    },
    count: (args: any = {}) => {
      return Promise.resolve(toArray(table).filter((r: any) => matchWhere(r, args.where || {})).length);
    },
    create: (args: any = {}) => {
      const now = new Date();
      const record = { id: uuid(), ...args.data, createdAt: now, updatedAt: now };
      table.set(record.id, record);
      let result = record;
      if (args.include) result = resolveIncludes(record, args.include);
      return Promise.resolve(result);
    },
    update: (args: any = {}) => {
      const key = Object.keys(args.where)[0];
      const val = args.where[key];
      const existing = toArray(table).find((r: any) => r[key] === val);
      if (!existing) return Promise.resolve(null);
      const updated = { ...existing, ...args.data, updatedAt: new Date() };
      table.set(updated.id, updated);
      let result = updated;
      if (args.include) result = resolveIncludes(updated, args.include);
      return Promise.resolve(result);
    },
    delete: (args: any = {}) => {
      const key = Object.keys(args.where)[0];
      const val = args.where[key];
      const existing = toArray(table).find((r: any) => r[key] === val);
      if (existing) table.delete(existing.id);
      return Promise.resolve(existing || null);
    },
    deleteMany: (args: any = {}) => {
      const toDelete = toArray(table).filter((r: any) => matchWhere(r, args.where || {}));
      toDelete.forEach((r: any) => table.delete(r.id));
      return Promise.resolve({ count: toDelete.length });
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

let initialized = false;

async function seed() {
  if (initialized) return;
  initialized = true;

  const hash = await bcrypt.hash("password123", 12);

  const defaultManagerId = uuid();
  store.user.set(defaultManagerId, {
    id: defaultManagerId,
    name: "Manager User",
    email: "manager@teamdash.com",
    passwordHash: hash,
    role: "MANAGER",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const defaultMemberId = uuid();
  store.user.set(defaultMemberId, {
    id: defaultMemberId,
    name: "Member User",
    email: "member@teamdash.com",
    passwordHash: hash,
    role: "MEMBER",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const defaultProjectId = uuid();
  store.project.set(defaultProjectId, {
    id: defaultProjectId,
    name: "Default Project",
    description: "Sample project for testing",
    createdById: defaultManagerId,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  store.projectAssignment.set(uuid(), {
    id: uuid(),
    userId: defaultMemberId,
    projectId: defaultProjectId,
    createdAt: new Date(),
  });

  console.log("In-memory store seeded with default data");
  console.log(`  Manager: manager@teamdash.com / password123`);
  console.log(`  Member:  member@teamdash.com / password123`);
}

seed();

export default prisma;
