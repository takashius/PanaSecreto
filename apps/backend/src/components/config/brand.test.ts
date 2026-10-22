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
    assert.equal(r.d.primaryColor, '#0B2D5B');
    assert.equal(r.d.secondaryColor, '#FFC107');
    assert.equal(r.d.accentColor, '#00B4D8');
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

  it('migra los colores por defecto anteriores y respeta los personalizados', async () => {
    const { SystemConfig } = await import('./model');
    const { migrateBrandName } = await import('../../middleware/seed');
    await SystemConfig.updateOne(
      { key: 'system' },
      { $set: { primaryColor: '#1e1338', secondaryColor: '#F7A800', accentColor: '#123456' } }
    );
    await migrateBrandName();
    const cfg = await SystemConfig.findOne({ key: 'system' });
    assert.equal(cfg?.primaryColor, '#0B2D5B');
    assert.equal(cfg?.secondaryColor, '#FFC107');
    assert.equal(cfg?.accentColor, '#123456');
  });
});
