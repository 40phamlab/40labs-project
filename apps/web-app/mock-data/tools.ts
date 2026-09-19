export interface Tool {
  id: string;
  name: string;
  description?: string;
  href: string;
}

const tools: Tool[] = [
  {
    id: 'core',
    name: '40LabsCore',
    description: 'Desktop ERP for pharmacies',
    href: '#' // TODO: Add real download URL when available
  },
  {
    id: 'vlabs',
    name: 'vLabs',
    description: 'Virtual lab management',
    href: '#' // TODO: real destination
  },
  {
    id: 'adesk',
    name: 'aDesk',
    description: 'Admin desk & reporting',
    href: '#' // TODO: real destination
  },
];

/**
 * Returns the list of tools showcased on the landing page.
 */
export function getTools(): Tool[] {
  return [...tools];
}
