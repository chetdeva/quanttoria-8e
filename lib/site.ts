/**
 * Single place to update contact details, links and copy.
 * Replace the PLACEHOLDER values before launch.
 */
export const site = {
  name: 'Quanttoria',
  tagline: 'Empowering Global Minds with Mathematics',
  owner: {
    name: 'Princy Sugandh',
    role: 'Founder & Lead Math Educator',
    hours: '9000+',
    linkedinUrl: 'https://www.linkedin.com/in/princysugandh/',
  },
  whatsappNumber: '919119571369',
  whatsappDisplay: '+91 91195 71369',
  email: 'princyaghaw@gmail.com',
  trustpilotUrl:
    'https://www.trustpilot.com/review/byjusfutureschool.com?search=princy&stars=5',
  whatsappMessage:
    "Hi Princy! I'd like to book a personalised maths consultation for my child. My child is in Grade ___.",
}

export function whatsappLink(message: string = site.whatsappMessage) {
  return `https://wa.me/${site.whatsappNumber}?text=${encodeURIComponent(message)}`
}

export const navLinks = [
  { href: '#why', label: 'Why Quanttoria' },
  { href: '#approach', label: 'Our Approach' },
  { href: '#tutor', label: 'Meet our Teacher' },
  { href: '#reviews', label: 'Reviews' },
  { href: '#contact', label: 'Contact' },
]
