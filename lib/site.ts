/**
 * Single place to update contact details, links and copy.
 * Replace the PLACEHOLDER values before launch.
 */
export const site = {
  name: 'Quanttoria',
  tagline: 'Unlock the World of Math Excellence',
  owner: {
    name: 'Princy Sugandh',
    role: 'Founder & Lead Math Educator',
    hours: '9000+',
  },
  // PLACEHOLDER: international format, digits only (e.g. 919876543210)
  whatsappNumber: '000000000000',
  // PLACEHOLDER
  email: 'hello@quanttoria.com',
  // PLACEHOLDER: replace with the live Trustpilot profile URL
  trustpilotUrl: 'https://www.trustpilot.com/',
  whatsappMessage:
    "Hi Princy! I'd like to book a free trial math class for my child. My child is in grade ___.",
}

export function whatsappLink(message: string = site.whatsappMessage) {
  return `https://wa.me/${site.whatsappNumber}?text=${encodeURIComponent(message)}`
}

export const navLinks = [
  { href: '#why', label: 'Why Quanttoria' },
  { href: '#approach', label: 'Our Approach' },
  { href: '#tutor', label: 'Meet Princy' },
  { href: '#reviews', label: 'Reviews' },
  { href: '#contact', label: 'Contact' },
]
