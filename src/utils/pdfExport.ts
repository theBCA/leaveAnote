import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import type { NoteTheme, ThemeConfigEntry } from '../types';
import { THEME_CONFIG } from '../types';

const ACCENT: Record<NoteTheme, string> = {
  classic: '#5c4a2e',
  birthday: '#c74a8a',
  love: '#c43a52',
  anniversary: '#b47a20',
  graduation: '#4a52c4',
  thankyou: '#2a8a5a',
  surprise: '#8a4ac4',
  farewell: '#c46a2a',
  motivation: '#c44a2a',
  apology: '#2a7ac4',
};

async function renderToPdf(element: HTMLElement, filename: string) {
  const wrapper = document.createElement('div');
  Object.assign(wrapper.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '794px',
    zIndex: '99999',
    opacity: '0.01',
    pointerEvents: 'none',
    overflow: 'hidden',
  });
  wrapper.appendChild(element);
  document.body.appendChild(wrapper);

  await new Promise(r => setTimeout(r, 200));

  wrapper.style.opacity = '1';
  await new Promise(r => setTimeout(r, 50));

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#faf6f0',
    logging: false,
    width: 794,
    height: element.scrollHeight,
    windowWidth: 794,
    scrollX: 0,
    scrollY: 0,
    x: 0,
    y: 0,
  });

  document.body.removeChild(wrapper);

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pw = pdf.internal.pageSize.getWidth();
  const ph = pdf.internal.pageSize.getHeight();
  const ih = (canvas.height * pw) / canvas.width;

  pdf.addImage(imgData, 'PNG', 0, ih <= ph ? (ph - ih) / 2 : 0, pw, Math.min(ih, ph));
  pdf.save(filename);
}

// ─── Share PDF ───────────────────────────────────────────

interface SharePdfParams {
  recipientLink: string;
  senderLink: string;
  noteId: string;
  qrDataUrl?: string;
}

export async function exportSharePdf({ recipientLink, senderLink, noteId, qrDataUrl }: SharePdfParams) {
  const el = document.createElement('div');
  Object.assign(el.style, {
    width: '794px', fontFamily: "'Segoe UI', system-ui, sans-serif",
  });

  el.innerHTML = `
  <div style="width:794px;min-height:1123px;background:#faf6f0;padding:0;box-sizing:border-box;position:relative;">

    <!-- Top bar -->
    <div style="height:6px;background:linear-gradient(90deg,#5c2d0e,#8b4513,#c47a35,#8b4513,#5c2d0e);"></div>

    <!-- Header -->
    <div style="padding:48px 60px 0;text-align:center;">
      <p style="font-family:Georgia,serif;font-size:36px;color:#5c2d0e;margin:0 0 4px;letter-spacing:-0.5px;">LeaveANote</p>
      <p style="font-size:12px;color:#a08868;margin:0;letter-spacing:3px;text-transform:uppercase;">Time-Locked Messages</p>
    </div>

    <!-- Thin rule -->
    <div style="margin:28px 60px;height:1px;background:linear-gradient(90deg,transparent,#c9a882,transparent);"></div>

    <!-- Content -->
    <div style="padding:0 60px;">

      <p style="text-align:center;font-size:16px;color:#5c2d0e;margin:0 0 32px;font-weight:600;">Your note has been sealed &amp; is ready to share</p>

      ${qrDataUrl ? `
      <div style="text-align:center;margin-bottom:32px;">
        <div style="display:inline-block;padding:20px;background:white;border-radius:14px;border:1px solid #e6d4bc;">
          <img src="${qrDataUrl}" width="160" height="160" style="display:block;" />
        </div>
        <p style="font-size:11px;color:#a08868;margin:10px 0 0;">Scan with any camera to open</p>
      </div>` : ''}

      <div style="background:white;border-radius:12px;border:1px solid #e6d4bc;padding:20px 24px;margin-bottom:14px;">
        <p style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#8b4513;margin:0 0 10px;">Recipient Link</p>
        <p style="font-size:11px;font-family:'Courier New',monospace;word-break:break-all;color:#3d1c0a;margin:0;background:#faf6f0;padding:10px 12px;border-radius:6px;">${recipientLink}</p>
      </div>

      <div style="background:white;border-radius:12px;border:1px solid #e6d4bc;padding:20px 24px;margin-bottom:8px;">
        <p style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#8b4513;margin:0 0 10px;">Your Control Link</p>
        <p style="font-size:11px;font-family:'Courier New',monospace;word-break:break-all;color:#3d1c0a;margin:0;background:#faf6f0;padding:10px 12px;border-radius:6px;">${senderLink}</p>
        <p style="font-size:10px;color:#a08868;margin:10px 0 0;">Use this to edit or delete your note before it's revealed</p>
      </div>
    </div>

    <!-- Footer -->
    <div style="position:absolute;bottom:0;left:0;right:0;padding:20px 60px;text-align:center;">
      <div style="height:1px;background:linear-gradient(90deg,transparent,#c9a882,transparent);margin-bottom:16px;"></div>
      <p style="font-size:10px;color:#a08868;margin:0;">leaveanote.web.app &bull; ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
    </div>
    <div style="position:absolute;bottom:0;left:0;right:0;height:6px;background:linear-gradient(90deg,#5c2d0e,#8b4513,#c47a35,#8b4513,#5c2d0e);"></div>
  </div>`;

  await renderToPdf(el, `leaveanote-${noteId}.pdf`);
}

// ─── Note PDF (the revealed message keepsake) ────────────

interface NotePdfParams {
  message: string;
  senderName?: string;
  theme?: NoteTheme;
  revealedAt?: string;
}

export async function exportNotePdf({ message, senderName, theme = 'classic', revealedAt }: NotePdfParams) {
  const cfg: ThemeConfigEntry = THEME_CONFIG[theme];
  const accent = ACCENT[theme];

  const el = document.createElement('div');
  Object.assign(el.style, {
    width: '794px', fontFamily: "'Segoe UI', system-ui, sans-serif",
  });

  el.innerHTML = `
  <div style="width:794px;min-height:1123px;background:#faf6f0;padding:0;box-sizing:border-box;position:relative;">

    <!-- Accent top bar -->
    <div style="height:6px;background:linear-gradient(90deg,#5c2d0e,${accent},#5c2d0e);"></div>

    <!-- Header area -->
    <div style="padding:44px 70px 0;text-align:center;">

      <!-- Brand -->
      <p style="font-family:Georgia,serif;font-size:28px;color:#5c2d0e;margin:0 0 2px;letter-spacing:-0.3px;">LeaveANote</p>
      <p style="font-size:10px;color:#a08868;margin:0 0 28px;letter-spacing:3px;text-transform:uppercase;">Time-Locked Messages</p>

      <!-- Thin rule -->
      <div style="height:1px;background:linear-gradient(90deg,transparent,#c9a882,transparent);margin-bottom:32px;"></div>

      <!-- Theme icon -->
      <div style="display:inline-block;width:56px;height:56px;line-height:56px;font-size:28px;text-align:center;background:white;border-radius:50%;border:2px solid ${accent}22;margin-bottom:16px;">${cfg.icon}</div>

      <!-- Reveal title -->
      <h1 style="font-family:Georgia,serif;font-size:30px;color:#3d1c0a;margin:0 0 6px;font-weight:400;letter-spacing:-0.3px;">${cfg.revealTitle}</h1>

      ${senderName ? `<p style="font-size:14px;color:${accent};margin:0 0 4px;">from <strong>${esc(senderName)}</strong></p>` : ''}

      <!-- Theme badge -->
      <p style="display:inline-block;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:${accent};background:${accent}0D;border:1px solid ${accent}1A;padding:4px 14px;border-radius:20px;margin:12px 0 0;">${cfg.label}</p>
    </div>

    <!-- Accent dot divider -->
    <div style="text-align:center;padding:28px 0 24px;">
      <span style="display:inline-block;width:4px;height:4px;border-radius:50%;background:${accent};margin:0 6px;opacity:0.3;"></span>
      <span style="display:inline-block;width:5px;height:5px;border-radius:50%;background:${accent};margin:0 6px;opacity:0.5;"></span>
      <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${accent};margin:0 6px;opacity:0.7;"></span>
      <span style="display:inline-block;width:5px;height:5px;border-radius:50%;background:${accent};margin:0 6px;opacity:0.5;"></span>
      <span style="display:inline-block;width:4px;height:4px;border-radius:50%;background:${accent};margin:0 6px;opacity:0.3;"></span>
    </div>

    <!-- Message card -->
    <div style="margin:0 70px;background:white;border-radius:14px;border:1px solid #e6d4bc;padding:36px 40px;box-shadow:0 1px 8px rgba(92,45,14,0.04);">

      <!-- Opening quote -->
      <div style="font-family:Georgia,serif;font-size:48px;line-height:1;color:${accent};opacity:0.25;margin:0 0 4px;">&ldquo;</div>

      <!-- The message -->
      <div style="font-size:14px;line-height:2;color:#2c1a0a;white-space:pre-wrap;padding:0 8px;">${esc(message)}</div>

      <!-- Closing quote -->
      <div style="font-family:Georgia,serif;font-size:48px;line-height:1;color:${accent};opacity:0.25;text-align:right;margin:4px 0 0;">&rdquo;</div>

      ${senderName ? `
      <div style="margin-top:20px;padding-top:16px;border-top:1px solid #f0e6d8;text-align:right;">
        <p style="font-size:13px;color:#7a5c3e;margin:0;font-style:italic;">— ${esc(senderName)}</p>
      </div>` : ''}
    </div>

    ${revealedAt ? `
    <div style="text-align:center;margin-top:20px;">
      <p style="font-size:10px;color:#a08868;margin:0;">Revealed on ${revealedAt}</p>
    </div>` : ''}

    <!-- Footer -->
    <div style="position:absolute;bottom:0;left:0;right:0;">
      <div style="margin:0 70px;height:1px;background:linear-gradient(90deg,transparent,#c9a882,transparent);"></div>
      <div style="padding:16px 70px;text-align:center;">
        <p style="font-size:9px;color:#b8a088;margin:0;letter-spacing:1px;">Sealed with love on LeaveANote &bull; leaveanote.web.app</p>
      </div>
      <div style="height:6px;background:linear-gradient(90deg,#5c2d0e,${accent},#5c2d0e);"></div>
    </div>
  </div>`;

  await renderToPdf(el, `leaveanote-${theme}-message.pdf`);
}

function esc(text: string): string {
  const d = document.createElement('div');
  d.textContent = text;
  return d.innerHTML;
}
