export const FAQ_ITEMS = [
  {
    question: 'Can I trust AI with my taxes?',
    answer: 'Absolutely. Our AI is trained on thousands of ATO guidelines and CGT scenarios. Every calculation is transparent and verifiable—you can see exactly how we arrived at each number. Plus, you can export everything for your accountant to review. Think of CGT Brain as your first draft that professionals can validate.',
    category: 'trust',
  },
  {
    question: 'What if I have complex property history?',
    answer: 'Perfect! CGT Brain excels at complex scenarios. We handle subdivisions, renovations, mixed-use properties (living + renting), multiple ownership periods, and even partial main residence exemptions. The more complex your situation, the more value you get from our automated tracking.',
    category: 'features',
  },
  {
    question: 'Is my data secure and private?',
    answer: 'Yes. Your data is encrypted both in transit (SSL/TLS) and at rest. We host on Australian servers to ensure compliance with the Privacy Act 1988. We never sell your data, and you can delete your account anytime. You own your data—export it, share it with your accountant, or delete it whenever you want.',
    category: 'trust',
  },
  {
    question: 'How accurate are the calculations?',
    answer: "Our AI is trained on ATO tax rulings and verified against thousands of real property scenarios. While we can't provide tax advice (we're not registered tax agents), our calculations follow ATO guidelines precisely. That's why accountants use CGT Brain to reduce their billable hours—it does the heavy lifting accurately.",
    category: 'features',
  },
  {
    question: 'Can my accountant use this?',
    answer: 'Yes! Many tax professionals use CGT Brain to streamline client work. You can export detailed PDF reports with complete audit trails, calculation breakdowns, and cost base summaries. Your accountant gets a professional report instead of messy spreadsheets, saving them (and you) time.',
    category: 'getting-started',
  },
  {
    question: 'What does it cost?',
    answer: "CGT Brain is free to start. You can build your timeline, get AI analysis, and explore all features at no cost. We're building paid premium features for power users (bulk exports, advanced integrations), but the core CGT calculator will always remain free. No credit card required to start.",
    category: 'pricing',
  },
  {
    question: 'What if I made a mistake years ago?',
    answer: "That's the beauty of a visual timeline. CGT Brain helps you identify gaps, overlaps, and inconsistencies. If you realize you missed a renovation or forgot to log a period of vacancy, you can add it retroactively. The AI recalculates everything instantly.",
    category: 'features',
  },
  {
    question: 'Do I need to be a tax expert to use this?',
    answer: 'Not at all. CGT Brain is designed for everyday property owners. We use plain English, not tax jargon. Our verification system alerts you to potential issues before they become problems. That said, we always recommend getting professional advice for final lodgement—CGT Brain makes that conversation much more productive.',
    category: 'getting-started',
  },
];

export const FAQ_CATEGORIES = [
  { key: 'all', label: 'All Questions' },
  { key: 'trust', label: 'Trust & Security' },
  { key: 'features', label: 'Features' },
  { key: 'pricing', label: 'Pricing' },
  { key: 'getting-started', label: 'Getting Started' },
] as const;
