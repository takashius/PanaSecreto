import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';

// La configuración se lee al importar: definir el entorno primero
process.env.NODE_ENV = 'test';
process.env.MAIL_TRANSPORT = 'mailjet';
process.env.MJ_APIKEY_PUBLIC = 'pub-key';
process.env.MJ_APIKEY_PRIVATE = 'priv-key';
process.env.MAIL_FROM_EMAIL = 'no-reply@entrepanas.app';
process.env.MAIL_FROM_NAME = 'EntrePanas';

describe('Servicio de correo (Mailjet)', () => {
  const realFetch = globalThis.fetch;
  let sendMail: typeof import('./mail').sendMail;
  let recoveryCodeEmail: typeof import('./mailTemplates').recoveryCodeEmail;
  let lastRequest: { url: string; init: RequestInit } | undefined;
  let nextResponse: { status: number; body: unknown } = { status: 200, body: {} };

  before(async () => {
    ({ sendMail } = await import('./mail'));
    ({ recoveryCodeEmail } = await import('./mailTemplates'));
    globalThis.fetch = (async (url: string, init: RequestInit) => {
      lastRequest = { url, init };
      return new Response(JSON.stringify(nextResponse.body), { status: nextResponse.status });
    }) as typeof fetch;
  });
  after(() => {
    globalThis.fetch = realFetch;
  });

  it('envía a la API v3.1 con autenticación básica y el formato esperado', async () => {
    nextResponse = { status: 200, body: { Messages: [{ Status: 'success' }] } };
    const mail = recoveryCodeEmail({ name: 'Ana', code: 123456, minutes: 15 });
    const r = await sendMail({ to: { email: 'ana@test.com', name: 'Ana Test' }, ...mail, customId: 'recovery-1' });
    assert.equal(r.ok, true);
    assert.equal(lastRequest!.url, 'https://api.mailjet.com/v3.1/send');
    const headers = lastRequest!.init.headers as Record<string, string>;
    assert.equal(headers.Authorization, `Basic ${Buffer.from('pub-key:priv-key').toString('base64')}`);
    const payload = JSON.parse(String(lastRequest!.init.body));
    const msg = payload.Messages[0];
    assert.deepEqual(msg.From, { Email: 'no-reply@entrepanas.app', Name: 'EntrePanas' });
    assert.deepEqual(msg.To, [{ Email: 'ana@test.com', Name: 'Ana Test' }]);
    assert.match(msg.Subject, /123456/);
    assert.match(msg.TextPart, /123456/);
    assert.match(msg.HTMLPart, /123456/);
    assert.equal(msg.CustomID, 'recovery-1');
  });

  it('informa el error cuando Mailjet rechaza el envío (sin lanzar)', async () => {
    nextResponse = {
      status: 400,
      body: { Messages: [{ Status: 'error', Errors: [{ ErrorMessage: 'Sender not validated' }] }] },
    };
    const r = await sendMail({ to: { email: 'x@test.com' }, subject: 's', html: 'h', text: 't' });
    assert.equal(r.ok, false);
    assert.equal(r.error, 'Sender not validated');
  });

  it('la plantilla escapa HTML en el nombre', () => {
    const mail = recoveryCodeEmail({ name: '<script>alert(1)</script>', code: 654321, minutes: 15 });
    assert.ok(!mail.html.includes('<script>'));
    assert.ok(mail.html.includes('&lt;script&gt;'));
  });

  it('el encabezado muestra el logo horizontal con texto alternativo', async () => {
    const { mailLogoUrl } = await import('./mailTemplates');
    const mail = recoveryCodeEmail({ name: 'Ana', code: 123456, minutes: 15 });
    assert.ok(mail.html.includes(`<img src="${mailLogoUrl()}"`));
    assert.ok(mail.html.includes('alt="EntrePanas'));
    assert.match(mailLogoUrl(), /^https:\/\//);
  });
});
