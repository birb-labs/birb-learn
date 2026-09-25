import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CircleCheck,
  CircleCheckBig,
  ChevronRight,
  Circle,
  ClipboardList,
  Coffee,
  Compass,
  Home,
  Inbox,
  Languages,
  Lightbulb,
  Palette,
  PencilLine,
  Plus,
  Search,
  Settings,
  Shuffle,
  X,
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
  'check-circle': CircleCheckBig,
  'check-circle-2': CircleCheck,
  circle: Circle,
  'x-circle': XCircle,
  inbox: Inbox,
  lightbulb: Lightbulb,
  compass: Compass,
  search: Search,
  settings: Settings,
  coffee: Coffee,
  'arrow-left': ArrowLeft,
  'arrow-right': ArrowRight,
  x: X,
  plus: Plus,
  check: Check,
  'pencil-line': PencilLine,
  shuffle: Shuffle,
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
