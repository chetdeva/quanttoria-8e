/**
 * Single place to update contact details, links and copy.
 * Replace the PLACEHOLDER values before launch.
 */
export const site = {
  name: 'Quanttoria',
  tagline: 'Personalized learning that makes maths click',
  owner: {
    name: 'Pprincy Sugandhh',
    role: 'Founder & Lead Math Educator',
    hours: '20000+',
    linkedinUrl: 'https://www.linkedin.com/in/princysugandh/',
  },
  whatsappNumber: '919119571369',
  whatsappDisplay: '+91 91195 71369',
  email: 'pprincyaaghaww@gmail.com',
  trustpilotUrl:
    'https://www.trustpilot.com/review/byjusfutureschool.com?search=princy&stars=5#search-reviews',
  whatsappMessage:
    "Hi Princy! I'd like to customize a personalized learning plan for my child. My child is in Grade ___.",
}

export function whatsappLink(message: string = site.whatsappMessage) {
  return `https://wa.me/${site.whatsappNumber}?text=${encodeURIComponent(message)}`
}

export const navLinks = [
  { href: '#why', label: 'Why Quanttoria' },
  { href: '#approach', label: 'How it works' },
  { href: '#tutor', label: 'Meet our founder' },
  { href: '#reviews', label: 'Why parents trust us' },
  { href: '#contact', label: 'Contact' },
]
