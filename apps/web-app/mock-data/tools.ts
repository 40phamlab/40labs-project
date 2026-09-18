export interface Tool {
  id: string;
  name: string;
}

const tools: Tool[] = [
  { id: 'core', name: '40LabsCore' },
  { id: 'vlabs', name: 'vLabs' },
  { id: 'adesk', name: 'aDesk' },
];

/**
 * Returns the list of tools showcased on the landing page.
 */
export function getTools(): Tool[] {
  return [...tools];
}
