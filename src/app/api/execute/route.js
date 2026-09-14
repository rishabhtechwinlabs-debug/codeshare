import { NextResponse } from 'next/server';

const LANGUAGE_JUDGE0_MAP = {
  'javascript': 63,  // Node.js
  'typescript': 74,  // TypeScript
  'python': 71,      // Python 3
  'cpp': 54,         // C++ (GCC 9.2.0)
  'c': 50,           // C (GCC 9.2.0)
  'java': 62,        // Java (OpenJDK 13.0.1)
  'go': 60,          // Go (1.13.5)
  'rust': 73,        // Rust (1.40.0)
  'sql': 82,         // SQLite 3
  'shell': 46,       // Bash 5.0
  'html': 63,
  'css': 63,
  'markdown': 63
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
    const languageId = LANGUAGE_JUDGE0_MAP[normalizedLang] || 63;

    const startTime = Date.now();

    const response = await fetch('https://ce.judge0.com/submissions?wait=true', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        source_code: code,
        language_id: languageId
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

    const stdout = result.stdout || '';
    const stderr = result.stderr || result.compile_output || result.message || '';
    const output = stdout || stderr || 'Code executed successfully with no output returned.';
    const statusDesc = result.status?.description || 'Executed';

    return NextResponse.json({
      output: output,
      stdout: stdout,
      stderr: stderr,
      code: result.status?.id === 3 ? 0 : 1,
      status: statusDesc,
      executionTime: Math.round(parseFloat(result.time || 0) * 1000) || executionTime
    });

  } catch (error) {
    return NextResponse.json({
      output: '',
      error: `Execution request failed: ${error.message}`,
      executionTime: 0
    }, { status: 500 });
  }
}
