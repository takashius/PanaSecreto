import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startTestServer, TestServer } from '../../test/helpers';

describe('Marca EntrePanas', () => {
  let ctx: TestServer;
  before(async () => {
    ctx = await startTestServer();
  });
  after(async () => {
    await ctx.stop();
  });

  it('la configuración por defecto usa EntrePanas', async () => {
    const r = await ctx.call('GET', '/api/config');
    assert.equal(r.d.appName, 'EntrePanas');
    assert.equal((await ctx.call('GET', '/')).d.name, 'EntrePanas API');
  });

  it('migra el nombre anterior y respeta nombres personalizados', async () => {
    const { SystemConfig } = await import('./model');
    const { migrateBrandName } = await import('../../middleware/seed');
    await SystemConfig.updateOne({ key: 'system' }, { $set: { appName: 'PanaSecreto' } });
    await migrateBrandName();
    assert.equal((await SystemConfig.findOne({ key: 'system' }))?.appName, 'EntrePanas');
    await SystemConfig.updateOne({ key: 'system' }, { $set: { appName: 'Mi Parranda' } });
    await migrateBrandName();
    assert.equal((await SystemConfig.findOne({ key: 'system' }))?.appName, 'Mi Parranda');
  });
});
