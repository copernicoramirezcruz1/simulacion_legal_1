export type CharacterRole =
  | 'PRESIDENTE'
  | 'VOCAL'
  | 'SECRETARIA'
  | 'ACCIONANTE'
  | 'ACCIONADA'
  | 'TERCERO'
  | 'SENTENCIA_FINAL';

export interface ScriptLine {
  role: CharacterRole;
  text: string;
  isStudentTurn: boolean;
}

export interface ScriptData {
  lines: ScriptLine[];
  metadata: {
    titulo: string;
    caso: string;
  };
}

export const ROLE_LABELS: Record<CharacterRole, string> = {
  PRESIDENTE: 'Presidente',
  VOCAL: 'Vocal Constitucional',
  SECRETARIA: 'Secretaria',
  ACCIONANTE: 'Parte Accionante',
  ACCIONADA: 'Parte Accionada',
  TERCERO: 'Tercero Interesado',
  SENTENCIA_FINAL: 'Lectura de Sentencia',
};

export const ROLE_COLORS: Record<CharacterRole, string> = {
  PRESIDENTE: '#b8860b',
  VOCAL: '#2e4057',
  SECRETARIA: '#4a6741',
  ACCIONANTE: '#1a5276',
  ACCIONADA: '#922b21',
  TERCERO: '#6c3483',
  SENTENCIA_FINAL: '#b8860b',
};

export type SimulationState =
  | 'IDLE'
  | 'LOADING'
  | 'PLAYING'
  | 'STUDENT_TURN'
  | 'FINISHED';
