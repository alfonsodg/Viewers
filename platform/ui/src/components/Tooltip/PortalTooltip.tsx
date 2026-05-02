import React, { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';

import Card from './PortalTooltipCard';

interface PortalTooltipProps {
  parent: string | HTMLElement;
  active?: boolean;
  group?: string;
  tooltipTimeout?: number;
  children?: React.ReactNode;
  [key: string]: unknown;
}

/**
 * A portal based tooltip component.
 *
 * This component has been repurposed and modified
 * for OHIF usage: https://github.com/romainberger/react-portal-tooltip
 *
 * Rewritten from class component to functional component to remove
 * deprecated lifecycle methods (componentWillReceiveProps) and
 * legacy ReactDOM.render API.
 */
export default function PortalTooltip({
  parent,
  active = false,
  group = 'main',
  tooltipTimeout = 0,
  children,
  ...other
}: PortalTooltipProps) {
  const portalNodeRef = useRef<HTMLDivElement | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevActiveRef = useRef(active);
  const [shouldRender, setShouldRender] = React.useState(active);

  // Create portal node on mount
  useEffect(() => {
    const node = document.createElement('div');
    node.className = 'ToolTipPortal';
    document.body.appendChild(node);
    portalNodeRef.current = node;

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (portalNodeRef.current) {
        try {
          document.body.removeChild(portalNodeRef.current);
        } catch (e) {
          console.warn('Failed to remove portal node:', e);
        }
      }
    };
  }, []);

  // Handle active state transitions with timeout
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (active) {
      setShouldRender(true);
    } else if (prevActiveRef.current && !active) {
      // Was active, now deactivating — apply timeout
      if (tooltipTimeout > 0) {
        timeoutRef.current = setTimeout(() => {
          setShouldRender(false);
        }, tooltipTimeout);
      } else {
        setShouldRender(false);
      }
    }

    prevActiveRef.current = active;
  }, [active, tooltipTimeout]);

  const getParentEl = useCallback(() => {
    return typeof parent === 'string' ? document.querySelector(parent) : parent;
  }, [parent]);

  if (!portalNodeRef.current) {
    return null;
  }

  const parentEl = getParentEl();

  return createPortal(
    <Card
      parentEl={parentEl}
      active={shouldRender}
      {...other}
    >
      {children}
    </Card>,
    portalNodeRef.current
  );
}
