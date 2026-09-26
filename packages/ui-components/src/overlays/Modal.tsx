"use client";

import * as React from 'react';
import { Dialog, DialogProps } from './Dialog';

export interface ModalProps extends DialogProps {}

export const Modal: React.FC<ModalProps> = (props) => {
  return <Dialog {...props} />;
};
