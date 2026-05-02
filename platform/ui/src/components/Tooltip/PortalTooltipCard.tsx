import React, { useState, useEffect, useRef, useCallback } from 'react';

const FG_SIZE = 8;
const BG_SIZE = 9;
const MARGIN = 15;

const DEFAULT_ARROW_STYLE = {
  color: '#090c29',
  borderColor: 'rgba(58, 63, 153, 1)',
};

interface PortalTooltipCardProps {
  active?: boolean;
  position?: 'top' | 'right' | 'bottom' | 'left';
  arrow?: null | 'center' | 'top' | 'right' | 'bottom' | 'left';
  align?: null | 'center' | 'right' | 'left';
  style?: { style?: React.CSSProperties; arrowStyle?: Record<string, unknown> };
  useHover?: boolean;
  parentEl?: HTMLElement | null;
  children?: React.ReactNode;
}

/**
 * A portal based tooltip card component.
 *
 * Rewritten from class component to functional component.
 * Original: https://github.com/romainberger/react-portal-tooltip
 */
export default function PortalTooltipCard({
  active = false,
  position = 'right',
  arrow = null,
  align = null,
  style: styleProp = { style: {}, arrowStyle: {} },
  useHover = true,
  parentEl,
  children,
}: PortalTooltipCardProps) {
  const [hover, setHover] = useState(false);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const rootRef = useRef<HTMLDivElement>(null);
  const offscreenDifferenceRef = useRef(0);

  const updateSize = useCallback(() => {
    if (!rootRef.current) {
      return;
    }
    const newWidth = rootRef.current.offsetWidth;
    const newHeight = rootRef.current.offsetHeight;
    setSize(prev => {
      if (prev.width !== newWidth || prev.height !== newHeight) {
        return { width: newWidth, height: newHeight };
      }
      return prev;
    });
  }, []);

  useEffect(() => {
    updateSize();
  }, [active, parentEl, children, updateSize]);

  const mergeStyle = (base: Record<string, unknown>, theme?: Record<string, unknown>) => {
    if (!theme) {
      return base;
    }
    const { position: _p, top: _t, left: _l, right: _r, bottom: _b, marginLeft: _ml, marginRight: _mr, ...validTheme } = theme;
    return { ...base, ...validTheme };
  };

  const getPositionStyle = () => {
    if (!parentEl) {
      return {};
    }

    const tooltipPosition = parentEl.getBoundingClientRect();
    const scrollY = window.scrollY ?? window.pageYOffset;
    const scrollX = window.scrollX ?? window.pageXOffset;
    let top = scrollY + tooltipPosition.top;
    const left = scrollX + tooltipPosition.left;
    const result: Record<string, number> = {};

    if (rootRef.current) {
      const newHeight = rootRef.current.offsetHeight / 2;
      const bottomPosition = tooltipPosition.bottom + newHeight;
      const isOffscreen = bottomPosition > window.innerHeight;
      const offDiff = bottomPosition - window.innerHeight;
      if (isOffscreen) {
        const padding = 3;
        top -= offDiff;
        offscreenDifferenceRef.current = Math.min(
          Math.max(offDiff, 0),
          newHeight - parentEl.getBoundingClientRect().height / 2 - padding
        );
      } else {
        offscreenDifferenceRef.current = 0;
      }
    }

    const parentSize = {
      width: parentEl.offsetWidth || parentEl.getBoundingClientRect?.().width || 0,
      height: parentEl.offsetHeight || parentEl.getBoundingClientRect?.().height || 0,
    };

    let alignOffset = 0;
    if (align === 'left') {
      alignOffset = -parentSize.width / 2 + FG_SIZE;
    } else if (align === 'right') {
      alignOffset = parentSize.width / 2 - FG_SIZE;
    }

    const positionMap: Record<string, () => void> = {
      left: () => {
        result.top = top + parentSize.height / 2 - size.height / 2;
        result.left = left - size.width - MARGIN;
      },
      right: () => {
        result.top = top + parentSize.height / 2 - size.height / 2;
        result.left = left + parentSize.width + MARGIN;
      },
      top: () => {
        result.left = left - size.width / 2 + parentSize.width / 2 + alignOffset;
        result.top = top - size.height - MARGIN;
      },
      bottom: () => {
        result.left = left - size.width / 2 + parentSize.width / 2 + alignOffset;
        result.top = top + parentSize.height + MARGIN;
      },
    };

    positionMap[position]?.();

    const arrowMap: Record<string, () => void> = {
      left: () => { result.left = left + parentSize.width / 2 - MARGIN + alignOffset; },
      right: () => { result.left = left - size.width + parentSize.width / 2 + MARGIN + alignOffset; },
      top: () => { result.top = top + parentSize.height / 2 - MARGIN; },
      bottom: () => { result.top = top + parentSize.height / 2 - size.height + MARGIN; },
    };

    if (arrow) {
      arrowMap[arrow]?.();
    }

    return result;
  };

  const getArrowStyles = () => {
    const arrowStyle = { ...DEFAULT_ARROW_STYLE, ...styleProp.arrowStyle };
    const bgBorderColor = arrowStyle.borderColor || 'transparent';

    const fgColorBorder = `10px solid ${arrowStyle.color}`;
    const fgTransBorder = `${FG_SIZE}px solid transparent`;
    const bgColorBorder = `12px solid ${bgBorderColor}`;
    const bgTransBorder = `${BG_SIZE}px solid transparent`;

    const fgStyle: Record<string, unknown> = { position: 'absolute', content: '""', zIndex: 60 };
    const bgStyle: Record<string, unknown> = { position: 'absolute', content: '""', zIndex: 55 };

    if (position === 'left' || position === 'right') {
      Object.assign(fgStyle, { top: '50%', borderTop: fgTransBorder, borderBottom: fgTransBorder, marginTop: -7 });
      Object.assign(bgStyle, { borderTop: bgTransBorder, borderBottom: bgTransBorder, top: '50%', marginTop: -8 });

      if (position === 'left') {
        fgStyle.right = -10; fgStyle.borderLeft = fgColorBorder;
        bgStyle.right = -11; bgStyle.borderLeft = bgColorBorder;
      } else {
        fgStyle.left = -9; fgStyle.borderRight = fgColorBorder;
        bgStyle.left = -11; bgStyle.borderRight = bgColorBorder;
      }

      if (arrow === 'top') { fgStyle.top = MARGIN; bgStyle.top = MARGIN; }
      if (arrow === 'bottom') {
        fgStyle.top = null; fgStyle.bottom = MARGIN - 7;
        bgStyle.top = null; bgStyle.bottom = MARGIN - 8;
      }
    } else {
      Object.assign(fgStyle, {
        left: Math.round(size.width / 2 - FG_SIZE),
        borderLeft: fgTransBorder, borderRight: fgTransBorder, marginLeft: 0,
      });
      Object.assign(bgStyle, {
        left: (fgStyle.left as number) - 1,
        borderLeft: bgTransBorder, borderRight: bgTransBorder, marginLeft: 0,
      });

      if (position === 'top') {
        fgStyle.bottom = -10; fgStyle.borderTop = fgColorBorder;
        bgStyle.bottom = -11; bgStyle.borderTop = bgColorBorder;
      } else {
        fgStyle.top = -10; fgStyle.borderBottom = fgColorBorder;
        bgStyle.top = -11; bgStyle.borderBottom = bgColorBorder;
      }

      if (arrow === 'right') {
        fgStyle.left = null; fgStyle.right = MARGIN + 1 - FG_SIZE;
        bgStyle.left = null; bgStyle.right = MARGIN - FG_SIZE;
      }
      if (arrow === 'left') {
        fgStyle.left = MARGIN + 1 - FG_SIZE;
        bgStyle.left = MARGIN - FG_SIZE;
      }
    }

    // Apply offscreen correction
    const offDiff = offscreenDifferenceRef.current;
    if (offDiff > 0) {
      for (const s of [fgStyle, bgStyle]) {
        if (typeof s.top === 'number') {
          s.top += offDiff;
        } else if (typeof s.top === 'string') {
          s.top = `calc(${s.top} + ${offDiff}px)`;
        }
      }
    }

    const { color: _c, borderColor: _bc, ...propsArrowStyle } = styleProp.arrowStyle || {};
    return {
      fgStyle: mergeStyle(fgStyle, propsArrowStyle as Record<string, unknown>),
      bgStyle: mergeStyle(bgStyle, propsArrowStyle as Record<string, unknown>),
    };
  };

  const checkWindowPosition = (
    cardStyle: Record<string, unknown>,
    arrowStyles: { fgStyle: Record<string, unknown>; bgStyle: Record<string, unknown> }
  ) => {
    if (position === 'top' || position === 'bottom') {
      const cardLeft = cardStyle.left as number;
      if (cardLeft < 0) {
        let bgStyleRight = arrowStyles.bgStyle.right as number;
        if (!bgStyleRight) {
          bgStyleRight = size.width / 2 - BG_SIZE;
        }
        const newBgRight = Math.round(bgStyleRight - cardLeft + MARGIN);
        arrowStyles = {
          ...arrowStyles,
          bgStyle: { ...arrowStyles.bgStyle, right: newBgRight, left: null },
          fgStyle: { ...arrowStyles.fgStyle, right: newBgRight + 1, left: null },
        };
        cardStyle.left = MARGIN;
      } else {
        const rightOffset = cardLeft + size.width - window.innerWidth;
        if (rightOffset > 0) {
          const originalLeft = cardLeft;
          cardStyle.left = window.innerWidth - size.width - MARGIN;
          (arrowStyles.fgStyle.marginLeft as number) += originalLeft - (cardStyle.left as number);
          (arrowStyles.bgStyle.marginLeft as number) += originalLeft - (cardStyle.left as number);
        }
      }
    }
    return { style: cardStyle, arrowStyle: arrowStyles };
  };

  const globalStyle: Record<string, unknown> = {
    position: 'absolute',
    borderRadius: '3px',
    visibility: hover || active ? 'visible' : 'hidden',
    zIndex: 50,
    ...getPositionStyle(),
  };

  const mergedGlobalStyle = mergeStyle(globalStyle, styleProp.style as Record<string, unknown>);
  const arrowStyles = getArrowStyles();
  const { style: finalStyle, arrowStyle: finalArrowStyle } = checkWindowPosition(mergedGlobalStyle, arrowStyles);

  return (
    <div
      style={finalStyle as React.CSSProperties}
      onMouseEnter={() => active && useHover && setHover(true)}
      onMouseLeave={() => setHover(false)}
      ref={rootRef}
    >
      {arrow ? (
        <div>
          <span style={finalArrowStyle.fgStyle as React.CSSProperties} />
          <span style={finalArrowStyle.bgStyle as React.CSSProperties} />
        </div>
      ) : null}
      {children}
    </div>
  );
}
