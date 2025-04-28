export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // @ts-expect-error - This is a dynamic import
    await import("./instrumentation/instrumentation.node.ts");
    return;
  }

  // @ts-expect-error - This is a dynamic import
  await import("./instrumentation/instrumentation.edge.ts");
}
