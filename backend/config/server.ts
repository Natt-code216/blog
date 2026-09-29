import type { Core } from '@strapi/strapi';

// Strapi 5.37 reads server.proxy.koa, but its exported Proxy type omits this key.
type ServerConfig = Omit<Core.Config.Server, 'proxy'> & { proxy: { koa: boolean } };

const config = ({ env }: Core.Config.Shared.ConfigParams): ServerConfig => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  url: env('PUBLIC_URL', ''),
  proxy: { koa: env.bool('TRUST_PROXY', false) },
  app: {
    keys: env.array('APP_KEYS'),
  },
});

export default config;
