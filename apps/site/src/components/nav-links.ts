import type { IconName } from '@birb-learn/theme';

export interface NavItem {
  href: '/' | '/content' | '/simulado';
  messageKey: 'home' | 'content' | 'simulado';
  icon: IconName;
}

export const NAV_ITEMS: NavItem[] = [
  { href: '/', messageKey: 'home', icon: 'home' },
  { href: '/content', messageKey: 'content', icon: 'book-open' },
  { href: '/simulado', messageKey: 'simulado', icon: 'clipboard-list' },
];

/** Whether `pathname` (locale prefix already stripped) falls under the nav item. */
export function isNavItemActive(href: NavItem['href'], pathname: string): boolean {
  if (href === '/') return pathname === '/' || pathname === '';
  return pathname === href || pathname.startsWith(`${href}/`);
}
