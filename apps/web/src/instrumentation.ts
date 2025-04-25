export async function register() {
  if (process.env.TURBOPACK && process.env.NEXT_RUNTIME === "nodejs") {
    // @ts-expect-error - This is a dynamic import
    const { withContexts } = await import("./lib/with-contexts.ts");
    withContexts();
    return;
  }

  if (process.env.NEXT_RUNTIME === "nodejs") {
    // @ts-expect-error - This is a dynamic import
    await import("./instrumentation/instrumentation.node.ts");
    return;
  }

  // @ts-expect-error - This is a dynamic import
  await import("./instrumentation/instrumentation.edge.ts");
}
