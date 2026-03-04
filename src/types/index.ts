export interface Essay {
  id: string;
  category: string;
  date: string;
  title: string;
  excerpt: string;
  link: string;
}

export interface Tutorial {
  id: string;
  icon: 'code' | 'layers' | 'zap';
  title: string;
  description: string;
  level: string;
  status: string;
  link: string;
}

export interface Tool {
  id: string;
  icon: 'barChart' | 'droplet' | 'fileText' | 'search';
  title: string;
  description: string;
  link: string;
}

export interface NavItem {
  id: string;
  label: string;
  href: string;
}
