import type { SVGProps } from "react";

type BrandIconProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

export function TikTokIcon({
  size = 20,
  className,
  ...props
}: BrandIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="currentColor"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      {...props}
    >
      <path d="M14.5 3v10.25a4.75 4.75 0 1 1-4.75-4.75c.25 0 .5.02.75.06v2.72a2 2 0 1 0 1.25 1.86V3h2.75Zm0 0c.37 2.12 1.62 3.65 3.75 4.25V10a8.2 8.2 0 0 1-3.75-1.45V3Z" />
    </svg>
  );
}

export function ZaloIcon({
  size = 20,
  className,
  ...props
}: BrandIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      height={size}
      viewBox="0 0 24 24"
      width={size}
      {...props}
    >
      <rect
        fill="none"
        height="18"
        rx="5"
        stroke="currentColor"
        strokeWidth="1.8"
        width="18"
        x="3"
        y="3"
      />
      <path
        d="M7.3 8.2h5.1L7.4 15.8h5.3M14.2 10.1v5.7m0-2.85c0-1.58.82-2.85 1.85-2.85s1.85 1.27 1.85 2.85-.82 2.85-1.85 2.85-1.85-1.27-1.85-2.85Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.45"
      />
    </svg>
  );
}
