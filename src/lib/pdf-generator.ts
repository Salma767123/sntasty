/**
 * PDF generation placeholder
 *
 * Previously used Puppeteer (headless Chrome) to generate PDFs, which
 * consumed 250MB+ RAM and 30-60s per invoice. Replaced with browser-side
 * printing via InvoiceClient.tsx (window.print()).
 *
 * This function now returns null so email is sent without a PDF attachment.
 * Users can still view/print invoices from the invoice web page.
 */
export const generatePDFFromHTML = async (_html: string, _options: any = {}): Promise<null> => {
  return null;
};
