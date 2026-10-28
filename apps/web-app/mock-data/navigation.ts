export interface NavItem {
  key: string;
  label: string;
  href: string;
}

export function getCompanyNavItems(): NavItem[] {
  return [
    { key: 'home', label: 'Home', href: '/' },
    { key: 'products', label: 'Products', href: '/products' },
    { key: 'blog', label: 'Blog', href: '/blog' },
    { key: 'publications', label: 'Publications', href: '/publications' },
    { key: 'about', label: 'About', href: '/about' },
  ];
}

export function isNavActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  if (href === '/') {
    return pathname === '/';
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
