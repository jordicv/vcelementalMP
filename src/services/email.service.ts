// Servicio de alertas por Email via Resend
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailAlert {
  to: string;
  userName: string;
  tenderTitle: string;
  tenderCode: string;
  score: number;
  scoreLabel: string;
  scoreBreakdown: { rubro: number; region: number; budget: number; urgency: number };
  rubroLabel: string;
  regionLabel: string;
  budgetLabel: string;
  urgencyLabel: string;
  budgetFormatted: string;
  closeDate: string;
  buyerName: string;
}

export async function sendEmailAlert(data: EmailAlert): Promise<boolean> {
  const scoreEmoji = data.score >= 80 ? '🟢' : data.score >= 60 ? '🟡' : data.score >= 40 ? '🟠' : '🔴';
  const scoreColor = data.score >= 80 ? '#22c55e' : data.score >= 60 ? '#eab308' : data.score >= 40 ? '#f97316' : '#ef4444';

  const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="font-family: 'Segoe UI', sans-serif; background: #0f172a; color: #e2e8f0; margin:0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: #1e293b; border-radius: 16px; overflow: hidden; border: 1px solid #334155;">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #1d4ed8, #7c3aed); padding: 32px; text-align: center;">
      <h1 style="margin:0; font-size: 24px; color: white;">🏛️ VC Elemental MP</h1>
      <p style="margin: 8px 0 0; color: #bfdbfe; font-size: 14px;">Nueva Licitación Detectada</p>
    </div>

    <!-- Score Badge -->
    <div style="padding: 24px; text-align: center; border-bottom: 1px solid #334155;">
      <div style="display: inline-block; background: ${scoreColor}22; border: 2px solid ${scoreColor}; border-radius: 50px; padding: 12px 32px;">
        <span style="font-size: 32px; font-weight: 900; color: ${scoreColor};">${scoreEmoji} ${data.score}/100</span>
        <br><span style="font-size: 14px; color: ${scoreColor};">${data.scoreLabel}</span>
      </div>
    </div>

    <!-- Tender Info -->
    <div style="padding: 24px; border-bottom: 1px solid #334155;">
      <h2 style="margin: 0 0 16px; font-size: 18px; color: #f1f5f9;">${data.tenderTitle}</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 6px 0; color: #94a3b8; width: 40%;">🆔 Código</td><td style="font-family: monospace; color: #60a5fa;">${data.tenderCode}</td></tr>
        <tr><td style="padding: 6px 0; color: #94a3b8;">🏢 Organismo</td><td>${data.buyerName}</td></tr>
        <tr><td style="padding: 6px 0; color: #94a3b8;">📍 Región</td><td>${data.regionLabel}</td></tr>
        <tr><td style="padding: 6px 0; color: #94a3b8;">💰 Presupuesto</td><td style="color: #4ade80; font-weight: bold;">${data.budgetFormatted}</td></tr>
        <tr><td style="padding: 6px 0; color: #94a3b8;">⏰ Cierre</td><td style="color: #fb923c;">${data.closeDate}</td></tr>
      </table>
    </div>

    <!-- Score Breakdown -->
    <div style="padding: 24px; border-bottom: 1px solid #334155;">
      <h3 style="margin: 0 0 16px; font-size: 14px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">Desglose del Score</h3>
      ${[
        { label: '🏭 Rubro', score: data.scoreBreakdown.rubro, max: 40, detail: data.rubroLabel },
        { label: '📍 Región', score: data.scoreBreakdown.region, max: 30, detail: data.regionLabel },
        { label: '💰 Presupuesto', score: data.scoreBreakdown.budget, max: 20, detail: data.budgetLabel },
        { label: '⏰ Urgencia', score: data.scoreBreakdown.urgency, max: 10, detail: data.urgencyLabel },
      ].map(item => `
        <div style="margin-bottom: 12px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span style="font-size: 13px;">${item.label}</span>
            <span style="font-size: 13px; color: #94a3b8;">${item.score}/${item.max} — ${item.detail}</span>
          </div>
          <div style="height: 6px; background: #334155; border-radius: 3px;">
            <div style="height: 6px; width: ${(item.score/item.max)*100}%; background: ${scoreColor}; border-radius: 3px;"></div>
          </div>
        </div>
      `).join('')}
    </div>

    <!-- CTA -->
    <div style="padding: 24px; text-align: center;">
      <a href="${process.env.PUBLIC_APP_URL}/dashboard/${data.tenderCode}"
         style="background: linear-gradient(135deg, #1d4ed8, #7c3aed); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: bold; display: inline-block;">
        Ver Licitación Completa →
      </a>
      <p style="margin: 16px 0 0; font-size: 12px; color: #475569;">
        Recibiste este correo porque tienes alertas activas en VC Elemental MP.<br>
        Hola, ${data.userName} —  
        <a href="${process.env.PUBLIC_APP_URL}/dashboard/alertas" style="color: #60a5fa;">Gestionar alertas</a>
      </p>
    </div>
  </div>
</body>
</html>`;

  try {
    await resend.emails.send({
      from:    'VC Elemental MP <alertas@vcelemental.cl>',
      to:      data.to,
      subject: `${scoreEmoji} ${data.score}/100 — ${data.tenderTitle}`,
      html,
    });
    return true;
  } catch (err: any) {
    console.error('[Email] Error al enviar alerta:', err.message);
    return false;
  }
}
