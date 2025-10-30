import type { SVGProps } from 'react'

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M2 22v-6.5l5-3.5l5 3.5V22" />
      <path d="M12 22v-6.5l5-3.5l5 3.5V22" />
      <path d="M6 15.5l6-4.5l6 4.5" />
      <path d="m2 12l5 3.5l5-3.5" />
      <path d="M12 12l5 3.5l5-3.5" />
      <path d="M2 8.5l5-3.5l5 3.5" />
      <path d="M12 8.5l5-3.5l5 3.5" />
      <path d="M6 5l6-4.5l6 4.5" />
    </svg>
  )
}
