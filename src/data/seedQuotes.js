export const defaultSettings = {
  businessName: 'Quotely Studio',
  businessEmail: 'hello@quotely.ph',
  businessPhone: '+63 917 555 0148',
  businessAddress: 'Makati City, Philippines',
  accentColor: '#2927e8',
}

export const initialQuotes = [
  {
    id: 'seed-qly-003',
    quotationNumber: 'QLY-003',
    clientName: 'Nina Cabrera',
    clientEmail: 'nina@atelier-cabrera.ph',
    projectName: 'Boutique Launch Reception',
    eventDate: '2026-08-12',
    location: 'BGC, Taguig',
    packageType: 'Premium',
    basePrice: 42000,
    servicesIncluded:
      'Event styling direction\nOn-site coordination\nPremium floral installation\nSupplier timeline briefing',
    addOns: [
      { name: 'Welcome signage and print set', price: 6500 },
      { name: 'Extended styling team hours', price: 4500 },
    ],
    discount: 3000,
    notes:
      'Final floor plan and supplier ingress details to be confirmed one week before the event.',
    paymentTerms:
      '50% down payment to secure the date, balance due three days before the event.',
    validityDate: '2026-07-15',
    status: 'Pending',
    createdAt: '2026-06-21T09:30:00.000Z',
    updatedAt: '2026-06-21T09:30:00.000Z',
  },
  {
    id: 'seed-qly-002',
    quotationNumber: 'QLY-002',
    clientName: 'Marco Reyes',
    clientEmail: 'marco@northline.dev',
    projectName: 'Product Photography Sprint',
    eventDate: '2026-07-18',
    location: 'Quezon City',
    packageType: 'Standard',
    basePrice: 28000,
    servicesIncluded:
      'Creative direction\nHalf-day studio shoot\nColor grading\nTwenty edited image exports',
    addOns: [{ name: 'Rush editing turnaround', price: 5000 }],
    discount: 0,
    notes:
      'Client will provide the final product list and sample references before the shoot.',
    paymentTerms: '40% booking fee, 60% upon delivery of final edited files.',
    validityDate: '2026-07-01',
    status: 'Approved',
    createdAt: '2026-06-18T05:45:00.000Z',
    updatedAt: '2026-06-19T03:18:00.000Z',
  },
  {
    id: 'seed-qly-001',
    quotationNumber: 'QLY-001',
    clientName: 'Mika Santos',
    clientEmail: 'mika@santosfamily.ph',
    projectName: 'Garden Ceremony Styling',
    eventDate: '2026-09-05',
    location: 'Tagaytay',
    packageType: 'Basic',
    basePrice: 18000,
    servicesIncluded:
      'Moodboard and styling plan\nCeremony table setup\nBasic floral accents\nDay-of styling lead',
    addOns: [{ name: 'Additional aisle markers', price: 3500 }],
    discount: 1500,
    notes: 'Outdoor setup is subject to final weather plan approval.',
    paymentTerms:
      '50% reservation fee, remaining balance due five days before the event.',
    validityDate: '2026-07-10',
    status: 'Sent',
    createdAt: '2026-06-12T10:15:00.000Z',
    updatedAt: '2026-06-12T10:15:00.000Z',
  },
]
