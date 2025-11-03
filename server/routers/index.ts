import { router } from '../trpc';
import { publicRouter } from './public';
import { adminRouter } from './admin';

export const appRouter = router({
  public: publicRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
