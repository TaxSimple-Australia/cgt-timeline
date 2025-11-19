/**
 * Test utility for manually adding verification alerts
 * Usage: Call from browser console to test alert bars
 */

import { useTimelineStore } from '@/store/timeline';
import type { VerificationAlert } from '@/types/verification-alert';

/**
 * Add test verification alerts to the timeline
 * Call this from browser console: window.testVerificationAlerts()
 */
export function addTestVerificationAlerts() {
  const store = useTimelineStore.getState();
  const properties = store.properties;

  if (properties.length === 0) {
    console.warn('⚠️ No properties found. Load demo data first.');
    return;
  }

  // Create test alerts for the first two properties
  const testAlerts: VerificationAlert[] = [];

  // Alert 1: Critical alert for first property (Humpty Doo)
  if (properties[0]) {
    testAlerts.push({
      id: 'test-alert-1',
      propertyAddress: properties[0].address || properties[0].name,
      propertyId: properties[0].id,
      startDate: '2003-01-01',
      endDate: '2005-12-31',
      resolutionText: 'Missing purchase documentation. Please provide contract of sale and settlement statement.',
      severity: 'critical',
    });

    testAlerts.push({
      id: 'test-alert-2',
      propertyAddress: properties[0].address || properties[0].name,
      propertyId: properties[0].id,
      startDate: '2020-01-01',
      endDate: '2023-06-30',
      resolutionText: 'Unclear main residence status. Please clarify whether you lived in this property during this period.',
      severity: 'warning',
    });
  }

  // Alert 2: Warning alert for second property (Bellamack)
  if (properties[1]) {
    testAlerts.push({
      id: 'test-alert-3',
      propertyAddress: properties[1].address || properties[1].name,
      propertyId: properties[1].id,
      startDate: '2014-06-05',
      endDate: '2016-12-31',
      resolutionText: 'Rental income records incomplete. Please provide rental agreements and income statements.',
      severity: 'warning',
    });
  }

  // Alert 3: Info alert for third property (Boyne Island)
  if (properties[2]) {
    testAlerts.push({
      id: 'test-alert-4',
      propertyAddress: properties[2].address || properties[2].name,
      propertyId: properties[2].id,
      startDate: '2022-03-15',
      endDate: '2022-06-30',
      resolutionText: 'Renovation costs need supporting documentation. Please provide invoices and receipts.',
      severity: 'info',
    });
  }

  console.log('🚨 Adding test verification alerts:', testAlerts);
  store.setVerificationAlerts(testAlerts);
  console.log('✅ Test alerts added successfully!');
  console.log('💡 To clear alerts, call: window.clearVerificationAlerts()');
}

/**
 * Clear all verification alerts
 * Call this from browser console: window.clearVerificationAlerts()
 */
export function clearTestVerificationAlerts() {
  const store = useTimelineStore.getState();
  store.clearVerificationAlerts();
  console.log('✅ Verification alerts cleared!');
}

// Expose functions to window for browser console access
if (typeof window !== 'undefined') {
  (window as any).testVerificationAlerts = addTestVerificationAlerts;
  (window as any).clearVerificationAlerts = clearTestVerificationAlerts;
}
