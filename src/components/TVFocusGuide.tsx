import React from 'react';
import { View, ViewProps } from 'react-native';

const ReactNative = require('react-native');
const NativeTVFocusGuide = ReactNative.TVFocusGuideView || View;

export interface TVFocusGuideProps extends ViewProps {
  autoFocus?: boolean;
  trapFocusUp?: boolean;
  trapFocusDown?: boolean;
  trapFocusLeft?: boolean;
  trapFocusRight?: boolean;
  destinations?: any[];
  children?: React.ReactNode;
}

export const TVFocusGuide: React.FC<TVFocusGuideProps> = ({ children, ...props }) => {
  return <NativeTVFocusGuide {...props}>{children}</NativeTVFocusGuide>;
};

export default TVFocusGuide;
