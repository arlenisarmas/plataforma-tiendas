import { createServer } from 'node:http';
import { renderEmail, type EmailKind } from './templates';
import { sampleCopy } from './sample-copy';

const kinds: EmailKind[] = ['orderConfirmation', 'paymentConfirmed', 'orderReady', 'newOrder', 'teamInvitation'];
const sample = { copy: sampleCopy, storeName: 'Tienda de ejemplo', accentColor: '#07567a',
  orderNumber: 1001, recipientName: 'Arle', orderUrl: 'https://example.test/pedido/1001',
  inviteUrl: 'https://example.test/invitacion', paymentInstructions: 'Transferí al alias tienda.ejemplo' };

createServer(async (request, response) => {
  const kind = new URL(request.url ?? '/', 'http://localhost').pathname.slice(1);
  response.setHeader('Content-Type', 'text/html; charset=utf-8');
  if (!kinds.includes(kind as EmailKind)) {
    response.end(`<meta name="viewport" content="width=device-width,initial-scale=1"><h1>Vista previa de correos</h1><ul>${
      kinds.map((item) => `<li><a href="/${item}">${item}</a></li>`).join('')}</ul>`);
    return;
  }
  try {
    const { html } = await renderEmail({ ...sample, kind: kind as EmailKind });
    response.end(html);
  } catch {
    response.writeHead(500);
    response.end('No se pudo mostrar la plantilla.');
  }
}).listen(3030, '127.0.0.1', () => console.info('Email preview: http://127.0.0.1:3030'));
