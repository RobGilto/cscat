import { useMemo, useState } from 'react';

const WEBHOOK_URL = (import.meta.env.VITE_WEBHOOK_URL as string) || '';

type ScaleOption = { value: number; label: string };
type EnumOption = { value: string; label: string };

const scale5to1 = (l5: string, l4: string, l3: string, l2: string, l1: string): ScaleOption[] => [
  { value: 5, label: l5 },
  { value: 4, label: l4 },
  { value: 3, label: l3 },
  { value: 2, label: l2 },
  { value: 1, label: l1 },
];

const Q1 = scale5to1('Extremely satisfied', 'Satisfied', 'Neutral', 'Dissatisfied', 'Extremely dissatisfied');
const Q2 = scale5to1('Significant measurable value', 'Clear value', 'Moderate value', 'Limited value', 'No value');
const Q3 = scale5to1('Exceeded expectations', 'Met expectations', 'Partially met expectations', 'Fell short', 'Did not meet expectations');
const Q4 = scale5to1('Excellent', 'Very good', 'Adequate', 'Needs improvement', 'Poor');

const Q5: EnumOption[] = [
  { value: 'Definitely', label: 'Definitely' },
  { value: 'Probably', label: 'Probably' },
  { value: 'NotSure', label: 'Not sure' },
  { value: 'ProbablyNot', label: 'Probably not' },
  { value: 'DefinitelyNot', label: 'Definitely not' },
];

interface FormState {
  q1_overall: number | null;
  q2_value: number | null;
  q3_alignment: number | null;
  q4_delivery: number | null;
  q5_future: string | null;
  q6_feedback: string;
}

function getUrlParam(name: string): string {
  const p = new URLSearchParams(window.location.search);
  return p.get(name) || '';
}

function uuid(): string {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
      });
}

interface ScaleQuestionProps {
  num: number;
  text: string;
  options: ScaleOption[] | EnumOption[];
  value: number | string | null;
  onChange: (v: never) => void;
  name: string;
}

function ScaleQuestion({ num, text, options, value, onChange, name }: ScaleQuestionProps) {
  return (
    <div className="card">
      <div className="q-num">Question {num}</div>
      <div className="q-text">{text}</div>
      <div className="options">
        {options.map((opt) => {
          const selected = value === opt.value;
          return (
            <label key={String(opt.value)} className={`option ${selected ? 'selected' : ''}`}>
              <input
                type="radio"
                name={name}
                value={String(opt.value)}
                checked={selected}
                onChange={() => onChange(opt.value as never)}
              />
              <span>{opt.label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

export default function App() {
  const projectName = useMemo(() => getUrlParam('project'), []);
  const account = useMemo(() => getUrlParam('account'), []);
  const contact = useMemo(() => getUrlParam('contact'), []);

  const [form, setForm] = useState<FormState>({
    q1_overall: null,
    q2_value: null,
    q3_alignment: null,
    q4_delivery: null,
    q5_future: null,
    q6_feedback: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const isValid =
    form.q1_overall !== null &&
    form.q2_value !== null &&
    form.q3_alignment !== null &&
    form.q4_delivery !== null &&
    form.q5_future !== null;

  async function handleSubmit() {
    if (!isValid || submitting) return;
    setSubmitting(true);
    setError(null);

    const payload = {
      response_id: uuid(),
      submitted_at: new Date().toISOString(),
      project_name: projectName,
      customer_account: account,
      customer_contact: contact,
      q1_overall: form.q1_overall,
      q2_value: form.q2_value,
      q3_alignment: form.q3_alignment,
      q4_delivery: form.q4_delivery,
      q5_future: form.q5_future,
      q6_feedback: form.q6_feedback,
      avg_score: ((form.q1_overall! + form.q2_value! + form.q3_alignment! + form.q4_delivery!) / 4).toFixed(2),
      user_agent: navigator.userAgent,
    };

    try {
      if (!WEBHOOK_URL) {
        console.warn('VITE_WEBHOOK_URL not set — payload would have been:', payload);
        await new Promise((r) => setTimeout(r, 600));
      } else {
        await fetch(WEBHOOK_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify(payload),
        });
      }
      setSubmitted(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Submit failed');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="page">
        <div className="thanks">
          <h2>Thank you</h2>
          <p>Your feedback has been recorded. We appreciate your time.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="header">
        <div className="header-bar" />
        <h1>We Value Your Feedback</h1>
      </div>

      {(projectName || account) && (
        <div className="context-pill">
          {account && <span>{account}</span>}
          {account && projectName && <span> · </span>}
          {projectName && <span>{projectName}</span>}
        </div>
      )}

      <p className="intro">
        Thank you for partnering with us on your Domo initiative. As we complete this phase of the engagement, we would
        greatly appreciate your feedback on both the delivery experience and the business impact of the solution. This
        short survey will take less than two minutes to complete.
      </p>

      <ScaleQuestion
        num={1}
        text="How satisfied are you with the Domo engagement overall?"
        options={Q1}
        value={form.q1_overall}
        name="q1"
        onChange={(v) => setForm({ ...form, q1_overall: v })}
      />
      <ScaleQuestion
        num={2}
        text="To what extent has the delivered solution provided meaningful business value?"
        options={Q2}
        value={form.q2_value}
        name="q2"
        onChange={(v) => setForm({ ...form, q2_value: v })}
      />
      <ScaleQuestion
        num={3}
        text="How well did the solution align with your original goals and expectations?"
        options={Q3}
        value={form.q3_alignment}
        name="q3"
        onChange={(v) => setForm({ ...form, q3_alignment: v })}
      />
      <ScaleQuestion
        num={4}
        text="How would you rate the overall project delivery experience (communication, organization, professionalism)?"
        options={Q4}
        value={form.q4_delivery}
        name="q4"
        onChange={(v) => setForm({ ...form, q4_delivery: v })}
      />
      <ScaleQuestion
        num={5}
        text="Would you engage with our team or Partner again for future Domo initiatives?"
        options={Q5}
        value={form.q5_future}
        name="q5"
        onChange={(v) => setForm({ ...form, q5_future: v })}
      />

      <div className="card">
        <div className="q-num">Question 6</div>
        <div className="q-text">
          Please share any additional feedback, comments, or suggestions that would help us improve future engagements.
        </div>
        <textarea
          value={form.q6_feedback}
          onChange={(e) => setForm({ ...form, q6_feedback: e.target.value })}
          placeholder="Optional"
        />
      </div>

      {error && <div className="error">{error}</div>}

      <div className="actions">
        <button className="btn" disabled={!isValid || submitting} onClick={handleSubmit}>
          {submitting ? 'Submitting…' : 'Submit feedback'}
        </button>
      </div>
    </div>
  );
}
