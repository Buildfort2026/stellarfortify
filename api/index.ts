import { Hono } from "hono";
import { handle } from "hono/vercel";
import { trpcServer } from "@trpc/server/adapters/fetch";
import { appRouter } from "../_api/router.js";
import { createContext } from "../_api/context.js";

const app = new Hono().basePath("/api");

app.use("/trpc/*", async (c) => {
  return trpcServer({
    router: appRouter,
    createContext: () =>
      createContext({
        req: c.req.raw,
        resHeaders: c.res.headers,
      }),
  })(c.req.raw);
});

app.get("/health", (c) => {
  return c.json({ status: "ok", time: new Date().toISOString() });
});

export default handle(app);
