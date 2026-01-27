/**
 * Theme Configuration
 * Centralized theme definitions for consistent styling across the app
 */
export const THEME = {
  bg: 'bg-brand-black', // #000000
  card: 'bg-brand-dark', // #171717
  cardHover: 'hover:bg-[#262626]',
  border: 'border-brand-border',
  textPrimary: 'text-brand-white',
  textSecondary: 'text-brand-gray',
  accent: 'text-brand-green', // #06C167
  buttonPrimary: 'bg-brand-green text-black hover:bg-[#05a357]',
  buttonSecondary: 'bg-[#333333] text-white hover:bg-[#444444]',
  input: 'bg-[#262626] border-brand-border text-white focus:border-brand-green',
  
  // Status Colors
  statusActive: 'text-brand-green',
  statusInactive: 'text-gray-500',
  statusArchived: 'text-red-500',
  
  // Tournament Status
  statusScheduled: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  statusRegistration: 'bg-brand-green/10 text-brand-green border-brand-green/20',
  statusInProgress: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  statusCompleted: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
  statusCancelled: 'bg-red-500/10 text-red-500 border-red-500/20',
};

/**
 * Helper function to combine theme classes with custom classes
 */
export function cn(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

