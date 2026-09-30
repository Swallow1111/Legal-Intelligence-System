import type { FastifyInstance } from "fastify";
import { loadAuthorityUpdates } from "@aihot/backend/publication/authority";
import { sendJsonWithEtag } from "../http/respond.ts";
import { cacheUntil, siteHandler } from "./site.ts";

export function registerAuthority(app: FastifyInstance) {
  app.get("/api/site/authority", siteHandler(async (req, reply) => {
    const data = await loadAuthorityUpdates(5);
    const cacheControl = cacheUntil(reply, 60, data.refreshAt);
    return sendJsonWithEtag(
      req,
      reply,
      { ...data, generatedAt: new Date().toISOString() },
      { etagPrefix: "authority", cacheControl, etagOf: data },
    );
  }));
}
