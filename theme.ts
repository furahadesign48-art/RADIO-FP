export type ThemeType = 'Classic' | 'Ocean' | 'Midnight';

export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string[];
  text: string;
  textSecondary: string;
  card: string;
}

export const THEMES: Record<ThemeType | 'Light', ThemeColors> = {
  Classic: {
    primary: '#FF8C00',
    secondary: '#FF4500',
    background: ['#4e3829', '#221e26', '#221e26', '#4e3829'],
    text: '#ffffff',
    textSecondary: 'rgba(255,255,255,0.7)',
    card: 'rgba(255,255,255,0.05)',
  },
  Ocean: {
    primary: '#00D2FF',
    secondary: '#004E92',
    background: ['#0A1128', '#001F54', '#001F54', '#0A1128'],
    text: '#ffffff',
    textSecondary: 'rgba(255,255,255,0.7)',
    card: 'rgba(255,255,255,0.08)',
  },
  Midnight: {
    primary: '#E63946',
    secondary: '#A4161A',
    background: ['#1A0505', '#310E0E', '#310E0E', '#1A0505'],
    text: '#ffffff',
    textSecondary: 'rgba(255,255,255,0.7)',
    card: 'rgba(255,255,255,0.05)',
  },
  Light: {
    primary: '#FF8C00',
    secondary: '#FF4500',
    background: ['#f8f9fa', '#e9ecef', '#e9ecef', '#f8f9fa'],
    text: '#212529',
    textSecondary: 'rgba(33,37,41,0.6)',
    card: 'rgba(0,0,0,0.05)',
  }
};
