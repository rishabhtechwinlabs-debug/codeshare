import { NextResponse } from 'next/server';

const LANGUAGE_PISTON_MAP = {
  'javascript': { language: 'javascript', version: '18.15.0' },
  'typescript': { language: 'typescript', version: '5.0.3' },
  'python': { language: 'python', version: '3.10.0' },
  'cpp': { language: 'c++', version: '10.2.0' },
  'c': { language: 'c', version: '10.2.0' },
  'java': { language: 'java', version: '15.0.2' },
  'go': { language: 'go', version: '1.16.2' },
  'rust': { language: 'rust', version: '1.68.2' },
  'php': { language: 'php', version: '8.2.3' },
  'ruby': { language: 'ruby', version: '3.0.1' },
  'sql': { language: 'sqlite3', version: '3.36.0' },
  'shell': { language: 'bash', version: '5.2.0' }
};

export async function POST(request) {
  try {
    const { language = 'javascript', code = '', filename = 'main.js' } = await request.json();

    if (!code || !code.trim()) {
      return NextResponse.json({
        output: '',
        error: 'No code provided to execute.',
        executionTime: 0
      }, { status: 400 });
    }

    const normalizedLang = language.toLowerCase();
    const config = LANGUAGE_PISTON_MAP[normalizedLang] || LANGUAGE_PISTON_MAP['javascript'];

    const startTime = Date.now();

    const response = await fetch('https://emkc.org/api/v2/piston/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        language: config.language,
        version: config.version,
        files: [
          {
            name: filename,
            content: code
          }
        ]
      })
    });

    const executionTime = Date.now() - startTime;

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json({
        output: '',
        error: `Code execution engine error (${response.status}): ${errText}`,
        executionTime
      }, { status: response.status });
    }

    const result = await response.json();

    const run = result.run || {};
    const stdout = run.stdout || '';
    const stderr = run.stderr || '';
    const output = run.output || (stdout + stderr);

    return NextResponse.json({
      output: output,
      stdout: stdout,
      stderr: stderr,
      code: run.code,
      signal: run.signal,
      executionTime
    });

  } catch (error) {
    return NextResponse.json({
      output: '',
      error: `Execution request failed: ${error.message}`,
      executionTime: 0
    }, { status: 500 });
  }
}
