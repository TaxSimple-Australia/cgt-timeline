import type { CGTModelResponse } from '@/types/model-response';

// Sample data for testing the ModelResponseDisplay component
export const sampleCGTResponse: CGTModelResponse = {
  properties: [
    {
      address: '123 Smith St, Sydney NSW',
      property_history: [
        {
          date: '2015-01-15',
          event: 'purchased',
          price: 300000,
          description: 'Initial purchase as investment property',
        },
        {
          date: '2015-02-01',
          event: 'rented',
          price_per_week: 400,
          description: 'First tenant moved in',
        },
        {
          date: '2018-06-10',
          event: 'improvement',
          price: 25000,
          description: 'Kitchen and bathroom renovation',
        },
        {
          date: '2024-03-15',
          event: 'sold',
          price: 650000,
          description: 'Sold at auction',
        },
      ],
      notes: 'Investment property held for over 12 months - eligible for 50% CGT discount',
    },
  ],
  user_query: 'What is my total CGT liability for selling my investment property?',
  additional_info: {
    australian_resident: true,
    other_property_owned: true,
    land_size_hectares: 0.05,
    marginal_tax_rate: 37,
  },
  use_claude: true,
  response: {
    summary:
      'Your estimated CGT liability is approximately AUD 87,000. This is based on a capital gain of AUD 325,000, with the 50% CGT discount applied.',
    recommendation:
      'Consider applying the 50% CGT discount since you held the property for more than 12 months. You may also be able to reduce your tax liability by claiming capital works deductions and depreciation.',
    issues: [
      {
        type: 'missing_data',
        field: '123 Smith St',
        message:
          'We couldn\'t locate purchase costs (stamp duty, legal fees) for this property. Add them to reduce your CGT liability.',
        severity: 'medium',
      },
      {
        type: 'warning',
        field: '123 Smith St',
        message:
          'Make sure you\'ve declared all rental income over the ownership period to avoid ATO penalties.',
        severity: 'high',
      },
      {
        type: 'info',
        message:
          'The 50% CGT discount is available because you held the property for more than 12 months.',
      },
    ],
    visual_metrics: {
      data_completeness: 85,
      confidence_score: 0.92,
    },
    detailed_breakdown: {
      capital_gain: 325000,
      cost_base: 325000,
      discount_applied: 162500,
      tax_payable: 87000,
    },
  },
};

// Another example with minimal data
export const minimalCGTResponse: CGTModelResponse = {
  properties: [
    {
      address: '45 Ocean Drive, Gold Coast QLD',
      property_history: [
        {
          date: '2020-05-20',
          event: 'purchased',
          price: 550000,
        },
      ],
      notes: 'Primary residence - main residence exemption may apply',
    },
  ],
  user_query: 'Do I need to pay CGT on my primary residence?',
  use_claude: true,
  response: {
    summary:
      'Good news! You likely won\'t need to pay CGT on your primary residence due to the main residence exemption.',
    recommendation:
      'Ensure you meet all the criteria for the main residence exemption: the property must be your primary place of residence, and you haven\'t used it to produce income.',
    issues: [
      {
        type: 'missing_data',
        field: '45 Ocean Drive',
        message:
          'We couldn\'t locate a sale date for this property. Add one to get an accurate CGT calculation.',
        severity: 'high',
      },
      {
        type: 'missing_data',
        field: '45 Ocean Drive',
        message:
          'Please provide details about how long you\'ve lived in this property to confirm eligibility for the main residence exemption.',
        severity: 'high',
      },
    ],
    visual_metrics: {
      data_completeness: 45,
      confidence_score: 0.68,
    },
  },
};

// Example with multiple properties
export const multiPropertyResponse: CGTModelResponse = {
  properties: [
    {
      address: '10 Park Avenue, Melbourne VIC',
      property_history: [
        {
          date: '2018-03-01',
          event: 'purchased',
          price: 720000,
        },
        {
          date: '2018-03-15',
          event: 'moved_in',
          description: 'Primary residence',
        },
        {
          date: '2023-11-30',
          event: 'sold',
          price: 950000,
        },
      ],
      notes: 'Primary residence for entire ownership period',
    },
    {
      address: '234 Beach Road, Byron Bay NSW',
      property_history: [
        {
          date: '2019-07-15',
          event: 'purchased',
          price: 480000,
        },
        {
          date: '2019-08-01',
          event: 'rented',
          price_per_week: 650,
        },
        {
          date: '2024-02-28',
          event: 'sold',
          price: 680000,
        },
      ],
      notes: 'Investment property - full CGT applies',
    },
  ],
  user_query: 'What is my CGT for selling both my primary residence and investment property?',
  additional_info: {
    australian_resident: true,
    other_property_owned: false,
    marginal_tax_rate: 45,
  },
  use_claude: true,
  response: {
    summary:
      'Your total CGT liability is approximately AUD 42,750. Your primary residence is exempt, but the investment property generated a capital gain of AUD 200,000.',
    recommendation:
      'The main residence exemption applies to your Melbourne property, eliminating CGT on that sale. For the Byron Bay property, the 50% CGT discount reduces your taxable gain to AUD 100,000.',
    visual_metrics: {
      data_completeness: 92,
      confidence_score: 0.95,
    },
    detailed_breakdown: {
      capital_gain: 200000,
      cost_base: 480000,
      discount_applied: 100000,
      tax_payable: 42750,
    },
  },
};
