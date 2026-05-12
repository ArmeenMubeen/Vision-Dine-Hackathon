"use client";

import React, { useEffect, forwardRef } from 'react';

// Tell TypeScript about the model-viewer custom element
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        src?: string;
        alt?: string;
        'camera-controls'?: boolean;
        'auto-rotate'?: boolean;
        ar?: boolean;
        scale?: string;
        [key: string]: any;
      };
    }
  }
}

interface ModelViewerProps extends React.HTMLAttributes<HTMLElement> {
  src: string;
  alt?: string;
  scale?: string;
}

const ModelViewer = forwardRef<HTMLElement, ModelViewerProps>(({ src, alt, scale, ...props }, ref) => {
  useEffect(() => {
    import('@google/model-viewer').catch(console.error);
  }, []);

  return React.createElement('model-viewer', {
    ref,
    src,
    alt: alt || "A 3D model",
    'camera-controls': true,
    'auto-rotate': true,
    ar: true,
    scale,
    style: { width: '100%', height: '100%' },
    ...props
  });
});

ModelViewer.displayName = 'ModelViewer';

export default ModelViewer;
