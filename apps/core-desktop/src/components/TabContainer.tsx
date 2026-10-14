import * as React from 'react';
import { Screen, type ScreenProps } from '@40labs/ui-components';

export interface TabContainerProps extends ScreenProps {}

/**
 * @deprecated Use Screen from @40labs/ui-components instead.
 */
export const TabContainer: React.FC<TabContainerProps> = (props) => {
  return <Screen {...props} />;
};
