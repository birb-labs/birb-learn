import {
  BookOpen,
  CheckCircle,
  CheckCircle2,
  ChevronRight,
  Circle,
  ClipboardList,
  Home,
  Inbox,
  Languages,
  Palette,
  XCircle,
  type LucideProps,
} from 'lucide-react';

const ICONS = {
  home: Home,
  'book-open': BookOpen,
  'clipboard-list': ClipboardList,
  palette: Palette,
  languages: Languages,
  'chevron-right': ChevronRight,
  'check-circle': CheckCircle,
  'check-circle-2': CheckCircle2,
  circle: Circle,
  'x-circle': XCircle,
  inbox: Inbox,
} as const;

export type IconName = keyof typeof ICONS;

/**
 * Thin wrapper around the Lucide icon set used across both the site and
 * the admin panel. Centralizing the import here means swapping the icon
 * library later is a one-file change, and `IconName` being a closed union
 * catches a typo'd icon name at compile time everywhere it's used.
 */
export function Icon({ name, ...props }: { name: IconName } & LucideProps) {
  const LucideIcon = ICONS[name];
  if (!LucideIcon) {
    throw new Error(`Unknown icon: "${name}"`);
  }
  return <LucideIcon {...props} />;
}
