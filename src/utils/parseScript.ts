import type { ScriptData, ScriptLine, CharacterRole } from '../types';

const ROLE_PATTERN = /^(PRESIDENTE|VOCAL|SECRETARIA|ACCIONANTE|ACCIONADA|TERCERO|SENTENCIA_FINAL):\s*(.+)/;

export function parseScript(raw: string): ScriptData {
  const lines = raw.split('\n');
  const scriptLines: ScriptLine[] = [];
  const metadata: ScriptData['metadata'] = { titulo: '', caso: '' };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith('TITULO:')) {
      metadata.titulo = trimmed.replace('TITULO:', '').trim();
      continue;
    }

    if (trimmed.startsWith('CASO:')) {
      metadata.caso = trimmed.replace('CASO:', '').trim();
      continue;
    }

    if (trimmed === '[ACCIONANTE]') {
      scriptLines.push({
        role: 'ACCIONANTE',
        text: '',
        isStudentTurn: true,
      });
      continue;
    }

    const match = trimmed.match(ROLE_PATTERN);
    if (match) {
      const role = match[1] as CharacterRole;
      const text = match[2].trim();
      scriptLines.push({
        role,
        text,
        isStudentTurn: false,
      });
    }
  }

  return { lines: scriptLines, metadata };
}

export function loadScriptFromUrl(url: string): Promise<ScriptData> {
  return fetch(url)
    .then((res) => res.text())
    .then(parseScript);
}
