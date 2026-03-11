/**
 * Module-level singleton to hold the standby PDF blob.
 * Generated in the background after CGT analysis, available for
 * instant attachment when sharing via email.
 */

let standbyBlob: Blob | null = null;
let standbyFilename: string = 'CGT-Analysis-Report.pdf';

export function setStandbyPdf(blob: Blob | null, filename?: string) {
  standbyBlob = blob;
  if (filename) standbyFilename = filename;
}

export function getStandbyPdf(): { blob: Blob | null; filename: string } {
  return { blob: standbyBlob, filename: standbyFilename };
}

export function clearStandbyPdf() {
  standbyBlob = null;
}
