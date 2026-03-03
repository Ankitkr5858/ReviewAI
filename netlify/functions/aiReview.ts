type Severity = 'high' | 'medium' | 'low';
type Category = 'security' | 'performance' | 'best-practice';

type ReviewFile = {
  filename: string;
  patch?: string;
  content?: string;
};

type AiReviewRequest = {
  mode: 'pr' | 'main';
  repoFullName?: string;
  files: ReviewFile[];
  openaiApiKey?: string;
};

type AiReviewIssue = {
  file: string;
  line: number | null;
  severity: Severity;
  category: Category;
  message: string;
  suggestion: string;
  rationale: string;
};

type AiReviewResponse = {
  score: number;
  issues: AiReviewIssue[];
};

const jsonSchema = {
  name: 'review_ai_deep_review',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      score: { type: 'number', minimum: 0, maximum: 100 },
      issues: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            file: { type: 'string' },
            line: { anyOf: [{ type: 'number', minimum: 1 }, { type: 'null' }] },
            severity: { type: 'string', enum: ['high', 'medium', 'low'] },
            category: { type: 'string', enum: ['security', 'performance', 'best-practice'] },
            message: { type: 'string' },
            suggestion: { type: 'string' },
            rationale: { type: 'string' }
          },
          required: ['file', 'line', 'severity', 'category', 'message', 'suggestion', 'rationale']
        }
      }
    },
    required: ['score', 'issues']
  }
} as const;

function safeJsonParse<T>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

function extractOutputText(openaiResponse: any): string | null {
  if (typeof openaiResponse?.output_text === 'string' && openaiResponse.output_text.trim()) {
    return openaiResponse.output_text;
  }

  const output = openaiResponse?.output;
  if (!Array.isArray(output)) return null;

  for (const item of output) {
    if (item?.type === 'message' && Array.isArray(item?.content)) {
      for (const c of item.content) {
        if (c?.type === 'output_text' && typeof c?.text === 'string') {
          return c.text;
        }
      }
    }
  }

  return null;
}

export const handler = async (event: any) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const body = safeJsonParse<AiReviewRequest>(event.body || '');
  if (!body || !Array.isArray(body.files) || body.files.length === 0) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid payload' }) };
  }

  const apiKey = (body.openaiApiKey || process.env.OPENAI_API_KEY || '').trim();
  if (!apiKey) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Missing OpenAI API key' }) };
  }

  const files = body.files
    .filter(f => f && typeof f.filename === 'string')
    .slice(0, 10)
    .map(f => ({
      filename: f.filename,
      patch: typeof f.patch === 'string' ? f.patch.slice(0, 12000) : undefined,
      content: typeof f.content === 'string' ? f.content.slice(0, 12000) : undefined
    }));

  const prompt = [
    'You are a senior software engineer performing a deep code review.',
    '',
    'Goals:',
    '- Identify correctness bugs, edge cases, security issues, performance issues, and maintainability risks.',
    '- Prefer concrete, technically-correct suggestions.',
    '- Do NOT focus on formatting/prettier/eslint unless it affects correctness, security, or runtime behavior.',
    '- Do NOT propose changes that are likely to break imports/paths/build configuration.',
    '',
    'Output JSON strictly matching the provided schema.',
    '',
    `Context: mode=${body.mode}${body.repoFullName ? ` repo=${body.repoFullName}` : ''}`,
    '',
    'Files:',
    JSON.stringify(files)
  ].join('\n');

  try {
    const resp = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        input: prompt,
        text: {
          format: {
            type: 'json_schema',
            json_schema: jsonSchema
          }
        }
      })
    });

    if (!resp.ok) {
      const errorText = await resp.text();
      return { statusCode: resp.status, body: JSON.stringify({ error: errorText }) };
    }

    const data = await resp.json();
    const text = extractOutputText(data);
    if (!text) {
      return { statusCode: 502, body: JSON.stringify({ error: 'No model output' }) };
    }

    const parsed = safeJsonParse<AiReviewResponse>(text);
    if (!parsed) {
      return { statusCode: 502, body: JSON.stringify({ error: 'Invalid JSON output', raw: text }) };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed)
    };
  } catch (e: any) {
    return { statusCode: 500, body: JSON.stringify({ error: e?.message || 'Server error' }) };
  }
};

