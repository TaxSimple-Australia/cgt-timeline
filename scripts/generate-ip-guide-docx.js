const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  ExternalHyperlink,
  Footer,
  Header,
  PageNumber,
  NumberFormat,
  TableOfContents,
  StyleLevel,
  ShadingType,
  convertInchesToTwip,
} = require("docx");
const fs = require("fs");
const path = require("path");

// Helper function to create hyperlink
function createHyperlink(text, url) {
  return new ExternalHyperlink({
    children: [
      new TextRun({
        text: text,
        style: "Hyperlink",
        color: "0563C1",
        underline: { type: "single" },
      }),
    ],
    link: url,
  });
}

// Helper function to create a paragraph with mixed content (text and links)
function createParagraphWithLinks(contents, options = {}) {
  const children = contents.map((item) => {
    if (item.link) {
      return createHyperlink(item.text, item.link);
    }
    return new TextRun({
      text: item.text,
      bold: item.bold || false,
      italics: item.italics || false,
      size: item.size || 24,
    });
  });

  return new Paragraph({
    children,
    spacing: { after: 200 },
    ...options,
  });
}

// Helper to create styled table
function createTable(headers, rows, options = {}) {
  const headerCells = headers.map(
    (header) =>
      new TableCell({
        children: [
          new Paragraph({
            children: [new TextRun({ text: header, bold: true, size: 22 })],
            alignment: AlignmentType.CENTER,
          }),
        ],
        shading: { fill: "1F4E79", color: "FFFFFF" },
        width: { size: 100 / headers.length, type: WidthType.PERCENTAGE },
      })
  );

  const dataRows = rows.map(
    (row) =>
      new TableRow({
        children: row.map(
          (cell, index) =>
            new TableCell({
              children: [
                new Paragraph({
                  children:
                    typeof cell === "object" && cell.link
                      ? [createHyperlink(cell.text, cell.link)]
                      : [new TextRun({ text: String(cell), size: 22 })],
                  alignment:
                    index === 0 ? AlignmentType.LEFT : AlignmentType.CENTER,
                }),
              ],
              width: { size: 100 / headers.length, type: WidthType.PERCENTAGE },
            })
        ),
      })
  );

  return new Table({
    rows: [
      new TableRow({
        children: headerCells,
        tableHeader: true,
      }),
      ...dataRows,
    ],
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
}

// Create the document
async function generateDocument() {
  const doc = new Document({
    creator: "Tax Simple Australia",
    title: "CGT Brain AI - IP Registration Guide Australia",
    description:
      "Comprehensive guide to intellectual property registration in Australia",
    styles: {
      paragraphStyles: [
        {
          id: "Normal",
          name: "Normal",
          run: { size: 24, font: "Calibri" },
          paragraph: { spacing: { after: 200 } },
        },
        {
          id: "Title",
          name: "Title",
          basedOn: "Normal",
          next: "Normal",
          run: { size: 56, bold: true, color: "1F4E79", font: "Calibri Light" },
          paragraph: { spacing: { after: 400 } },
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1),
              right: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1),
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "CGT Brain AI - IP Registration Guide",
                    italics: true,
                    size: 20,
                    color: "666666",
                  }),
                ],
                alignment: AlignmentType.RIGHT,
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Page ",
                    size: 20,
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 20,
                  }),
                  new TextRun({
                    text: " of ",
                    size: 20,
                  }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    size: 20,
                  }),
                  new TextRun({
                    text: "  |  Tax Simple Australia  |  January 2026",
                    size: 20,
                    color: "666666",
                  }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
          }),
        },
        children: [
          // TITLE PAGE
          new Paragraph({
            children: [
              new TextRun({
                text: "CGT Brain AI",
                size: 72,
                bold: true,
                color: "1F4E79",
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 2000, after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "Intellectual Property Registration Guide",
                size: 48,
                color: "2E75B6",
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "for Australia",
                size: 40,
                color: "5B9BD5",
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 800 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "Comprehensive Guide to Copyright, Patents, Trademarks, and Trade Names",
                size: 28,
                italics: true,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 1500 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Prepared for: ", size: 24 }),
              new TextRun({
                text: "Tax Simple Australia / CGT Brain AI",
                size: 24,
                bold: true,
              }),
            ],
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Date: ", size: 24 }),
              new TextRun({ text: "January 2026", size: 24, bold: true }),
            ],
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Document Version: ", size: 24 }),
              new TextRun({ text: "1.0", size: 24, bold: true }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 1500 },
          }),

          // TABLE OF CONTENTS SECTION
          new Paragraph({
            text: "Table of Contents",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 800, after: 400 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "1. Executive Summary", size: 24 }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "2. Copyright Protection in Australia",
                size: 24,
              }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "3. Patent Registration in Australia",
                size: 24,
              }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "4. Trademark Registration in Australia",
                size: 24,
              }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "5. Business Name / Trade Name Registration",
                size: 24,
              }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "6. Company Name Registration", size: 24 }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "7. Domain Name Registration", size: 24 }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "8. Design Rights Registration", size: 24 }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "9. Summary of Fees and Costs", size: 24 }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "10. Key Forms and Application Links",
                size: 24,
              }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "11. Professional Assistance", size: 24 }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "12. Appendix: Key Government Contacts",
                size: 24,
              }),
            ],
            spacing: { after: 600 },
          }),

          // SECTION 1: EXECUTIVE SUMMARY
          new Paragraph({
            text: "1. Executive Summary",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 600, after: 300 },
          }),

          new Paragraph({
            text: "What IP Protection Does CGT Brain AI Need?",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "For CGT Brain AI software, the following intellectual property protections are recommended:",
                size: 24,
              }),
            ],
            spacing: { after: 300 },
          }),

          // IP Types Table
          createTable(
            [
              "IP Type",
              "Relevance to CGT Brain AI",
              "Registration Required?",
              "Administering Body",
            ],
            [
              [
                "Copyright",
                "Protects source code, UI designs, documentation",
                "No - Automatic",
                "Attorney-General's Dept",
              ],
              [
                "Patent",
                "Protects novel technical innovations/algorithms",
                "Yes",
                "IP Australia",
              ],
              [
                "Trademark",
                'Protects "CGT Brain AI" brand name and logo',
                "Yes",
                "IP Australia",
              ],
              [
                "Business Name",
                "Protects trading name",
                "Yes",
                "ASIC",
              ],
              [
                "Domain Name",
                "Protects online presence",
                "Yes",
                "auDA (via registrars)",
              ],
              [
                "Design Rights",
                "Protects visual appearance of UI",
                "Yes",
                "IP Australia",
              ],
            ]
          ),

          new Paragraph({
            text: "Key Government Bodies",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),

          createParagraphWithLinks([
            { text: "IP Australia: ", bold: true },
            { text: "https://www.ipaustralia.gov.au", link: "https://www.ipaustralia.gov.au" },
            { text: " - Patents, Trademarks, Designs, Plant Breeder's Rights" },
          ]),

          createParagraphWithLinks([
            { text: "Attorney-General's Department: ", bold: true },
            { text: "https://www.ag.gov.au/rights-and-protections/copyright", link: "https://www.ag.gov.au/rights-and-protections/copyright" },
            { text: " - Copyright" },
          ]),

          createParagraphWithLinks([
            { text: "ASIC: ", bold: true },
            { text: "https://www.asic.gov.au", link: "https://www.asic.gov.au" },
            { text: " - Business Names, Company Registration" },
          ]),

          createParagraphWithLinks([
            { text: "auDA: ", bold: true },
            { text: "https://www.auda.org.au", link: "https://www.auda.org.au" },
            { text: " - .au Domain Names" },
          ]),

          // SECTION 2: COPYRIGHT
          new Paragraph({
            text: "2. Copyright Protection in Australia",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 600, after: 300 },
          }),

          new Paragraph({
            text: "2.1 Overview",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "IMPORTANT: Copyright protection in Australia is FREE and AUTOMATIC.",
                bold: true,
                size: 24,
                color: "C00000",
              }),
            ],
            spacing: { after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Unlike patents and trademarks, there is no registration system for copyright in Australia. Copyright protection arises automatically the moment an original work is created and expressed in a tangible form.",
                size: 24,
              }),
            ],
            spacing: { after: 300 },
          }),

          new Paragraph({
            text: "2.2 What Copyright Protects for Software",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Copyright protects the following aspects of CGT Brain AI:",
                size: 24,
              }),
            ],
            spacing: { after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "• Source code - All programming code (TypeScript, JavaScript, CSS, etc.)",
                size: 24,
              }),
            ],
            bullet: { level: 0 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "• Software documentation - User manuals, technical specifications",
                size: 24,
              }),
            ],
            bullet: { level: 0 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "• User interface designs - Original visual layouts and artistic elements",
                size: 24,
              }),
            ],
            bullet: { level: 0 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "• Database structures - Original compilations of data",
                size: 24,
              }),
            ],
            bullet: { level: 0 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "• Literary works - Any written content within the application",
                size: 24,
              }),
            ],
            bullet: { level: 0 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "• Sound recordings - If the AI uses voice features",
                size: 24,
              }),
            ],
            bullet: { level: 0 },
            spacing: { after: 300 },
          }),

          new Paragraph({
            text: "2.3 Duration of Copyright Protection",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),

          createTable(
            ["Type of Work", "Duration"],
            [
              [
                "Computer programs (software)",
                "70 years from the end of the year the author dies",
              ],
              [
                "Literary works",
                "70 years from the end of the year the author dies",
              ],
              [
                "Sound recordings",
                "70 years from the end of the year first published",
              ],
              [
                "Films/Cinematographic works",
                "70 years from the end of the year first published",
              ],
            ]
          ),

          new Paragraph({
            text: "2.4 How to Establish Copyright Ownership",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "While registration is not required, the following practices help prove ownership:",
                size: 24,
              }),
            ],
            spacing: { after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "1. Date stamp your work - Maintain version control records (Git commits serve this purpose)",
                size: 24,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "2. Keep development records - Preserve drafts, iterations, and development logs",
                size: 24,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "3. Include copyright notices - Add notices to your code and materials:",
                size: 24,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: '   Example: "© 2024-2026 Tax Simple Australia Pty Ltd. All rights reserved."',
                size: 24,
                italics: true,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "4. Use NDA agreements - When sharing confidential information",
                size: 24,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "5. Employment contracts - Ensure clear IP assignment clauses for developers",
                size: 24,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "6. Backup securely - Maintain dated backups of all source code",
                size: 24,
              }),
            ],
            spacing: { after: 300 },
          }),

          new Paragraph({
            text: "2.5 Copyright Infringement and Enforcement",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Copyright owners have exclusive rights to:",
                size: 24,
                bold: true,
              }),
            ],
            spacing: { after: 100 },
          }),

          new Paragraph({
            children: [new TextRun({ text: "• Reproduce the work", size: 24 })],
          }),
          new Paragraph({
            children: [new TextRun({ text: "• Publish the work", size: 24 })],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "• Communicate the work to the public",
                size: 24,
              }),
            ],
          }),
          new Paragraph({
            children: [new TextRun({ text: "• Make adaptations", size: 24 })],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "• License these rights to others",
                size: 24,
              }),
            ],
            spacing: { after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Enforcement options include:",
                size: 24,
                bold: true,
              }),
            ],
            spacing: { after: 100 },
          }),

          new Paragraph({
            children: [
              new TextRun({ text: "• Cease and desist letters", size: 24 }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "• Mediation and negotiation", size: 24 }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "• Court action for damages and injunctions",
                size: 24,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "• Border protection (for physical goods)",
                size: 24,
              }),
            ],
            spacing: { after: 300 },
          }),

          new Paragraph({
            text: "2.6 Relevant Legislation",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "• Copyright Act 1968 (Cth) - Primary legislation",
                size: 24,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "• Copyright Regulations 2017 - Supplementary regulations",
                size: 24,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "• Copyright (International Protection) Regulations 1969",
                size: 24,
              }),
            ],
            spacing: { after: 300 },
          }),

          new Paragraph({
            text: "2.7 Key Copyright Resources",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),

          createTable(
            ["Resource", "URL"],
            [
              [
                "Attorney-General's Department - Copyright",
                {
                  text: "https://www.ag.gov.au/rights-and-protections/copyright",
                  link: "https://www.ag.gov.au/rights-and-protections/copyright",
                },
              ],
              [
                "Copyright Basics",
                {
                  text: "https://www.ag.gov.au/rights-and-protections/copyright/copyright-basics",
                  link: "https://www.ag.gov.au/rights-and-protections/copyright/copyright-basics",
                },
              ],
              [
                "For Copyright Owners",
                {
                  text: "https://www.ag.gov.au/rights-and-protections/copyright/copyright-owners",
                  link: "https://www.ag.gov.au/rights-and-protections/copyright/copyright-owners",
                },
              ],
              [
                "IP Australia - Types of IP",
                {
                  text: "https://www.ipaustralia.gov.au/understanding-ip/types-of-ip",
                  link: "https://www.ipaustralia.gov.au/understanding-ip/types-of-ip",
                },
              ],
            ]
          ),

          // SECTION 3: PATENTS
          new Paragraph({
            text: "3. Patent Registration in Australia",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 600, after: 300 },
          }),

          new Paragraph({
            text: "3.1 Overview",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Patents protect inventions - new ways of doing things, technical solutions to problems, and innovations in how things work. For CGT Brain AI, patents could protect novel algorithms, technical processes, or innovative computational methods.",
                size: 24,
              }),
            ],
            spacing: { after: 200 },
          }),

          createParagraphWithLinks([
            { text: "Administered by: ", bold: true },
            { text: "IP Australia" },
          ]),

          createParagraphWithLinks([
            { text: "Website: ", bold: true },
            {
              text: "https://www.ipaustralia.gov.au/patents",
              link: "https://www.ipaustralia.gov.au/patents",
            },
          ]),

          new Paragraph({
            text: "3.2 Types of Patents in Australia",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),

          createTable(
            ["Patent Type", "Protection Period", "Status"],
            [
              [
                "Standard Patent",
                "Up to 20 years (25 for pharmaceuticals)",
                "Available",
              ],
              ["Provisional Patent", "12 months (priority date holder)", "Available"],
              [
                "Innovation Patent",
                "Was 8 years",
                "NO LONGER AVAILABLE for new applications",
              ],
            ]
          ),

          new Paragraph({
            text: "3.3 Software Patent Eligibility in Australia",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Key 2025 Development - Aristocrat Decision:",
                size: 24,
                bold: true,
                color: "1F4E79",
              }),
            ],
            spacing: { after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Following the landmark case Aristocrat Technologies Australia Pty Ltd v Commissioner of Patents [2025] FCAFC 131, the patentability of computer-implemented inventions (CIIs) in Australia has become more favourable.",
                size: 24,
              }),
            ],
            spacing: { after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "The test for patentability:",
                size: 24,
                bold: true,
              }),
            ],
            spacing: { after: 100 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: '• The invention must involve more than just manipulation of an abstract idea in a computer',
                size: 24,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: '• It must implement an abstract idea in a computer to produce an "artificial state of affairs and a useful result"',
                size: 24,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: '• The invention must have "technical character" in substance',
                size: 24,
              }),
            ],
            spacing: { after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "What CAN be patented:",
                size: 24,
                bold: true,
                color: "2E7D32",
              }),
            ],
            spacing: { after: 100 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "• Novel algorithms with technical application",
                size: 24,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "• AI systems that solve technical problems",
                size: 24,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "• Data processing methods that produce tangible results",
                size: 24,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "• Software that improves computer functionality",
                size: 24,
              }),
            ],
            spacing: { after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "What CANNOT be patented:",
                size: 24,
                bold: true,
                color: "C00000",
              }),
            ],
            spacing: { after: 100 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "• Abstract ideas or mathematical formulas alone",
                size: 24,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "• Business methods without technical implementation",
                size: 24,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "• Mere presentations of information",
                size: 24,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "• Schemes or plans without technical substance",
                size: 24,
              }),
            ],
            spacing: { after: 300 },
          }),

          new Paragraph({
            text: "3.4 Patent Application Process",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Step-by-Step Process:",
                size: 24,
                bold: true,
              }),
            ],
            spacing: { after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Step 1: Research Your Invention",
                size: 24,
                bold: true,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "Keep your invention confidential before filing. Decide between provisional, standard, or international (PCT) patent. Research costs and renewal fees.",
                size: 24,
              }),
            ],
            spacing: { after: 150 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Step 2: Search Existing Patents",
                size: 24,
                bold: true,
              }),
            ],
          }),
          createParagraphWithLinks([
            { text: "Use AusPat database: " },
            {
              text: "https://inspire.wipo.int/auspat",
              link: "https://inspire.wipo.int/auspat",
            },
          ]),

          new Paragraph({
            children: [
              new TextRun({
                text: "Step 3: Prepare Required Documents",
                size: 24,
                bold: true,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "Ownership and inventor details, Australian/New Zealand agent address, detailed specification (description and claims), payment information, sequence listings (if applicable).",
                size: 24,
              }),
            ],
            spacing: { after: 150 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Step 4: File Your Application",
                size: 24,
                bold: true,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "Create account with IP Australia Online Services, complete application form (approximately 15 minutes), upload specification document, pay application fee.",
                size: 24,
              }),
            ],
            spacing: { after: 150 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Step 5: Publication",
                size: 24,
                bold: true,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "Patent published in Australian Official Journal of Patents and available in Australian Patent Search database.",
                size: 24,
              }),
            ],
            spacing: { after: 150 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Step 6: Request Examination",
                size: 24,
                bold: true,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "Can be requested at filing or within 5 years. Pay examination fee. Processing typically takes up to 12 months.",
                size: 24,
              }),
            ],
            spacing: { after: 150 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Step 7: Address Examination Issues",
                size: 24,
                bold: true,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "12 months to resolve any issues raised. Failure to resolve causes application to lapse.",
                size: 24,
              }),
            ],
            spacing: { after: 150 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Step 8: Acceptance and Grant",
                size: 24,
                bold: true,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "If approved, published for 3-month opposition period. Third parties can oppose grant. Once granted, protection begins.",
                size: 24,
              }),
            ],
            spacing: { after: 300 },
          }),

          new Paragraph({
            text: "3.5 Provisional Patent Applications",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "A provisional patent is an optional, inexpensive first step that:",
                size: 24,
              }),
            ],
            spacing: { after: 100 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "• Establishes your priority date",
                size: 24,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "• Gives you 12 months to decide on full patent",
                size: 24,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "• Signals to competitors you're seeking protection",
                size: 24,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "• Keeps technical details confidential",
                size: 24,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "• Enables international-type search option",
                size: 24,
              }),
            ],
            spacing: { after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "IMPORTANT: A provisional patent does NOT provide enforceable protection. You must convert to a standard patent within 12 months.",
                size: 24,
                bold: true,
                color: "C00000",
              }),
            ],
            spacing: { after: 300 },
          }),

          new Paragraph({
            text: "3.6 International Patent Protection (PCT)",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "The Patent Cooperation Treaty (PCT) allows filing a single international application for protection in 150+ countries.",
                size: 24,
              }),
            ],
            spacing: { after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({ text: "Key features:", size: 24, bold: true }),
            ],
            spacing: { after: 100 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "• Single application for multiple countries",
                size: 24,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "• One set of formalities", size: 24 }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "• No immediate translation required",
                size: 24,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "• 31 months from priority date to enter national phases",
                size: 24,
              }),
            ],
            spacing: { after: 200 },
          }),

          createParagraphWithLinks([
            { text: "WIPO PCT System: ", bold: true },
            {
              text: "https://www.wipo.int/pct/en/",
              link: "https://www.wipo.int/pct/en/",
            },
          ]),

          new Paragraph({
            text: "3.7 Patent Fees (Current as of 2025-2026)",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Application Fees:",
                size: 24,
                bold: true,
              }),
            ],
            spacing: { after: 150 },
          }),

          createTable(
            ["Fee Type", "Online", "Postal"],
            [
              ["Provisional Patent Application", "$100", "$200"],
              ["Optional International-Type Search", "$1,100", "$1,100"],
              ["Standard Patent Application", "$400", "$600"],
              ["Preliminary Search & Opinion (optional)", "$1,100", "$1,100"],
            ]
          ),

          new Paragraph({
            children: [
              new TextRun({
                text: "Examination Fees:",
                size: 24,
                bold: true,
              }),
            ],
            spacing: { before: 300, after: 150 },
          }),

          createTable(
            ["Fee Type", "Amount"],
            [
              ["Examination Request", "$550"],
              ["Voluntary Amendments (before examination)", "$250"],
              ["Extra Claims Fee (21-30 claims)", "$125 per claim"],
              ["Extra Claims Fee (31+ claims)", "$250 per claim"],
            ]
          ),

          new Paragraph({
            children: [
              new TextRun({
                text: "Acceptance Fees:",
                size: 24,
                bold: true,
              }),
            ],
            spacing: { before: 300, after: 150 },
          }),

          createTable(
            ["Fee Type", "Amount"],
            [["Standard Patent Acceptance (up to 20 claims)", "$300"]],
          ),

          new Paragraph({
            text: "3.8 Processing Timelines",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),

          createTable(
            ["Stage", "Timeframe"],
            [
              ["Provisional application processing", "Within 1 month"],
              [
                "Standard application to examination",
                "Up to 5 years (applicant's choice)",
              ],
              [
                "Examination wait time",
                "11-21 months (varies by technology field)",
              ],
              ["Post-examination resolution", "12 months"],
              ["Opposition period (after acceptance)", "3 months"],
            ]
          ),

          new Paragraph({
            text: "3.9 Key Patent Forms and Resources",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),

          createTable(
            ["Form", "Description", "Link"],
            [
              [
                "p00003_1114",
                "Provisional Patent Application",
                {
                  text: "Apply for Provisional Patent",
                  link: "https://www.ipaustralia.gov.au/tools-and-research/forms/apply-for-a-provisional-patent-application",
                },
              ],
              [
                "Online Application",
                "Standard Patent Application",
                {
                  text: "Apply for Standard Patent",
                  link: "https://www.ipaustralia.gov.au/patents/how-to-apply-for-a-standard-patent",
                },
              ],
              [
                "Examination Request",
                "Request Examination of Patent",
                {
                  text: "Examination Request Form",
                  link: "https://www.ipaustralia.gov.au/tools-and-research/forms/Request-for-examination-of-patent-application-and-complete-specification",
                },
              ],
              [
                "All Patent Forms",
                "Forms Directory",
                {
                  text: "IP Australia Forms",
                  link: "https://www.ipaustralia.gov.au/tools-and-research/forms",
                },
              ],
            ]
          ),

          new Paragraph({
            text: "3.10 Key Patent Resources",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),

          createTable(
            ["Resource", "URL"],
            [
              [
                "IP Australia - Patents",
                {
                  text: "https://www.ipaustralia.gov.au/patents",
                  link: "https://www.ipaustralia.gov.au/patents",
                },
              ],
              [
                "Patent Fees and Timeframes",
                {
                  text: "https://www.ipaustralia.gov.au/patents/timeframes-and-fees",
                  link: "https://www.ipaustralia.gov.au/patents/timeframes-and-fees",
                },
              ],
              [
                "How to Apply for Standard Patent",
                {
                  text: "https://www.ipaustralia.gov.au/patents/how-to-apply-for-a-standard-patent",
                  link: "https://www.ipaustralia.gov.au/patents/how-to-apply-for-a-standard-patent",
                },
              ],
              [
                "Provisional Patent Applications",
                {
                  text: "https://www.ipaustralia.gov.au/.../provisional-patent-applications",
                  link: "https://www.ipaustralia.gov.au/patents/how-to-apply-for-a-standard-patent/provisional-patent-applications",
                },
              ],
              [
                "Computer-Related Inventions",
                {
                  text: "https://www.ipaustralia.gov.au/.../what-computer-related-inventions-can-be-patented",
                  link: "https://www.ipaustralia.gov.au/patents/what-are-patents/what-computer-related-inventions-can-be-patented",
                },
              ],
              [
                "AusPat Search Database",
                {
                  text: "https://inspire.wipo.int/auspat",
                  link: "https://inspire.wipo.int/auspat",
                },
              ],
              [
                "PCT System (WIPO)",
                {
                  text: "https://www.wipo.int/pct/en/",
                  link: "https://www.wipo.int/pct/en/",
                },
              ],
              [
                "Patent Examination Manual",
                {
                  text: "https://manuals.ipaustralia.gov.au/patent",
                  link: "https://manuals.ipaustralia.gov.au/patent",
                },
              ],
            ]
          ),

          // SECTION 4: TRADEMARKS
          new Paragraph({
            text: "4. Trademark Registration in Australia",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 600, after: 300 },
          }),

          new Paragraph({
            text: "4.1 Overview",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "A trademark protects your brand - the name, logo, slogan, or other identifiers that distinguish your goods and services from competitors.",
                size: 24,
              }),
            ],
            spacing: { after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "For CGT Brain AI, trademarks would protect:",
                size: 24,
                bold: true,
              }),
            ],
            spacing: { after: 100 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: '• The name "CGT Brain AI"',
                size: 24,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "• The company logo", size: 24 }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "• Any distinctive slogans or taglines",
                size: 24,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "• Potentially distinctive UI elements",
                size: 24,
              }),
            ],
            spacing: { after: 200 },
          }),

          createParagraphWithLinks([
            { text: "Administered by: ", bold: true },
            { text: "IP Australia" },
          ]),

          createParagraphWithLinks([
            { text: "Website: ", bold: true },
            {
              text: "https://www.ipaustralia.gov.au/trade-marks",
              link: "https://www.ipaustralia.gov.au/trade-marks",
            },
          ]),

          new Paragraph({
            text: "4.2 What Can Be Trademarked",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Registrable trademarks include:",
                size: 24,
                bold: true,
                color: "2E7D32",
              }),
            ],
            spacing: { after: 100 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: '• Words and phrases (e.g., "CGT Brain AI")',
                size: 24,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "• Logos and graphics", size: 24 }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "• Letters and numbers", size: 24 }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "• Sounds (jingles, distinctive sounds)",
                size: 24,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "• Scents (in limited cases)", size: 24 }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "• Shapes (product packaging)",
                size: 24,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "• Colours (if distinctive)",
                size: 24,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "• Combinations of the above", size: 24 }),
            ],
            spacing: { after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "What CANNOT be trademarked:",
                size: 24,
                bold: true,
                color: "C00000",
              }),
            ],
            spacing: { after: 100 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "• Generic or descriptive terms",
                size: 24,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "• Geographic names (unless distinctive)",
                size: 24,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "• Common surnames", size: 24 }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "• Misleading or deceptive marks",
                size: 24,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "• Scandalous or offensive marks",
                size: 24,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: '• Prohibited marks (national flags, restricted terms like "bank")',
                size: 24,
              }),
            ],
            spacing: { after: 300 },
          }),

          new Paragraph({
            text: "4.3 Trademark Classes for Software",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Australia uses the Nice Classification System with 45 classes (1-34 for goods, 35-45 for services).",
                size: 24,
              }),
            ],
            spacing: { after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Relevant classes for CGT Brain AI:",
                size: 24,
                bold: true,
              }),
            ],
            spacing: { after: 150 },
          }),

          createTable(
            ["Class", "Description", "Relevance"],
            [
              [
                "Class 9",
                "Downloadable software, apps, computer hardware",
                "Downloadable CGT Brain AI software",
              ],
              [
                "Class 35",
                "Business services, advertising, data management",
                "Business consulting, data analysis services",
              ],
              [
                "Class 36",
                "Financial services, tax services",
                "CGT calculation and tax-related services",
              ],
              [
                "Class 42",
                "Scientific/technological services, SaaS, software development",
                "Cloud-based CGT Brain AI platform, IT services",
              ],
            ]
          ),

          new Paragraph({
            children: [
              new TextRun({
                text: "Note: You should register in ALL classes relevant to your business. Software companies typically need both Class 9 (downloadable software) AND Class 42 (SaaS and development services).",
                size: 24,
                italics: true,
              }),
            ],
            spacing: { before: 200, after: 300 },
          }),

          new Paragraph({
            text: "4.4 Trademark Application Process",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Step 1: Determine Ownership",
                size: 24,
                bold: true,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "Legal owner must be specified (individual, company, trustee). Business names, trusts, and partnerships cannot directly own trademarks.",
                size: 24,
              }),
            ],
            spacing: { after: 150 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Step 2: Check Eligibility",
                size: 24,
                bold: true,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "Must reside in Australia/New Zealand OR have an agent there. Must intend to use the trademark for specified goods/services.",
                size: 24,
              }),
            ],
            spacing: { after: 150 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Step 3: Research Existing Trademarks",
                size: 24,
                bold: true,
              }),
            ],
          }),
          createParagraphWithLinks([
            { text: "Use TM Checker (free AI-powered tool): " },
            {
              text: "https://www.ipaustralia.gov.au/trade-marks/search-existing-trade-marks/tm-checker",
              link: "https://www.ipaustralia.gov.au/trade-marks/search-existing-trade-marks/tm-checker",
            },
          ]),
          createParagraphWithLinks([
            { text: "Search Australian Trade Mark Search: " },
            {
              text: "https://search.ipaustralia.gov.au/trademarks/search/quick",
              link: "https://search.ipaustralia.gov.au/trademarks/search/quick",
            },
          ]),

          new Paragraph({
            children: [
              new TextRun({
                text: "Step 4: Choose Application Type",
                size: 24,
                bold: true,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "Option A: TM Headstart (Recommended for first-time filers)",
                size: 24,
                bold: true,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "Pre-application service with examiner feedback. 5 business days to receive assessment. Starting cost: $330 per class.",
                size: 24,
              }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "Option B: Standard Application",
                size: 24,
                bold: true,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "Direct filing with priority date. Limited post-submission changes. Starting cost: $250 per class.",
                size: 24,
              }),
            ],
            spacing: { after: 150 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Step 5: Gather Documentation",
                size: 24,
                bold: true,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "Legal name and contact information, trademark representation (image file or description), list of goods/services with class numbers, payment details.",
                size: 24,
              }),
            ],
            spacing: { after: 150 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Step 6: File Online",
                size: 24,
                bold: true,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "Create IP Australia Online Services account, complete application form (~15 minutes), upload trademark image, pay fees.",
                size: 24,
              }),
            ],
            spacing: { after: 150 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Step 7: Examination",
                size: 24,
                bold: true,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "Processing takes 3-4 months. Examiner checks distinctiveness and conflicts.",
                size: 24,
              }),
            ],
            spacing: { after: 150 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Step 8: Acceptance and Publication",
                size: 24,
                bold: true,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "If accepted, published in Australian Official Journal of Trade Marks. 2-month opposition period.",
                size: 24,
              }),
            ],
            spacing: { after: 150 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Step 9: Registration",
                size: 24,
                bold: true,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "If no opposition, trademark registered. Certificate of Registration issued. Protection begins from filing date.",
                size: 24,
              }),
            ],
            spacing: { after: 300 },
          }),

          new Paragraph({
            text: "4.5 TM Headstart Service Details",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Three-Step Process:",
                size: 24,
                bold: true,
              }),
            ],
            spacing: { after: 150 },
          }),

          createTable(
            ["Step", "Description", "Cost"],
            [
              [
                "Step 1",
                "Submit Request - Create account, submit trademark, receive assessment within 5 business days",
                "$200 per class",
              ],
              [
                "Step 2",
                "Amendment (Optional) - 5 business days to make changes based on feedback",
                "$150 (mark changes), $200 per additional class",
              ],
              [
                "Step 3",
                "Formalize Application (Optional) - Convert to formal application within 5 business days",
                "$130 per class",
              ],
            ]
          ),

          new Paragraph({
            children: [
              new TextRun({
                text: "Minimum total cost: $330 for one class",
                size: 24,
                bold: true,
              }),
            ],
            spacing: { before: 200, after: 300 },
          }),

          new Paragraph({
            text: "4.6 Trademark Fees (Current as of 2025-2026)",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Standard Application Fees:",
                size: 24,
                bold: true,
              }),
            ],
            spacing: { after: 150 },
          }),

          createTable(
            ["Fee Type", "Cost"],
            [
              ["First class (using picklist)", "$250"],
              ["First class (without picklist)", "$400"],
              ["Additional classes", "$450 per class"],
              ["Series trademark (with picklist)", "$400 per class"],
              ["Series trademark (without picklist)", "$550 per class"],
              ["Postal application", "$450 per class"],
            ]
          ),

          new Paragraph({
            text: "4.7 Processing Timelines",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),

          createTable(
            ["Stage", "Timeframe"],
            [
              ["Total registration time", "At least 7 months"],
              ["Examination", "3-4 months from filing"],
              ["Opposition period", "2 months after acceptance"],
              ["Registration (if no opposition)", "Immediately after opposition period"],
            ]
          ),

          new Paragraph({
            text: "4.8 Protection Duration and Renewal",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "• Initial protection: 10 years from filing date",
                size: 24,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "• Renewal: Every 10 years", size: 24 }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "• Renewal period: Within 12 months before expiry",
                size: 24,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "• Grace period: 6 months after expiry (with surcharges)",
                size: 24,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "• Protection continues indefinitely if renewed on time",
                size: 24,
                bold: true,
              }),
            ],
            spacing: { after: 300 },
          }),

          new Paragraph({
            text: "4.9 Key Trademark Forms and Resources",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),

          createTable(
            ["Form", "Description", "Link"],
            [
              [
                "TM Checker",
                "Free search tool",
                {
                  text: "TM Checker",
                  link: "https://www.ipaustralia.gov.au/trade-marks/search-existing-trade-marks/tm-checker",
                },
              ],
              [
                "TM Headstart",
                "Pre-application service",
                {
                  text: "TM Headstart",
                  link: "https://www.ipaustralia.gov.au/trade-marks/how-to-apply-for-a-trade-mark/pre-application-service-tm-headstart",
                },
              ],
              [
                "tm00001_0719",
                "Trade Mark Application (PDF)",
                {
                  text: "Trade Mark Application",
                  link: "https://www.ipaustralia.gov.au/tools-and-research/forms/apply-for-a-trade-mark",
                },
              ],
              [
                "Australian Trade Mark Search",
                "Search existing marks",
                {
                  text: "Australian Trade Mark Search",
                  link: "https://search.ipaustralia.gov.au/trademarks/search/quick",
                },
              ],
              [
                "Classification Search",
                "Find correct classes",
                {
                  text: "Classification Search",
                  link: "https://tmgns.search.ipaustralia.gov.au/",
                },
              ],
            ]
          ),

          // SECTION 5: BUSINESS NAMES
          new Paragraph({
            text: "5. Business Name / Trade Name Registration",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 600, after: 300 },
          }),

          new Paragraph({
            text: "5.1 Overview",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "A business name is the name you trade under, which may be different from your legal company name. In Australia, business names are registered with ASIC (Australian Securities and Investments Commission).",
                size: 24,
              }),
            ],
            spacing: { after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: 'IMPORTANT NOTE ON TRADING NAMES: As of 1 November 2025, unregistered "trading names" were removed from public visibility on the Australian Business Register (ABR) and ABN Lookup. All businesses must now register their business name through ASIC.',
                size: 24,
                bold: true,
                color: "C00000",
              }),
            ],
            spacing: { after: 200 },
          }),

          createParagraphWithLinks([
            { text: "Administered by: ", bold: true },
            { text: "ASIC" },
          ]),

          createParagraphWithLinks([
            { text: "Website: ", bold: true },
            {
              text: "https://www.asic.gov.au/for-business-and-companies/business-names/",
              link: "https://www.asic.gov.au/for-business-and-companies/business-names/",
            },
          ]),

          new Paragraph({
            text: "5.2 When Business Name Registration is Required",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "You MUST register a business name if you trade under a name different from:",
                size: 24,
                bold: true,
              }),
            ],
            spacing: { after: 100 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "• Your own first name and surname (for sole traders)",
                size: 24,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "• All partners' personal names (for partnerships)",
                size: 24,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "• Your registered company name (for companies)",
                size: 24,
              }),
            ],
            spacing: { after: 300 },
          }),

          new Paragraph({
            text: "5.3 Business Name vs Trademark",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),

          createTable(
            ["Feature", "Business Name (ASIC)", "Trademark (IP Australia)"],
            [
              [
                "Protection scope",
                "Prevents identical/nearly identical names",
                "Prevents similar marks causing confusion",
              ],
              [
                "Geographic scope",
                "Australia-wide",
                "Australia (can extend internationally)",
              ],
              ["Duration", "1 or 3 years (renewable)", "10 years (renewable indefinitely)"],
              [
                "Legal protection",
                "Limited (just prevents same name)",
                "Strong (can sue for infringement)",
              ],
              [
                "Recommendation",
                "Register both",
                "Register both for comprehensive protection",
              ],
            ]
          ),

          new Paragraph({
            text: "5.4 Registration Process",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Step 1: Check Name Availability",
                size: 24,
                bold: true,
              }),
            ],
          }),
          createParagraphWithLinks([
            { text: "Search ASIC Business Names Register: " },
            {
              text: "https://www.asic.gov.au/online-services/search-asic-registers/business-names-register/",
              link: "https://www.asic.gov.au/online-services/search-asic-registers/business-names-register/",
            },
          ]),

          new Paragraph({
            children: [
              new TextRun({
                text: "Step 2: Apply Through Business Registration Service",
                size: 24,
                bold: true,
              }),
            ],
          }),
          createParagraphWithLinks([
            { text: "Government's Business Registration Service: " },
            {
              text: "https://register.business.gov.au/",
              link: "https://register.business.gov.au/",
            },
          ]),

          new Paragraph({
            children: [
              new TextRun({
                text: "Step 3: Choose Registration Period",
                size: 24,
                bold: true,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "• 1 year: $45", size: 24 }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "• 3 years: $104", size: 24 }),
            ],
            spacing: { after: 150 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Step 4: Pay and Complete",
                size: 24,
                bold: true,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "Payment via credit/debit card. Registration typically processed within 48 hours. Certificate of registration provided.",
                size: 24,
              }),
            ],
            spacing: { after: 300 },
          }),

          new Paragraph({
            text: "5.5 Business Name Fees (1 July 2025 - 30 June 2026)",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),

          createTable(
            ["Service", "Fee (AUD)"],
            [
              ["New registration (1 year)", "$45"],
              ["New registration (3 years)", "$104"],
              ["Renewal (1 year)", "$45"],
              ["Renewal (3 years)", "$104"],
              ["Late payment (within 1 month)", "$98"],
              ["Late payment (after 1 month)", "$411"],
            ]
          ),

          new Paragraph({
            children: [
              new TextRun({
                text: "Note: Fees are indexed annually from 1 July. GST does not apply to ASIC fees.",
                size: 24,
                italics: true,
              }),
            ],
            spacing: { before: 200, after: 300 },
          }),

          new Paragraph({
            text: "5.6 Key Business Name Resources",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),

          createTable(
            ["Resource", "URL"],
            [
              [
                "ASIC - Business Names",
                {
                  text: "https://www.asic.gov.au/for-business-and-companies/business-names/",
                  link: "https://www.asic.gov.au/for-business-and-companies/business-names/",
                },
              ],
              [
                "Register a Business Name",
                {
                  text: "https://www.asic.gov.au/.../register-a-business-name/",
                  link: "https://www.asic.gov.au/for-business-and-companies/business-names/register-a-business-name/",
                },
              ],
              [
                "Business Registration Service",
                {
                  text: "https://register.business.gov.au/",
                  link: "https://register.business.gov.au/",
                },
              ],
              [
                "ASIC Fee Schedule",
                {
                  text: "https://www.asic.gov.au/.../schedules-of-business-names-fees/",
                  link: "https://www.asic.gov.au/for-business-and-companies/forms-and-fees/all-fees/schedules-of-business-names-fees/",
                },
              ],
            ]
          ),

          // SECTION 6: COMPANY NAMES
          new Paragraph({
            text: "6. Company Name Registration",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 600, after: 300 },
          }),

          new Paragraph({
            text: "6.1 Overview",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "If operating as a company (Pty Ltd), the company must be registered with ASIC. The company name becomes a legal identifier and provides nationwide exclusivity.",
                size: 24,
              }),
            ],
            spacing: { after: 200 },
          }),

          createParagraphWithLinks([
            { text: "Administered by: ", bold: true },
            { text: "ASIC" },
          ]),

          createParagraphWithLinks([
            { text: "Website: ", bold: true },
            {
              text: "https://www.asic.gov.au/for-business-and-companies/companies/register-a-company/",
              link: "https://www.asic.gov.au/for-business-and-companies/companies/register-a-company/",
            },
          ]),

          new Paragraph({
            text: "6.2 Company Registration Requirements",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Essential requirements:",
                size: 24,
                bold: true,
              }),
            ],
            spacing: { after: 100 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "• Unique, available company name",
                size: 24,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "• Physical registered office address in Australia",
                size: 24,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "• At least one director who is an Australian resident",
                size: 24,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "• At least one shareholder", size: 24 }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "• Director ID for all directors (mandatory before registration)",
                size: 24,
                bold: true,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "• Constitution (optional - can use replaceable rules)",
                size: 24,
              }),
            ],
            spacing: { after: 200 },
          }),

          createParagraphWithLinks([
            { text: "Director ID Application: ", bold: true },
            {
              text: "https://www.abrs.gov.au/director-identification-number",
              link: "https://www.abrs.gov.au/director-identification-number",
            },
          ]),

          new Paragraph({
            text: "6.3 Company Registration Fees (1 July 2025 - 30 June 2026)",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),

          createTable(
            ["Service", "Fee (AUD)"],
            [
              ["Company registration", "$611"],
              ["Name reservation", "$62"],
              ["Annual review fee (Pty Ltd)", "$329"],
              ["Annual review fee (Special purpose)", "$67"],
              ["Voluntary deregistration", "$50"],
            ]
          ),

          // SECTION 7: DOMAIN NAMES
          new Paragraph({
            text: "7. Domain Name Registration",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 600, after: 300 },
          }),

          new Paragraph({
            text: "7.1 Overview",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Domain names provide your online identity. For Australian businesses, the .au namespace is managed by the .au Domain Administration (auDA).",
                size: 24,
              }),
            ],
            spacing: { after: 200 },
          }),

          createParagraphWithLinks([
            { text: "Administered by: ", bold: true },
            { text: "auDA (domain policies) + Various registrars (registration)" },
          ]),

          createParagraphWithLinks([
            { text: "Website: ", bold: true },
            {
              text: "https://www.auda.org.au",
              link: "https://www.auda.org.au",
            },
          ]),

          new Paragraph({
            text: "7.2 Available .au Domain Types",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),

          createTable(
            ["Domain", "Type", "Eligibility"],
            [
              [".au", "Direct", "Australian presence required"],
              [".com.au", "Commercial", "Commercial entities with ABN/ACN"],
              [".net.au", "Network", "Commercial entities with ABN/ACN"],
              [".org.au", "Organisation", "Non-profits and charities"],
              [".id.au", "Individual", "Australian individuals"],
              [".asn.au", "Association", "Australian associations"],
            ]
          ),

          new Paragraph({
            text: "7.3 Eligibility Requirements",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "For .com.au and .net.au:",
                size: 24,
                bold: true,
              }),
            ],
            spacing: { after: 100 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "• Australian sole trader, business, or company",
                size: 24,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "• Valid ABN or ACN", size: 24 }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "• Domain must relate to your entity name, business name, or trademark",
                size: 24,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: '• OR have "close and substantial connection" to your goods/services',
                size: 24,
              }),
            ],
            spacing: { after: 300 },
          }),

          new Paragraph({
            text: "7.4 Domain Registration Costs",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),

          createTable(
            ["Domain Type", "Annual Cost (Approx.)"],
            [
              [".com.au", "$15 - $50"],
              [".au (direct)", "$20 - $60"],
              [".org.au", "$15 - $50"],
              [".net.au", "$15 - $50"],
            ]
          ),

          new Paragraph({
            children: [
              new TextRun({
                text: "Note: Prices vary significantly between registrars. Shop around for best value.",
                size: 24,
                italics: true,
              }),
            ],
            spacing: { before: 200, after: 300 },
          }),

          // SECTION 8: DESIGN RIGHTS
          new Paragraph({
            text: "8. Design Rights Registration",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 600, after: 300 },
          }),

          new Paragraph({
            text: "8.1 Overview",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Design rights protect the visual appearance of products - their shape, configuration, pattern, and ornamentation. For CGT Brain AI, this could protect distinctive visual UI elements if they're sufficiently novel and distinctive.",
                size: 24,
              }),
            ],
            spacing: { after: 200 },
          }),

          createParagraphWithLinks([
            { text: "Administered by: ", bold: true },
            { text: "IP Australia" },
          ]),

          createParagraphWithLinks([
            { text: "Website: ", bold: true },
            {
              text: "https://www.ipaustralia.gov.au/design-rights",
              link: "https://www.ipaustralia.gov.au/design-rights",
            },
          ]),

          new Paragraph({
            text: "8.2 Two-Part Process",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Design registration in Australia has two parts:",
                size: 24,
                bold: true,
              }),
            ],
            spacing: { after: 150 },
          }),

          createTable(
            ["Part", "Description", "Provides"],
            [
              [
                "Part 1: Registration",
                "Establishes ownership record, publishes design publicly",
                "Does NOT provide enforceable rights",
              ],
              [
                "Part 2: Certification",
                "Examines novelty and distinctiveness",
                "Provides enforceable legal rights",
              ],
            ]
          ),

          new Paragraph({
            text: "8.3 Design Rights Fees (From October 2024)",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),

          createTable(
            ["Service", "Fee (AUD)"],
            [
              ["New single design application", "$200"],
              ["Additional design (same Locarno class)", "$150"],
              ["Excess design during formalities", "$200"],
              ["Examination request (owner)", "$500"],
              ["Registered owner fee", "$250"],
            ]
          ),

          new Paragraph({
            text: "8.4 Protection Duration",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "• Initial term: 5 years from filing date",
                size: 24,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "• Renewal: One additional 5-year term",
                size: 24,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "• Maximum protection: 10 years total",
                size: 24,
                bold: true,
              }),
            ],
            spacing: { after: 300 },
          }),

          // SECTION 9: FEES SUMMARY
          new Paragraph({
            text: "9. Summary of Fees and Costs",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 600, after: 300 },
          }),

          new Paragraph({
            text: "9.1 Complete Fee Summary for CGT Brain AI",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),

          createTable(
            ["IP Type", "Minimum Cost", "Typical Total", "Duration", "Renewal"],
            [
              ["Copyright", "FREE", "FREE", "70 years after author's death", "N/A"],
              [
                "Provisional Patent",
                "$100",
                "$100 - $200",
                "12 months (priority)",
                "Convert to standard",
              ],
              [
                "Standard Patent",
                "$400",
                "$1,000 - $5,000+",
                "20 years",
                "Annual fees",
              ],
              [
                "Trademark (1 class)",
                "$250",
                "$250 - $500",
                "10 years",
                "Every 10 years",
              ],
              [
                "Trademark (TM Headstart)",
                "$330",
                "$330 - $600",
                "10 years",
                "Every 10 years",
              ],
              ["Business Name (1 year)", "$45", "$45", "1 year", "Annually"],
              [
                "Business Name (3 years)",
                "$104",
                "$104",
                "3 years",
                "Every 3 years",
              ],
              [
                "Company Registration",
                "$611",
                "$611",
                "Perpetual",
                "Annual review ($329)",
              ],
              [
                "Domain (.com.au)",
                "~$20",
                "$20 - $50",
                "1-5 years",
                "Per registration period",
              ],
              [
                "Design Registration",
                "$200",
                "$200 - $400",
                "5 years",
                "Once (5 more years)",
              ],
              [
                "Design Certification",
                "$500",
                "$500 - $750",
                "(included)",
                "N/A",
              ],
            ]
          ),

          new Paragraph({
            text: "9.2 Recommended IP Budget for CGT Brain AI",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),

          createTable(
            ["Protection", "Priority", "Estimated Cost"],
            [
              ["Copyright notice", "Essential", "FREE"],
              ['Trademark "CGT Brain AI" (Class 9 + 42)', "High", "$700 - $1,000"],
              ["Business name registration", "High", "$104 (3 years)"],
              ["Domain names (.com.au, .au)", "High", "$50 - $100/year"],
              ["Provisional patent (if applicable)", "Medium", "$100 - $200"],
              ["Standard patent (if applicable)", "Medium-Low", "$1,000 - $10,000+"],
              ["Design registration (UI elements)", "Low", "$200 - $750"],
            ]
          ),

          new Paragraph({
            children: [
              new TextRun({
                text: "Estimated minimum total: Approximately $1,000 - $1,500 for essential protections",
                size: 24,
                bold: true,
              }),
            ],
            spacing: { before: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "With patent protection: $2,000 - $15,000+ (depending on complexity and attorney fees)",
                size: 24,
                bold: true,
              }),
            ],
            spacing: { after: 300 },
          }),

          // SECTION 10: FORMS AND LINKS
          new Paragraph({
            text: "10. Key Forms and Application Links",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 600, after: 300 },
          }),

          new Paragraph({
            text: "10.1 IP Australia Online Services",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),

          createParagraphWithLinks([
            { text: "Main Portal: ", bold: true },
            {
              text: "https://www.ipaustralia.gov.au/tools-and-research/forms",
              link: "https://www.ipaustralia.gov.au/tools-and-research/forms",
            },
          ]),

          new Paragraph({
            children: [
              new TextRun({
                text: "Create Account: Required for all online applications",
                size: 24,
                bold: true,
              }),
            ],
            spacing: { after: 300 },
          }),

          new Paragraph({
            text: "10.2 Patent Forms",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),

          createTable(
            ["Form", "Description", "Link"],
            [
              [
                "p00003_1114",
                "Provisional Patent Application",
                {
                  text: "Apply for Provisional Patent",
                  link: "https://www.ipaustralia.gov.au/tools-and-research/forms/apply-for-a-provisional-patent-application",
                },
              ],
              [
                "Online Application",
                "Standard Patent Application",
                {
                  text: "Apply for Standard Patent",
                  link: "https://www.ipaustralia.gov.au/patents/how-to-apply-for-a-standard-patent",
                },
              ],
              [
                "Examination Request",
                "Request Examination of Patent",
                {
                  text: "Examination Request",
                  link: "https://www.ipaustralia.gov.au/tools-and-research/forms/Request-for-examination-of-patent-application-and-complete-specification",
                },
              ],
            ]
          ),

          new Paragraph({
            text: "10.3 Trademark Forms",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),

          createTable(
            ["Form", "Description", "Link"],
            [
              [
                "TM Checker",
                "Free search tool",
                {
                  text: "TM Checker",
                  link: "https://www.ipaustralia.gov.au/trade-marks/search-existing-trade-marks/tm-checker",
                },
              ],
              [
                "TM Headstart",
                "Pre-application service",
                {
                  text: "TM Headstart",
                  link: "https://www.ipaustralia.gov.au/trade-marks/how-to-apply-for-a-trade-mark/pre-application-service-tm-headstart",
                },
              ],
              [
                "Trade Mark Application",
                "Form tm00001_0719",
                {
                  text: "Trade Mark Application",
                  link: "https://www.ipaustralia.gov.au/tools-and-research/forms/apply-for-a-trade-mark",
                },
              ],
              [
                "Australian Trade Mark Search",
                "Search existing marks",
                {
                  text: "Trade Mark Search",
                  link: "https://search.ipaustralia.gov.au/trademarks/search/quick",
                },
              ],
            ]
          ),

          new Paragraph({
            text: "10.4 ASIC Forms",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),

          createTable(
            ["Service", "Description", "Link"],
            [
              [
                "Business Registration Service",
                "Business/Company registration",
                {
                  text: "register.business.gov.au",
                  link: "https://register.business.gov.au/",
                },
              ],
              [
                "Business Names Search",
                "Check availability",
                {
                  text: "ASIC Business Names Register",
                  link: "https://www.asic.gov.au/online-services/search-asic-registers/business-names-register/",
                },
              ],
              [
                "Business Name Portal",
                "Manage existing registration",
                {
                  text: "Business Name Portal",
                  link: "https://www.asic.gov.au/online-services/asic-portals/business-name-holder-portal-access/",
                },
              ],
            ]
          ),

          // SECTION 11: PROFESSIONAL ASSISTANCE
          new Paragraph({
            text: "11. Professional Assistance",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 600, after: 300 },
          }),

          new Paragraph({
            text: "11.1 When to Seek Professional Help",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Recommended for:",
                size: 24,
                bold: true,
              }),
            ],
            spacing: { after: 100 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "• Patent applications (especially for software/AI)",
                size: 24,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "• Complex trademark matters",
                size: 24,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "• Opposition proceedings", size: 24 }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "• Enforcement and litigation",
                size: 24,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "• International protection",
                size: 24,
              }),
            ],
            spacing: { after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Can often be done DIY:",
                size: 24,
                bold: true,
              }),
            ],
            spacing: { after: 100 },
          }),

          new Paragraph({
            children: [
              new TextRun({ text: "• Copyright notices", size: 24 }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "• Simple trademark applications",
                size: 24,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "• Business name registration",
                size: 24,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "• Domain registration", size: 24 }),
            ],
            spacing: { after: 300 },
          }),

          new Paragraph({
            text: "11.2 Types of IP Professionals",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),

          createTable(
            ["Professional", "Role", "Registration Body"],
            [
              [
                "Patent Attorney",
                "Patents, designs, plant breeders' rights",
                "Trans-Tasman IP Attorneys Board",
              ],
              [
                "Trade Mark Attorney",
                "Trademarks",
                "Trans-Tasman IP Attorneys Board",
              ],
              [
                "IP Lawyer",
                "Litigation, contracts, enforcement",
                "Law Society",
              ],
              [
                "IP Consultant",
                "Strategy, portfolio management",
                "Various",
              ],
            ]
          ),

          new Paragraph({
            text: "11.3 IP Australia Assistance",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Phone: 1300 65 10 10 (9am-5pm AEST, Monday-Friday)",
                size: 24,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "Small to medium businesses may qualify for free patent case manager assistance.",
                size: 24,
                italics: true,
              }),
            ],
            spacing: { after: 300 },
          }),

          // SECTION 12: CONTACTS
          new Paragraph({
            text: "12. Appendix: Key Government Contacts",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 600, after: 300 },
          }),

          new Paragraph({
            text: "12.1 IP Australia",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),

          createTable(
            ["Service", "Contact"],
            [
              [
                "Website",
                {
                  text: "https://www.ipaustralia.gov.au",
                  link: "https://www.ipaustralia.gov.au",
                },
              ],
              ["Phone", "1300 65 10 10"],
              ["Hours", "9am - 5pm AEST, Monday - Friday"],
              ["Address", "Discovery House, 47 Bowes Street, Phillip ACT 2606"],
              ["Postal", "PO Box 200, Woden ACT 2606"],
            ]
          ),

          new Paragraph({
            text: "12.2 ASIC",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),

          createTable(
            ["Service", "Contact"],
            [
              [
                "Website",
                {
                  text: "https://www.asic.gov.au",
                  link: "https://www.asic.gov.au",
                },
              ],
              ["Phone", "1300 300 630"],
              ["Hours", "8:30am - 5pm AEST, Monday - Friday"],
            ]
          ),

          new Paragraph({
            text: "12.3 Attorney-General's Department (Copyright)",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),

          createTable(
            ["Service", "Contact"],
            [
              [
                "Website",
                {
                  text: "https://www.ag.gov.au/rights-and-protections/copyright",
                  link: "https://www.ag.gov.au/rights-and-protections/copyright",
                },
              ],
              ["General Enquiries", "Via online contact form"],
            ]
          ),

          new Paragraph({
            text: "12.4 auDA (Domain Names)",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),

          createTable(
            ["Service", "Contact"],
            [
              [
                "Website",
                {
                  text: "https://www.auda.org.au",
                  link: "https://www.auda.org.au",
                },
              ],
              ["Email", "Via online contact form"],
            ]
          ),

          new Paragraph({
            text: "12.5 Business.gov.au",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),

          createTable(
            ["Service", "Contact"],
            [
              [
                "Website",
                {
                  text: "https://business.gov.au",
                  link: "https://business.gov.au",
                },
              ],
              ["Phone", "13 28 46"],
            ]
          ),

          // DISCLAIMER
          new Paragraph({
            children: [
              new TextRun({
                text: "─".repeat(80),
                size: 24,
                color: "CCCCCC",
              }),
            ],
            spacing: { before: 600, after: 300 },
          }),

          new Paragraph({
            text: "Disclaimer",
            heading: HeadingLevel.HEADING_2,
            spacing: { after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "This document provides general information about intellectual property registration in Australia. It is not legal advice. For specific guidance on your situation, consult a registered patent attorney, trademark attorney, or IP lawyer.",
                size: 22,
                italics: true,
              }),
            ],
            spacing: { after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Fees and procedures may change. Always verify current information with the relevant government body before submitting applications.",
                size: 22,
                italics: true,
              }),
            ],
            spacing: { after: 400 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "─".repeat(80),
                size: 24,
                color: "CCCCCC",
              }),
            ],
            spacing: { after: 300 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Prepared for CGT Brain AI / Tax Simple Australia",
                size: 24,
                bold: true,
              }),
            ],
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "Document Version 1.0 | January 2026",
                size: 22,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "For the latest information, always check the official websites:",
                size: 22,
                italics: true,
              }),
            ],
            alignment: AlignmentType.CENTER,
          }),
          createParagraphWithLinks(
            [
              { text: "IP Australia: " },
              {
                text: "https://www.ipaustralia.gov.au",
                link: "https://www.ipaustralia.gov.au",
              },
            ],
            { alignment: AlignmentType.CENTER }
          ),
          createParagraphWithLinks(
            [
              { text: "ASIC: " },
              {
                text: "https://www.asic.gov.au",
                link: "https://www.asic.gov.au",
              },
            ],
            { alignment: AlignmentType.CENTER }
          ),
          createParagraphWithLinks(
            [
              { text: "Attorney-General's Department: " },
              {
                text: "https://www.ag.gov.au",
                link: "https://www.ag.gov.au",
              },
            ],
            { alignment: AlignmentType.CENTER }
          ),
        ],
      },
    ],
  });

  // Generate the document
  const buffer = await Packer.toBuffer(doc);

  // Write to file
  const outputPath = path.join(
    __dirname,
    "..",
    "public",
    "CGT_BRAIN_AI_IP_REGISTRATION_GUIDE_AUSTRALIA.docx"
  );
  fs.writeFileSync(outputPath, buffer);

  console.log(`Document created successfully at: ${outputPath}`);
}

generateDocument().catch(console.error);
