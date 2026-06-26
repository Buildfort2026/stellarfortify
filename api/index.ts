import { Hono } from "hono";
import { handle } from "hono/vercel";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "../_api/router.js";
import { createContext } from "../_api/context.js";

const app = new Hono().basePath("/api");

app.use("/trpc/*", async (c) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext: (opts) => createContext(opts),
  });
});

app.get("/health", (c) => {
  return c.json({ status: "ok", time: new Date().toISOString() });
});

export default handle(app);