// Servicio de alertas WhatsApp via Twilio
import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const FROM = process.env.TWILIO_WHATSAPP_FROM ?? 'whatsapp:+14155238886';

export interface WhatsAppAlert {
  to: string;          // Ej: "+56912345678"
  tenderTitle: string;
  tenderCode: string;
  score: number;
  scoreLabel: string;
  budgetFormatted: string;
  closeDate: string;
  regionLabel: string;
}

export async function sendWhatsAppAlert(data: WhatsAppAlert): Promise<boolean> {
  const toNumber = `whatsapp:${data.to.startsWith('+') ? data.to : '+' + data.to}`;
  
  const scoreEmoji = data.score >= 80 ? '🟢' : data.score >= 60 ? '🟡' : data.score >= 40 ? '🟠' : '🔴';
  
  const body = `
🏛️ *Nueva Licitación — VC Elemental MP*
${scoreEmoji} *Score: ${data.score}/100 — ${data.scoreLabel}*

📋 *${data.tenderTitle}*
🆔 Código: \`${data.tenderCode}\`
📍 Región: ${data.regionLabel}
💰 Presupuesto: ${data.budgetFormatted}
⏰ Cierre: ${data.closeDate}

Ver detalle en: ${process.env.PUBLIC_APP_URL}/dashboard/${data.tenderCode}
  `.trim();

  try {
    await client.messages.create({ from: FROM, to: toNumber, body });
    return true;
  } catch (err: any) {
    console.error('[WhatsApp] Error al enviar alerta:', err.message);
    return false;
  }
}
