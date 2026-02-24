/**
 * Brand — Wrapper to prevent browser translation of brand names.
 * Usage: <Brand>Armstrong</Brand> or <Brand as="h3">KAUFY</Brand>
 */
import * as React from 'react';

interface BrandProps extends React.HTMLAttributes<HTMLElement> {
  /** HTML element to render, defaults to "span" */
  as?: React.ElementType;
  children: React.ReactNode;
}

export function Brand({ as: Tag = 'span', children, ...props }: BrandProps) {
  return (
    <Tag translate="no" {...props}>
      {children}
    </Tag>
  );
}
