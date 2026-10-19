/* DEMO DATA ONLY. Every record is fictional and flagged demo:true. No real people, phone numbers, or IDs. */
const DEMO = (() => {
  const P = [
    ['Demo Provider A', 'Plumber', 'Belagavi', '5 years', '₹300–800', 'verified'],
    ['Demo Provider B', 'Electrician', 'Hubballi', '8 years', '₹350–900', 'verified'],
    ['Demo Provider C', 'Carpenter', 'Dharwad', '12 years', '₹600–1500', 'verified'],
    ['Demo Provider D', 'Painter', 'Bagalkot', '6 years', '₹12–18 per sq ft', 'verified'],
    ['Demo Provider E', 'Cleaner', 'Vijayapura', '3 years', '₹500–1200', 'verified'],
    ['Demo Provider F', 'Mechanic', 'Gadag', '10 years', '₹400–1000', 'verified'],
    ['Demo Provider G', 'Gardener', 'Koppal', '4 years', '₹300–700', 'verified'],
    ['Demo Provider H', 'Electrician', 'Belagavi', '7 years', '₹300–850', 'verified'],
    ['Demo Provider I', 'Plumber', 'Hubballi', '2 years', '₹250–600', 'pending']
  ];
  const providers = P.map((p, i) => ({
    id: 'demo-p' + (i + 1), demo: true, name: p[0], category: p[1], city: p[2], experience: p[3], priceRange: p[4],
    verificationStatus: p[5], title: p[1] + ' services in ' + p[2], area: p[2] + ' and nearby',
    description: 'Sample description for a demo ' + p[1].toLowerCase() + '. This is not a real provider.',
    available: true, image: null, phone: '', ownerId: i === 1 ? 'u-provider' : 'demo-owner-' + i
  }));
  const R = [
    ['2 BHK house near market', 'house', 'Belagavi', 'Tilakwadi', 14000, 40000],
    ['Ground floor shop', 'shop', 'Hubballi', 'Station Road', 22000, 100000],
    ['Furnished single room', 'room', 'Dharwad', 'Saptapur', 5500, 10000],
    ['PG for students, meals included', 'pg', 'Dharwad', 'Vidyagiri', 6500, 6500],
    ['3 BHK independent house', 'house', 'Vijayapura', 'Gandhi Chowk', 18000, 60000],
    ['Corner shop with storage', 'shop', 'Bagalkot', 'Navanagar', 16000, 70000],
    ['Room with attached bath', 'room', 'Gadag', 'Betageri', 4500, 9000],
    ['PG for working men', 'pg', 'Koppal', 'Gavimath Road', 5500, 5500],
    ['1 BHK apartment', 'house', 'Hubballi', 'Vidyanagar', 9000, 25000],
    ['Office-ready shop', 'shop', 'Belagavi', 'College Road', 25000, 120000]
  ];
  const properties = R.map((r, i) => ({
    id: 'demo-r' + (i + 1), demo: true, title: r[0], type: r[1], city: r[2], locality: r[3], rent: r[4], deposit: r[5],
    description: 'Sample demo listing. This is not a real property.', facilities: 'Water, parking, power backup',
    available: i !== 5, image: null, phone: '', ownerId: i < 2 ? 'u-owner' : 'demo-owner-x'
  }));
  return {
    customers: [
      { id: 'demo-c1', name: 'Demo Customer One', city: 'Belagavi', preferredCategory: 'Plumber' },
      { id: 'demo-c2', name: 'Demo Customer Two', city: 'Hubballi', preferredCategory: 'Electrician' },
      { id: 'demo-c3', name: 'Demo Customer Three', city: 'Koppal', preferredCategory: 'Cleaner' }
    ],
    users: {
      customer: { id: 'u-customer', name: 'Demo Customer', role: 'customer', city: 'Belagavi' },
      provider: { id: 'u-provider', name: 'Demo Provider B', role: 'provider', city: 'Hubballi' },
      owner: { id: 'u-owner', name: 'Demo Owner', role: 'owner', city: 'Belagavi' },
      admin: { id: 'u-admin', name: 'Demo Admin', role: 'admin' }
    },
    profiles: { 'u-provider': { name: 'Demo Provider B', city: 'Hubballi', category: 'Electrician', verificationStatus: 'pending', note: '' } },
    enquiries: [{ id: 'demo-e1', from: 'Demo Customer', message: 'Sample enquiry: are you available this week?', when: 'Sample' }],
    pendingProviders: [
      { id: 'demo-pp1', name: 'Demo Applicant One', category: 'Painter', city: 'Gadag', submitted: 'Sample date' },
      { id: 'demo-pp2', name: 'Demo Applicant Two', category: 'Cleaner', city: 'Koppal', submitted: 'Sample date' }
    ],
    providers, properties
  };
})();
