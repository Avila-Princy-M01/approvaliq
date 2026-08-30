import type { Approval } from "@/types";

// ---------------------------------------------------------------------------
// Graph utilities over the approval dependency graph.
//
// The graph is restricted to approvals where applies === true; dependsOn ids
// that point at non-applicable approvals are treated as absent edges.
//
// detectCycle reports a cycle (returns the ids in order starting from the
// repeated node, or null) — it never throws.
// getTopologicalOrder throws when a cycle exists, and returns a valid
// dependency order otherwise (a dependency always precedes its dependents).
// ---------------------------------------------------------------------------

export function detectCycle(approvals: Approval[]): string[] | null {
  const applicable = approvals.filter((a) => a.applies);
  const byId = new Map(applicable.map((a) => [a.id, a]));

  // Three-color marking: "unvisited" = absent from the map,
  // "visiting" = on the current DFS stack, "visited" = fully explored.
  const state = new Map<string, "visiting" | "visited">();
  const stack: string[] = [];

  function visit(id: string): string[] | null {
    const node = byId.get(id);
    if (!node) return null;

    state.set(id, "visiting");
    stack.push(id);

    for (const dep of node.dependsOn) {
      if (!byId.has(dep)) continue; // dep not applicable -> no edge in the graph
      if (state.get(dep) === "visiting") {
        // Cycle found: the path on the stack from dep back to dep.
        const start = stack.indexOf(dep);
        return stack.slice(start).concat(dep);
      }
      if (state.get(dep) !== "visited") {
        const cycle = visit(dep);
        if (cycle) return cycle;
      }
    }

    stack.pop();
    state.set(id, "visited");
    return null;
  }

  for (const a of applicable) {
    if (!state.has(a.id)) {
      const cycle = visit(a.id);
      if (cycle) return cycle;
    }
  }

  return null;
}

export function getTopologicalOrder(approvals: Approval[]): string[] {
  const applicable = approvals.filter((a) => a.applies);
  if (applicable.length === 0) return [];

  const byId = new Map(applicable.map((a) => [a.id, a]));

  // indegree[node] = number of applicable prerequisites of node
  // dependents[dep] = applicable approvals that list dep in their dependsOn
  const indegree = new Map<string, number>();
  const dependents = new Map<string, string[]>();
  for (const a of applicable) {
    indegree.set(a.id, 0);
    dependents.set(a.id, []);
  }
  for (const a of applicable) {
    let degree = 0;
    for (const dep of a.dependsOn) {
      if (byId.has(dep)) {
        degree += 1;
        dependents.get(dep)!.push(a.id);
      }
    }
    indegree.set(a.id, degree);
  }

  const queue = applicable
    .filter((a) => (indegree.get(a.id) ?? 0) === 0)
    .map((a) => a.id);

  const order: string[] = [];
  while (queue.length > 0) {
    const id = queue.shift()!;
    order.push(id);
    for (const dependent of dependents.get(id) ?? []) {
      const next = (indegree.get(dependent) ?? 0) - 1;
      indegree.set(dependent, next);
      if (next === 0) queue.push(dependent);
    }
  }

  if (order.length !== applicable.length) {
    const cycle = detectCycle(approvals);
    throw new Error(
      "Circular dependency detected: " +
        (cycle ? cycle.join(" -> ") : "<unknown>")
    );
  }

  return order;
}

export function getBottleneck(approvals: Approval[]): string | null {
  const applicable = approvals.filter((a) => a.applies);
  if (applicable.length === 0) return null;

  let bottleneck: string | null = null;
  let bestDependents = -1;
  let bestDays = -1;

  for (const a of applicable) {
    // (a) direct dependents among applicable approvals
    const dependentCount = applicable.filter(
      (v) => v.dependsOn.includes(a.id)
    ).length;
    // (b) tie-break by largest statutoryDays
    const days = a.statutoryDays ?? 0;

    if (
      dependentCount > bestDependents ||
      (dependentCount === bestDependents && days > bestDays)
    ) {
      bottleneck = a.id;
      bestDependents = dependentCount;
      bestDays = days;
    }
  }

  return bottleneck;
}