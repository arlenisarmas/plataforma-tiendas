import type { EmailCopy } from './templates';

// Sample content for the local preview only. Production callers pass packages/i18n messages.
export const sampleCopy: EmailCopy = {
  orderConfirmation: 'Recibimos tu pedido #{number} en {store}',
  paymentConfirmed: 'Confirmamos tu pago en {store}',
  orderReady: 'Novedades sobre tu pedido #{number} en {store}',
  newOrder: 'Nuevo pedido #{number} en {store}',
  teamInvitation: 'Te invitaron al equipo de {store}',
  orderConfirmationHeading: '¡Recibimos tu pedido!',
  orderConfirmationBody: 'El pedido #{number} ya está registrado. Seguí estas indicaciones para pagar.',
  paymentConfirmedHeading: 'Tu pago está confirmado',
  paymentConfirmedBody: 'Estamos preparando tu pedido #{number}.',
  pickupHeading: 'Tu pedido está listo para retirar',
  shippedHeading: 'Tu pedido está en camino',
  pickupBody: 'Ya podés pasar a retirar el pedido #{number}.',
  shippedBody: 'Enviamos el pedido #{number}.',
  newOrderHeading: 'Entró un pedido nuevo',
  newOrderBody: 'Revisá el pedido #{number}.',
  teamInvitationHeading: 'Te sumaron al equipo',
  teamInvitationBody: 'Aceptá la invitación para ayudar a gestionar la tienda.',
  viewOrder: 'Ver mi pedido', acceptInvite: 'Aceptar invitación', footer: 'Este mensaje lo envió {store}.',
};
