import { authRouter } from "./auth-router.js";
import { insuranceRouter } from "./insurance-router.js";
import { createRouter, publicQuery } from "./middleware.js";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  insurance: insuranceRouter,
});

export type AppRouter = typeof appRouter;
