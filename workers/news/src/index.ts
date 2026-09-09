import { handleApi } from './api';
import { runIngest } from './ingest';
import type { Env } from './types';

export default {
  async scheduled(_event: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(runIngest(env));
  },
  async fetch(request: Request, env: Env): Promise<Response> {
    return handleApi(request, env);
  },
} satisfies ExportedHandler<Env>;
