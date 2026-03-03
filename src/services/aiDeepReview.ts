export type AiDeepReviewMode = 'pr' | 'main';

export type AiDeepReviewFile = {
  filename: string;
  patch?: string;
  content?: string;
};

export type AiDeepReviewIssue = {
  file: string;
  line: number | null;
  severity: 'high' | 'medium' | 'low';
  category: 'security' | 'performance' | 'best-practice';
  message: string;
  suggestion: string;
  rationale: string;
};

export type AiDeepReviewResult = {
  score: number;
  issues: AiDeepReviewIssue[];
};

export async function runAiDeepReview(params: {
  mode: AiDeepReviewMode;
  repoFullName?: string;
  files: AiDeepReviewFile[];
  openaiApiKey?: string;
}): Promise<AiDeepReviewResult> {
  const resp = await fetch('/.netlify/functions/aiReview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });

  const text = await resp.text();
  if (!resp.ok) {
    throw new Error(text || `AI review failed (${resp.status})`);
  }

  return JSON.parse(text) as AiDeepReviewResult;
}

