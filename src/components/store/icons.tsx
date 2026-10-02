export const PinIcon = () => (
  <svg width="11" height="13" viewBox="0 0 11 14" fill="#fff" aria-hidden><path d="M5.5 0C2.7 0 .5 2.2.5 5c0 3.6 5 9 5 9s5-5.4 5-9c0-2.8-2.2-5-5-5zm0 7a2 2 0 110-4 2 2 0 010 4z" /></svg>
);
export const SearchIcon = () => (
  <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="#111" strokeWidth="1.5" aria-hidden><circle cx="5" cy="5" r="3.6" /><path d="M8 8l3.2 3.2" strokeLinecap="round" /></svg>
);
export const UserIcon = () => (
  <svg width="17" height="17" viewBox="0 0 18 18" fill="none" stroke="#231f20" strokeWidth="1.3" aria-hidden><circle cx="9" cy="5.5" r="3.6" /><path d="M2 17c.4-3.6 3.2-5.6 7-5.6s6.6 2 7 5.6" strokeLinecap="round" /></svg>
);
export const HeartIcon = ({ fill = "#111", stroke = "none", size = 17 }: { fill?: string; stroke?: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 20 18" fill={fill} stroke={stroke} strokeWidth="1.6" aria-hidden><path d="M10 17.3l-1.4-1.3C3.6 11.5.5 8.7.5 5.3.5 2.6 2.6.6 5.2.6c1.7 0 3.3.8 4.8 2.4C11.5 1.4 13.1.6 14.8.6c2.6 0 4.7 2 4.7 4.7 0 3.4-3.1 6.2-8.1 10.7L10 17.3z" /></svg>
);
export const BagIcon = () => (
  <svg width="15" height="17" viewBox="0 0 16 18" fill="none" stroke="#231f20" strokeWidth="1.3" aria-hidden><path d="M2.4 5.4h11.2l.9 11.1H1.5L2.4 5.4z" strokeLinejoin="round" /><path d="M5.3 7.5V4.2a2.7 2.7 0 015.4 0v3.3" strokeLinecap="round" /></svg>
);
export const HomeIcon = () => (
  <svg width="15" height="14" viewBox="0 0 16 15" fill="#4b4234" aria-hidden><path d="M8 .5L.3 7.2l1 1.1L2.5 7.3V14h4v-4h3v4h4V7.3l1.2 1 1-1.1L8 .5z" /></svg>
);
export const DiamondStar = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.3" aria-hidden><path d="M12 1.5c.6 5.6 4.9 9.9 10.5 10.5C16.9 12.6 12.6 16.9 12 22.5 11.4 16.9 7.1 12.6 1.5 12 7.1 11.4 11.4 7.1 12 1.5z" strokeLinejoin="round" /><circle cx="12" cy="12" r="1.2" fill="#fff" /></svg>
);
export const ArrowUpRight = () => (
  <svg width="26" height="26" viewBox="0 0 26 26" fill="none" stroke="#c9ab74" strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M6 20L19 8M9 7h11v11" /></svg>
);
export const Chevron = ({ dir }: { dir: "l" | "r" }) => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    {dir === "l" ? <path d="M9 2L4 7l5 5" /> : <path d="M5 2l5 5-5 5" />}
  </svg>
);
export const FacebookIcon = () => (<svg width="9" height="16" viewBox="0 0 9 16" fill="#111" aria-hidden><path d="M5.8 16V9H8.2l.4-2.8H5.800V4.600c0-.8.300-1.300 1.400-1.300H8.700V.9C8.400.8 7.600.7 6.700.7 4.600.7 3.200 2 3.200 4.300v1.900H.8V9h2.400v7h2.600z" /></svg>);
export const XIcon = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="#111" aria-hidden><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>);
export const TikTokIcon = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="#111" aria-hidden><path d="M19.6 6.2a5.5 5.5 0 01-3.7-1.4v9.1a6.1 6.1 0 11-6.1-6.1c.4 0 .8 0 1.2.1v3.4a2.8 2.8 0 10-1.2 5.2 2.8 2.8 0 002.8-2.8V1.5h3.4a5.5 5.5 0 005.1 5.1v3.4a8.8 8.8 0 01-1.5-.1V6.2z" /></svg>);
export const InstagramIcon = () => (<svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="#111" strokeWidth="1.5" aria-hidden><rect x="1" y="1" width="14" height="14" rx="4" /><circle cx="8" cy="8" r="3.2" /><circle cx="12" cy="4" r=".6" fill="#111" /></svg>);
export const MailIcon = () => (<svg width="11" height="9" viewBox="0 0 12 9" aria-hidden><rect x="0" y="0" width="12" height="9" fill="#222" /><path d="M0.5 1L6 5.200 11.500 1" stroke="#f4f4f4" strokeWidth="1" fill="none" /></svg>);
export const ShareIcon = () => (<svg width="15" height="15" viewBox="0 0 16 16" fill="#8d8d8d" aria-hidden><circle cx="12.500" cy="3" r="2.200" /><circle cx="3.500" cy="8" r="2.200" /><circle cx="12.500" cy="13" r="2.200" /><path d="M3.500 8l9-5M3.500 8l9 5" stroke="#8d8d8d" strokeWidth="1.300" /></svg>);
