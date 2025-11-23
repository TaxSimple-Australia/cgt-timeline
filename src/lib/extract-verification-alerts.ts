/**
 * Extract verification alerts from API response
 * Gracefully handles missing or incomplete data
 */

import type {
  VerificationAlert,
  VerificationResponse,
  VerificationProperty,
  VerificationIssue
} from '@/types/verification-alert';
import type { Property } from '@/store/timeline';

/**
 * Extract alerts from API response for failed property verifications
 * @param apiResponse - The API response object
 * @param timelineProperties - Current timeline properties for matching
 * @returns Array of normalized verification alerts
 */
export function extractVerificationAlerts(
  apiResponse: any,
  timelineProperties: Property[]
): VerificationAlert[] {
  const alerts: VerificationAlert[] = [];

  try {
    // Handle different API response structures
    const response = apiResponse as VerificationResponse;

    // Try to get properties from verification.properties or top-level properties
    const verificationProperties =
      response?.verification?.properties ||
      response?.properties ||
      [];

    // Try to get issues from verification.issues as fallback
    const globalIssues = response?.verification?.issues || [];

    // Extract clarification_questions to map possible answers
    const clarificationQuestions = response?.verification?.clarification_questions || [];

    console.log('📊 Extracting verification alerts:', {
      propertiesFound: verificationProperties.length,
      globalIssuesFound: globalIssues.length,
      clarificationQuestionsFound: clarificationQuestions.length,
      timelinePropertiesAvailable: timelineProperties.map(p => ({
        id: p.id,
        name: p.name,
        address: p.address,
        fullAddress: `${p.name}, ${p.address}`,
      })),
      clarificationQuestionsDetails: clarificationQuestions.map((cq: any) => ({
        question: cq.question,
        properties_involved: cq.properties_involved,
        period: cq.period,
      })),
    });

    // Helper function to find possible answers for a question
    const findPossibleAnswers = (propertyAddress: string, question: string): string[] | undefined => {
      const match = clarificationQuestions.find((cq: any) => {
        const matchesProperty = cq.properties_involved?.some((addr: string) =>
          addr.toLowerCase().includes(propertyAddress.toLowerCase()) ||
          propertyAddress.toLowerCase().includes(addr.toLowerCase())
        );
        const matchesQuestion = cq.question?.toLowerCase() === question?.toLowerCase();
        return matchesProperty && matchesQuestion;
      });
      return match?.possible_answers;
    };

    // Helper function to match property address to timeline property
    const matchPropertyByAddress = (propertyAddress: string): Property | undefined => {
      return timelineProperties.find(p => {
        const pFullAddress = `${p.name}, ${p.address}`.toLowerCase();
        const pAddress = p.address?.toLowerCase() || '';
        const pName = p.name?.toLowerCase() || '';
        const propAddr = propertyAddress.toLowerCase();

        return (
          pAddress.includes(propAddr) ||
          pName.includes(propAddr) ||
          pFullAddress.includes(propAddr) ||
          propAddr.includes(pAddress) ||
          propAddr.includes(pName) ||
          propAddr.includes(pFullAddress)
        );
      });
    };

    // Process clarification_questions directly (most accurate source)
    // This ensures each gap is only assigned to the properties listed in properties_involved
    clarificationQuestions.forEach((cq: any, index: number) => {
      const question = cq.question || '';
      const possibleAnswers = cq.possible_answers || [];
      const period = cq.period || {};
      const propertiesInvolved = cq.properties_involved || [];

      if (!question || propertiesInvolved.length === 0 || !period.start || !period.end) {
        return; // Skip incomplete questions
      }

      // Create an alert for EACH property involved in this gap
      propertiesInvolved.forEach((propertyAddress: string, propIndex: number) => {
        const matchedProperty = matchPropertyByAddress(propertyAddress);

        if (matchedProperty) {
          const alert: VerificationAlert = {
            id: `alert-cq-${Date.now()}-${index}-${propIndex}`,
            propertyAddress,
            propertyId: matchedProperty.id,
            startDate: period.start,
            endDate: period.end,
            resolutionText: question,
            clarificationQuestion: question,
            possibleAnswers,
            severity: 'warning',
          };

          console.log('✅ Created alert from clarification question:', {
            ...alert,
            matchedProperty: { id: matchedProperty.id, name: matchedProperty.name, address: matchedProperty.address },
          });
          alerts.push(alert);
        } else {
          console.warn('⚠️ Could not match property from clarification question:', propertyAddress);
        }
      });
    });

    // If we already have alerts from clarification_questions, we can skip processing properties and global issues
    // to avoid duplicates. Only process them if no alerts were created from clarification_questions.
    if (alerts.length > 0) {
      console.log(`✅ Created ${alerts.length} alerts from clarification_questions - skipping property/global issues processing to avoid duplicates`);
      return alerts;
    }

    // Process each property that has failed verification
    verificationProperties.forEach((prop: VerificationProperty) => {
      if (!prop || prop.verification_status !== 'failed') {
        return; // Skip properties that passed or have no status
      }

      const propertyAddress = prop.property_address || '';
      console.log(`⚠️ Found failed property: ${propertyAddress}`);

      // Get issues for this property
      const propertyIssues = prop.issues || [];

      // Process each issue for this property
      propertyIssues.forEach((issue: VerificationIssue, index: number) => {
        // Try to get resolution text from multiple possible fields
        const resolutionText =
          issue.suggested_resolution ||
          issue.clarification_question ||
          issue.question ||
          issue.message ||
          'Missing information - please review';

        // Try to get date range from affected_period (handle both start/end and start_date/end_date)
        const startDate = issue.affected_period?.start_date || issue.affected_period?.start || '';
        const endDate = issue.affected_period?.end_date || issue.affected_period?.end || '';

        // Only create alert if we have at least an address and some dates
        if (propertyAddress && (startDate || endDate)) {
          // Try to match with timeline property
          // Create combined address for better matching
          const matchedProperty = timelineProperties.find(p => {
            const pFullAddress = `${p.name}, ${p.address}`.toLowerCase();
            const pAddress = p.address?.toLowerCase() || '';
            const pName = p.name?.toLowerCase() || '';
            const propAddr = propertyAddress.toLowerCase();

            return (
              pAddress.includes(propAddr) ||
              pName.includes(propAddr) ||
              pFullAddress.includes(propAddr) ||
              propAddr.includes(pAddress) ||
              propAddr.includes(pName) ||
              propAddr.includes(pFullAddress)
            );
          });

          // Find possible answers from clarification_questions
          const clarificationQuestion = issue.clarification_question || resolutionText;
          const possibleAnswers = findPossibleAnswers(propertyAddress, clarificationQuestion);

          const alert: VerificationAlert = {
            id: `alert-${Date.now()}-${index}`,
            propertyAddress,
            propertyId: matchedProperty?.id,
            startDate: startDate || endDate, // Use endDate if startDate missing
            endDate: endDate || startDate,   // Use startDate if endDate missing
            resolutionText,
            clarificationQuestion,
            possibleAnswers,
            severity: issue.severity || 'warning',
          };

          console.log('✅ Created alert:', {
            ...alert,
            matchedProperty: matchedProperty ? { id: matchedProperty.id, name: matchedProperty.name, address: matchedProperty.address } : null,
          });
          alerts.push(alert);
        } else {
          console.warn('⚠️ Skipping issue with incomplete data:', {
            address: propertyAddress,
            startDate,
            endDate,
          });
        }
      });
    });

    // Process global issues that have property_address
    globalIssues.forEach((issue: VerificationIssue, index: number) => {
      const propertyAddress = issue.property_address || '';

      if (!propertyAddress) {
        return; // Skip issues without property address
      }

      const resolutionText =
        issue.suggested_resolution ||
        issue.clarification_question ||
        issue.question ||
        issue.message ||
        'Missing information - please review';

      const startDate = issue.affected_period?.start_date || issue.affected_period?.start || '';
      const endDate = issue.affected_period?.end_date || issue.affected_period?.end || '';

      if (startDate || endDate) {
        // Try to match specific property - use strict matching to avoid assigning same gap to multiple properties
        const matchedProperty = timelineProperties.find(p => {
          const pFullAddress = `${p.name}, ${p.address}`.toLowerCase();
          const pAddress = p.address?.toLowerCase() || '';
          const pName = p.name?.toLowerCase() || '';
          const propAddr = propertyAddress.toLowerCase();

          // Use strict matching - property address must be contained in or contain the property info
          return (
            pAddress.includes(propAddr) ||
            pName.includes(propAddr) ||
            pFullAddress.includes(propAddr) ||
            propAddr.includes(pAddress) ||
            propAddr.includes(pName) ||
            propAddr.includes(pFullAddress)
          );
        });

        if (matchedProperty) {
          // Find possible answers from clarification_questions
          const clarificationQuestion = issue.clarification_question || resolutionText;
          const possibleAnswers = findPossibleAnswers(propertyAddress, clarificationQuestion);

          const alert: VerificationAlert = {
            id: `alert-global-${Date.now()}-${index}`,
            propertyAddress,
            propertyId: matchedProperty.id,
            startDate: startDate || endDate,
            endDate: endDate || startDate,
            resolutionText,
            clarificationQuestion,
            possibleAnswers,
            severity: issue.severity || 'warning',
          };

          console.log('✅ Created alert from global issue:', {
            ...alert,
            matchedProperty: { id: matchedProperty.id, name: matchedProperty.name, address: matchedProperty.address },
          });
          alerts.push(alert);
        } else {
          console.warn('⚠️ Could not match property address:', propertyAddress, 'to any timeline property');
        }
      }
    });

    console.log(`📋 Total alerts created: ${alerts.length}`);
  } catch (error) {
    console.error('❌ Error extracting verification alerts:', error);
    // Return whatever alerts we managed to extract
  }

  return alerts;
}

/**
 * Check if API response has verification failures
 */
export function hasVerificationFailures(apiResponse: any): boolean {
  try {
    const response = apiResponse as VerificationResponse;

    const properties =
      response?.verification?.properties ||
      response?.properties ||
      [];

    return properties.some((prop: VerificationProperty) =>
      prop?.verification_status === 'failed'
    );
  } catch {
    return false;
  }
}
