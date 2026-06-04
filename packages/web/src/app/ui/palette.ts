/** Mantine accent palette (base + hover shade) used by the UI components. */
export type AccentColor =
  | 'blue'
  | 'blue-light'
  | 'indigo'
  | 'green'
  | 'red'
  | 'orange'
  | 'yellow'
  | 'grape'
  | 'teal'
  | 'gray'
  | 'dark';

export const PALETTE: Record<AccentColor, { base: string; hover: string }> = {
  blue: { base: '#228be6', hover: '#4dabf7' },
  'blue-light': { base: '#4dabf7', hover: '#74c0fc' },
  indigo: { base: '#4c6ef5', hover: '#5c7cfa' },
  green: { base: '#40c057', hover: '#51cf66' },
  red: { base: '#fa5252', hover: '#ff6b6b' },
  orange: { base: '#fd7e14', hover: '#ffa94d' },
  yellow: { base: '#fab005', hover: '#ffd43b' },
  grape: { base: '#be4bdb', hover: '#cc5de8' },
  teal: { base: '#12b886', hover: '#20c997' },
  gray: { base: '#868e96', hover: '#adb5bd' },
  dark: { base: '#25262b', hover: '#373a40' },
};
