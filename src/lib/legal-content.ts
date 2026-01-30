/**
 * Legal Content for CGT BRAIN AI Platform
 * Terms & Conditions, Privacy Policy, and Legal Disclaimers
 */

export const TERMS_AND_CONDITIONS = {
  title: 'Terms & Conditions',
  lastUpdated: 'January 2026',

  sections: [
    {
      title: 'Cookies and Preferences: Data Collection & Preference Governance',
      content: [
        {
          subtitle: '1. Statutory Notice and Consent',
          text: 'By accessing the CGT BRAIN AI platform, users acknowledge that our digital environment utilizes cookies and telemetry to facilitate the complex algorithmic processing required for Australian taxation research. These technologies are deployed in strict accordance with the Australian Privacy Principles (APPs) and the Privacy Act 1988 (Cth) to ensure the integrity, security, and performance of our proprietary AI-driven advisory tools.',
        },
        {
          subtitle: '2. Functional Classification of Data Technologies',
          text: 'We categorize our data collection into the following legal and functional tiers:',
          list: [
            'Strictly Necessary & Security Protocols: Mandatory cookies required for encrypted session management and the prevention of unauthorized access to sensitive tax data. These are exempt from deactivation as they maintain the legal security posture of the platform.',
            'AI Optimization & Contextual Caching: These technologies allow the CGT BRAIN AI to retain jurisdictional parameters (such as State-specific land tax or stamp duty variables) to ensure that the generated outputs are relevant to the Australian regulatory landscape.',
            'Performance Analytics & Algorithmic Audit: De-identified data used to monitor the accuracy and efficiency of the AI. This data assists our Specialist Tax Experts in the ongoing audit and refinement of the system\'s logic.',
          ],
        },
        {
          subtitle: '3. User Affirmation & Preferences',
          text: 'Users may exercise their right to limit non-essential data collection. However, please be advised that restricting functional cookies may impact the AI\'s ability to provide a comprehensive and localized research experience.',
        },
        {
          subtitle: '4. Legal Disclaimer: Non-Reliance on Automated Outputs',
          text: 'The use of cookies to enhance user experience in no way modifies the professional relationship or the liability framework of the advice provided. CGT BRAIN AI is a decision-support tool; all automated outputs are considered "preliminary" until formally reviewed, verified, and validated by a specialist tax expert. The specialist retains all professional indemnities and carries the ultimate legal liability for client advice, as mandated by Australian professional standards.',
        },
      ],
    },
    {
      title: 'Copyright & Intellectual Property Disclaimer',
      content: [
        {
          subtitle: '1. Ownership of Proprietary Assets',
          text: 'All content, logic, and architecture associated with CGT BRAIN AI including but not limited to text, software code, proprietary algorithms, database structures, user interface design, graphics, and the "CGT BRAIN" brand identity are the exclusive intellectual property of CGT BRAIN AI (the "Company") and are protected under the Copyright Act 1968 (Cth) and international intellectual property treaties.',
        },
        {
          subtitle: '2. AI-Generated Outputs & Derived Work',
          text: 'The proprietary processes utilized by CGT BRAIN AI to synthesize Australian taxation data, property research, and advisory frameworks remain the sole property of the Company. While users are granted a limited license to utilize generated outputs for professional advisory purposes, the underlying methodology, logic-chains, and structured data produced by the AI remain protected intellectual property. Unauthorized scraping, reverse-engineering, or reproduction of the AI\'s logic for the purpose of training competing models is strictly prohibited.',
        },
        {
          subtitle: '3. Limited License & Usage',
          text: 'Subject to compliance with our Terms of Service, users are granted a non-exclusive, non-transferable license to use the outputs of CGT BRAIN AI. This license is provided on the condition that:',
          list: [
            'The outputs are used as a supplementary tool to professional human judgment.',
            'No part of the system is reproduced or redistributed in a way that implies it is an independent, legally-binding tax authority.',
            'Any redistribution of findings includes a clear attribution to the CGT BRAIN platform.',
          ],
        },
        {
          subtitle: '4. Infringement & Enforcement',
          text: 'The Company reserves the right to take legal action against any person or entity found to be in breach of these protections. This includes, but is not limited to, the unauthorized use of the "CGT BRAIN AI" trademark or the misappropriation of our proprietary taxation datasets.',
        },
      ],
    },
  ],
};

export const PREFERENCE_CHECKBOXES = [
  {
    id: 'ai_enhancement',
    label: 'Affirm AI Enhancement (Standard)',
    description: 'I consent to the use of cookies to optimize AI research performance and retain jurisdictional context for taxation advice.',
    required: false,
  },
  {
    id: 'analytical_auditing',
    label: 'Affirm Analytical Auditing',
    description: 'I consent to the collection of de-identified usage data to support the continuous improvement of the CGT BRAIN validation framework.',
    required: false,
  },
];
