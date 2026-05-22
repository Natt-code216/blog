import { essaySeeds, tutorialSeeds, toolSeeds } from './seed-data';

type StrapiDoc = { documentId: string; slug?: string | null };
type StrapiLike = {
  documents: (uid: string) => {
    findMany: (params: { filters?: Record<string, unknown>; status?: 'published' | 'draft' }) => Promise<StrapiDoc[]>;
    create: (params: { data: Record<string, unknown>; status?: 'published' | 'draft' }) => Promise<unknown>;
    publish: (params: { documentId: string }) => Promise<unknown>;
    delete: (params: { documentId: string }) => Promise<unknown>;
  };
  log: { info: (msg: string) => void; warn: (msg: string) => void; error: (msg: string) => void };
};

// 清理掉早期手工录入但 slug 为空的遗留条目（这些条目无法被详情页打开，
// 且会让列表里出现 "1970/01/01" 这种空日期的卡片）。
async function purgeSluglessLegacy(strapi: StrapiLike) {
  for (const uid of ['api::essay.essay', 'api::tutorial.tutorial', 'api::tool.tool'] as const) {
    for (const status of ['published', 'draft'] as const) {
      const items = await strapi.documents(uid).findMany({ status });
      for (const item of items) {
        if (!item.slug) {
          try {
            await strapi.documents(uid).delete({ documentId: item.documentId });
            strapi.log.info(`[seed] - ${uid} ${item.documentId} (no slug, ${status})`);
          } catch (err) {
            strapi.log.warn(`[seed] purge ${uid} failed: ${(err as Error).message}`);
          }
        }
      }
    }
  }
}

async function seedIfMissing(strapi: StrapiLike) {
  // essays
  for (const e of essaySeeds) {
    try {
      const existing = await strapi.documents('api::essay.essay').findMany({ filters: { slug: e.slug } });
      if (existing.length === 0) {
        await strapi.documents('api::essay.essay').create({
          data: {
            title: e.title,
            category: e.category,
            excerpt: e.excerpt,
            content: e.content,
            date: e.date,
            slug: e.slug,
            published: true,
          },
          status: 'published',
        });
        strapi.log.info(`[seed] + essay  ${e.slug}`);
      }
    } catch (err) {
      strapi.log.warn(`[seed] essay ${e.slug} failed: ${(err as Error).message}`);
    }
  }

  // tutorials
  for (const t of tutorialSeeds) {
    try {
      const existing = await strapi.documents('api::tutorial.tutorial').findMany({ filters: { slug: t.slug } });
      if (existing.length === 0) {
        await strapi.documents('api::tutorial.tutorial').create({
          data: {
            title: t.title,
            description: t.description,
            level: t.level,
            status: t.status,
            chaptersCount: t.chaptersCount,
            icon: t.icon,
            content: t.content,
            slug: t.slug,
            published: true,
          },
          status: 'published',
        });
        strapi.log.info(`[seed] + tutorial ${t.slug}`);
      }
    } catch (err) {
      strapi.log.warn(`[seed] tutorial ${t.slug} failed: ${(err as Error).message}`);
    }
  }

  // tools —— schema 默认启用了 draftAndPublish，create 必须显式 status:'published'，
  // 否则会停留在草稿态、不会被默认 GET /api/tools 返回。
  for (const tool of toolSeeds) {
    try {
      const published = await strapi.documents('api::tool.tool').findMany({ filters: { slug: tool.slug }, status: 'published' });
      if (published.length > 0) continue;

      const drafts = await strapi.documents('api::tool.tool').findMany({ filters: { slug: tool.slug }, status: 'draft' });
      if (drafts.length > 0) {
        await strapi.documents('api::tool.tool').publish({ documentId: drafts[0].documentId });
        strapi.log.info(`[seed] ~ tool ${tool.slug} (published existing draft)`);
        continue;
      }

      await strapi.documents('api::tool.tool').create({
        data: {
          title: tool.title,
          description: tool.description,
          icon: tool.icon,
          url: tool.url,
          slug: tool.slug,
        },
        status: 'published',
      });
      strapi.log.info(`[seed] + tool ${tool.slug}`);
    } catch (err) {
      strapi.log.warn(`[seed] tool ${tool.slug} failed: ${(err as Error).message}`);
    }
  }
}

export default {
  register() {},
  async bootstrap({ strapi }: { strapi: StrapiLike }) {
    try {
      await purgeSluglessLegacy(strapi);
      await seedIfMissing(strapi);
    } catch (err) {
      strapi.log.error(`[seed] bootstrap seed failed: ${(err as Error).message}`);
    }
  },
};
