import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { startTestServer } from './helpers';
import { DEFAULT_BODIES } from '../components/legal/defaults';

describe('Legal API', () => {
  it('sirve términos y privacidad públicos', async () => {
    const ctx = await startTestServer();
    try {
      const terms = await ctx.call('GET', '/api/legal/terms?lang=es');
      assert.equal(terms.s, 200);
      assert.ok(terms.d.version >= 1);
      assert.ok(terms.d.sections.length > 3);

      const privacy = await ctx.call('GET', '/api/legal/privacy?lang=es');
      assert.equal(privacy.s, 200);
      assert.ok(privacy.d.key === 'privacy');
    } finally {
      await ctx.stop();
    }
  });

  it('publica nueva versión y exige re-aceptación', async () => {
    const ctx = await startTestServer();
    try {
      const admin = await ctx.superAdminToken();
      const member = await ctx.register('LegalMember');
      const token = member.t;

      const before = await ctx.call('GET', '/api/user/me', undefined, token);
      assert.equal(before.s, 200);
      assert.equal(before.d.needsLegalAcceptance, false);

      const published = await ctx.call(
        'PATCH',
        '/api/legal/admin/terms',
        {
          body: {
            es: `${DEFAULT_BODIES.terms.es}\n\n## Extra\nTexto nuevo.`,
            en: `${DEFAULT_BODIES.terms.en}\n\n## Extra\nNew text.`,
          },
        },
        admin
      );
      assert.equal(published.s, 200);
      assert.ok(published.d.version >= 2);

      const after = await ctx.call('GET', '/api/user/me', undefined, token);
      assert.equal(after.s, 200);
      assert.equal(after.d.needsTermsAcceptance, true);
      assert.equal(after.d.needsLegalAcceptance, true);
      assert.equal(after.d.termsVersion, published.d.version);
    } finally {
      await ctx.stop();
    }
  });

  it('registra solicitud de baja de servicio', async () => {
    const ctx = await startTestServer();
    try {
      const res = await ctx.call('POST', '/api/legal/service-cancellation', {
        firstName: 'Ana',
        lastName: 'Pana',
        email: 'ana@test.com',
        phone: '+584121234567',
        nationalId: 'V12345678',
        reason: 'privacy',
        confirmed: true,
      });
      assert.equal(res.s, 201);
      assert.equal(res.d.ok, true);
    } finally {
      await ctx.stop();
    }
  });
});
