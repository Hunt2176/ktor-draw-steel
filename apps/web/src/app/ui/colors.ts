/** Mantine-approximating colour pairs (base / hover) used by buttons & icons. */
export interface ColorPair {
  c: string;
  ch: string;
}

export type ColorName =
  | 'blue'
  | 'green'
  | 'red'
  | 'gray'
  | 'indigo'
  | 'dark'
  | 'yellow';

export const COLORS: Record<ColorName, ColorPair> = {
  blue: { c: '#228be6', ch: '#1c7ed6' },
  green: { c: '#40c057', ch: '#37b24d' },
  red: { c: '#fa5252', ch: '#f03e3e' },
  gray: { c: '#868e96', ch: '#787f87' },
  indigo: { c: '#4c6ef5', ch: '#4263eb' },
  dark: { c: '#25262b', ch: '#1a1b1e' },
  yellow: { c: '#f59f00', ch: '#f08c00' },
};

export function colorPair(name: string | undefined): ColorPair {
  return COLORS[(name ?? 'blue') as ColorName] ?? COLORS.blue;
}
