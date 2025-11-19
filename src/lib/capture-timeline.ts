import html2canvas from 'html2canvas';

/**
 * Captures the timeline container as an image
 * @returns Base64 data URL of the timeline image, or null if capture fails
 */
export async function captureTimelineSnapshot(): Promise<string | null> {
  try {
    // Find the timeline container element
    const timelineElement = document.querySelector('[data-timeline-container]') as HTMLElement;

    if (!timelineElement) {
      console.warn('⚠️ Timeline container not found for snapshot');
      return null;
    }

    console.log('📸 Capturing timeline...');

    // Capture the timeline using html2canvas
    const canvas = await html2canvas(timelineElement, {
      backgroundColor: '#ffffff',
      scale: 2, // Good quality without being too large
      logging: false,
      useCORS: true,
      allowTaint: true,
      windowWidth: timelineElement.scrollWidth,
      windowHeight: timelineElement.scrollHeight,
    });

    // Convert canvas to base64 data URL
    const dataUrl = canvas.toDataURL('image/png');
    console.log('✅ Timeline captured successfully');
    return dataUrl;
  } catch (error) {
    console.error('❌ Failed to capture timeline:', error);
    return null;
  }
}
