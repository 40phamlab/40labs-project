import { Surface, SurfaceProps } from './Surface';

export interface PanelProps extends Omit<SurfaceProps, 'header' | 'footer'> {}

export function Panel({ variant = 'flat', padding = 'md', ...props }: PanelProps) {
  return <Surface variant={variant} padding={padding} {...props} />;
}
