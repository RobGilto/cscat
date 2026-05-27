import { FC, useMemo, useState } from 'react';

import domoLogo from '/static/domo-logo.png';

import styles from './App.module.scss';

const FORM_BASE = 'https://robgilto.github.io/cscat/';

function buildUrl(project: string, account: string, contactName: string, contact: string): string {
  if (!project && !account && !contactName && !contact) return '';
  const params = new URLSearchParams();
  if (project) params.set('project', project);
  if (account) params.set('account', account);
  if (contactName) params.set('contact_name', contactName);
  if (contact) params.set('contact', contact);
  const qs = params.toString();
  return qs ? `${FORM_BASE}?${qs}` : FORM_BASE;
}

function greeting(account: string, contactName: string): string {
  if (contactName) return `Hi ${contactName},`;
  if (account) return `Hi ${account} team,`;
  return 'Hi,';
}

function buildEmailHtml(url: string, account: string, contactName: string): string {
  const g = greeting(account, contactName);
  return `<table cellpadding="0" cellspacing="0" border="0" style="font-family:Arial,sans-serif;font-size:14px;line-height:1.5;color:#1a1a1a;max-width:640px">
<tr><td style="background:#9CC9E8;padding:32px 24px;text-align:center"><table align="center" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;background:#ffffff;border-radius:8px"><tr><td style="padding:18px 36px;text-align:center"><img src="https://robgilto.github.io/cscat/domo-logo.png" alt="Domo" width="120" style="display:block;border:0;height:auto"></td></tr></table></td></tr>
<tr><td style="padding:24px 8px 0">
<p style="margin:0 0 12px">${g}</p>
<p style="margin:0 0 12px">Thank you for partnering with us on your Domo initiative. As we complete this phase of the engagement, we would greatly appreciate your feedback on both the delivery experience and the business impact of the solution.</p>
<p style="margin:0 0 16px">Your input helps us continuously improve how we design, implement, and support analytics solutions for our customers. This short survey will take less than two minutes to complete.</p>
<p style="margin:0 0 16px;text-align:center"><a href="${url}" style="background:#1F4E79;color:#fff;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:600;display:inline-block;font-size:15px">Take the 2-minute survey</a></p>
<p style="margin:0 0 12px;font-size:13px;color:#6b7280">Or copy this link into your browser:<br><a href="${url}" style="color:#1F4E79;word-break:break-all">${url}</a></p>
<p style="margin:0 0 12px">We sincerely value your perspective and appreciate your time.</p>
<p style="margin:0">Best Regards,<br>Paul Basterfield<br>Senior Manager, Consulting &amp; Partner Services, APAC</p>
</td></tr>
</table>`;
}

function buildEmailText(url: string, account: string, contactName: string): string {
  const g = greeting(account, contactName);
  return `${g}

Thank you for partnering with us on your Domo initiative. As we complete this phase of the engagement, we would greatly appreciate your feedback on both the delivery experience and the business impact of the solution.

Your input helps us continuously improve how we design, implement, and support analytics solutions for our customers. This short survey will take less than two minutes to complete.

Take the survey here: ${url}

We sincerely value your perspective and appreciate your time.

Best Regards,
Paul Basterfield
Senior Manager, Consulting & Partner Services, APAC`;
}

async function copyPlain(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // iframe sandbox fallback — use a textarea + execCommand
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

async function copyRichHtml(html: string): Promise<boolean> {
  try {
    const item = new ClipboardItem({
      'text/html': new Blob([html], { type: 'text/html' }),
      'text/plain': new Blob([html.replace(/<[^>]+>/g, '')], { type: 'text/plain' }),
    });
    await navigator.clipboard.write([item]);
    return true;
  } catch {
    // Fallback: render HTML into contenteditable + execCommand('copy').
    // This preserves text/html MIME on clipboard so Outlook renders styled email.
    try {
      const container = document.createElement('div');
      container.contentEditable = 'true';
      container.innerHTML = html;
      container.style.position = 'fixed';
      container.style.left = '-9999px';
      container.style.top = '0';
      document.body.appendChild(container);
      const range = document.createRange();
      range.selectNodeContents(container);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
      const ok = document.execCommand('copy');
      sel?.removeAllRanges();
      document.body.removeChild(container);
      return ok;
    } catch {
      return false;
    }
  }
}

interface CopyButtonProps {
  label: string;
  onCopy: () => Promise<boolean>;
  successLabel?: string;
}

const CopyButton: FC<CopyButtonProps> = ({ label, onCopy, successLabel = 'Copied ✓' }) => {
  const [copied, setCopied] = useState(false);
  const handle = async () => {
    const ok = await onCopy();
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } else {
      alert('Copy failed — select and copy manually');
    }
  };
  return (
    <button className={`${styles.copyBtn} ${copied ? styles.copied : ''}`} onClick={handle}>
      {copied ? successLabel : label}
    </button>
  );
};

export const App: FC = () => {
  const [project, setProject] = useState('');
  const [account, setAccount] = useState('');
  const [contactName, setContactName] = useState('');
  const [contact, setContact] = useState('');

  const url = useMemo(() => buildUrl(project, account, contactName, contact), [project, account, contactName, contact]);
  const html = useMemo(() => (url ? buildEmailHtml(url, account, contactName) : '—'), [url, account, contactName]);
  const text = useMemo(() => (url ? buildEmailText(url, account, contactName) : '—'), [url, account, contactName]);

  return (
    <div className={styles.app}>
      <header className={styles.brandBand}>
        <img className={styles.brandLogo} src={domoLogo} alt="Domo" />
      </header>
      <div className={styles.page}>
        <div className={styles.header}>
          <div className={styles.bar} />
          <h1>CSAT Survey — Link Builder</h1>
        </div>
        <div className={styles.sub}>
          Internal tool. Fill in project context, copy the URL + email body into your outbound email.
        </div>

        <div className={styles.card}>
          <div className={styles.field}>
            <label htmlFor="project">Project name</label>
            <input
              id="project"
              type="text"
              value={project}
              onChange={(e) => setProject(e.target.value)}
              placeholder="e.g. Forty Winks Rebates Project"
            />
            <div className={styles.hint}>
              Becomes <code>project_name</code> in the response row.
            </div>
          </div>
          <div className={styles.field}>
            <label htmlFor="account">Customer account</label>
            <input
              id="account"
              type="text"
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              placeholder="e.g. Forty Winks"
            />
            <div className={styles.hint}>
              Becomes <code>customer_account</code>.
            </div>
          </div>
          <div className={styles.field}>
            <label htmlFor="contact_name">Customer contact name</label>
            <input
              id="contact_name"
              type="text"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="e.g. Jane"
            />
            <div className={styles.hint}>
              Used in the email greeting (<code>Hi &#123;name&#125;,</code>) and stored as <code>customer_contact_name</code>.
            </div>
          </div>
          <div className={styles.field}>
            <label htmlFor="contact">Customer contact email (optional)</label>
            <input
              id="contact"
              type="text"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="e.g. jane@fortywinks.com.au"
            />
            <div className={styles.hint}>
              Becomes <code>customer_contact</code>. Leave blank for anonymous.
            </div>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.outLabel}>Survey URL</div>
          <div className={styles.outBox}>{url || 'Fill in fields above…'}</div>
          <div className={styles.row}>
            <CopyButton label="Copy URL" onCopy={() => copyPlain(url)} />
            {url && (
              <a className={styles.openBtn} href={url} target="_blank" rel="noopener noreferrer">
                Open preview ↗
              </a>
            )}
          </div>

          <div className={styles.outLabel}>Email body (HTML)</div>
          <div className={styles.outBox}>{html}</div>
          <CopyButton label="Copy as rich HTML" successLabel="Copied as rich HTML ✓" onCopy={() => copyRichHtml(html)} />

          <div className={styles.outLabel}>Email body (plain text fallback)</div>
          <div className={styles.outBox}>{text}</div>
          <CopyButton label="Copy plain text" onCopy={() => copyPlain(text)} />

          <div className={styles.outLabel}>Subject line</div>
          <div className={styles.outBox}>We Value Your Feedback</div>
          <CopyButton label="Copy subject" onCopy={() => copyPlain('We Value Your Feedback')} />
        </div>
      </div>
    </div>
  );
};
