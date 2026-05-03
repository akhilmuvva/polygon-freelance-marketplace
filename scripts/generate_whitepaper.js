const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, VerticalAlign, PageBreak, PageNumberElement, LevelFormat,
  TabStopType, TabStopPosition, ExternalHyperlink
} = require('docx');
const fs = require('fs');
const path = require('path');

// Colors
const PURPLE = "6B21A8";
const LIGHT_PURPLE = "F3E8FF";
const DARK = "1E1B4B";
const MID_PURPLE = "7C3AED";
const GRAY_BG = "F8F7FF";
const LIGHT_GRAY = "E5E7EB";
const WHITE = "FFFFFF";
const ACCENT = "8B5CF6";

const border = { style: BorderStyle.SINGLE, size: 1, color: "D8B4FE" };
const borders = { top: border, bottom: border, left: border, right: border };
const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };

function h1(text) {
  return new Paragraph({
    text: text,
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 200 },
    alignment: AlignmentType.LEFT,
    border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: PURPLE } },
  });
}

function h2(text) {
  return new Paragraph({
    text: text,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 150 },
    color: MID_PURPLE,
  });
}

function p(text) {
  return new Paragraph({
    children: [new TextRun({ text: text, size: 24, font: "Inter" })],
    spacing: { before: 120, after: 120 },
    alignment: AlignmentType.JUSTIFIED,
  });
}

function li(text) {
  return new Paragraph({
    children: [new TextRun({ text: "• " + text, size: 24, font: "Inter" })],
    spacing: { before: 60, after: 60 },
    indent: { left: 720 },
  });
}

// Main White Paper Generation
const doc = new Document({
  sections: [{
    properties: {},
    children: [
      // Title Page
      new Paragraph({
        children: [
          new TextRun({
            text: "POLYLANCE ZENITH",
            bold: true,
            size: 80,
            color: PURPLE,
            font: "Montserrat",
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: 2400 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: "Technical White Paper v2.5.0",
            size: 32,
            color: DARK,
            font: "Inter",
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 1200 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: "Decentralized Freelance Protocol on Polygon",
            size: 28,
            italics: true,
            color: MID_PURPLE,
            font: "Inter",
          }),
        ],
        alignment: AlignmentType.CENTER,
      }),
      new PageBreak(),

      // Abstract
      h1("1. Abstract"),
      p("PolyLance Zenith is an institutional-grade decentralized freelance protocol built on Polygon. It leverages Account Abstraction (ERC-4337), yield-aggregating escrow mechanisms, and Real World Asset (RWA) tokenization to eliminate the high fees and trust barriers prevalent in the $5.4T global gig economy. By anchoring identity to Soulbound Tokens (SBT) and utilizing decentralized arbitration, PolyLance achieves Absolute Zero Gravity in value transfer—removing all intermediaries between talent and capital."),

      h1("2. Protocol Architecture"),
      h2("2.1 Core Smart Contracts"),
      p("The protocol is architected using the UUPS (Universal Upgradeable Proxy Standard) pattern to ensure long-term stability and security without disrupting user operations. The core logic is distributed across three primary layers:"),
      li("Identity Layer: FreelancerReputation.sol manages skills and XP via Soulbound Tokens."),
      li("Escrow Layer: FreelanceEscrow.sol handles trustless milestone payments and yield generation."),
      li("Governance Layer: ZenithCourt.sol provides decentralized dispute resolution via white-listed adjudicators."),

      h2("2.2 Gasless Onboarding"),
      p("Utilizing the Biconomy SDK, PolyLance sponsorships eliminate the need for freelancers to hold native MATIC tokens for initial interactions. Account Abstraction enables social login (Email/Twitter) via Particle Auth, creating a seamless Web2-to-Web3 bridge."),

      h1("3. DeFi & RWA Mechanics"),
      h2("3.1 Yield-Bearing Escrow"),
      p("Unlike centralized platforms that sit on user funds, PolyLance deposits escrowed capital into yield-aggregating vaults. Accrued interest is distributed back to the protocol treasury or used to offset platform fees, effectively creating a 'zero-fee' environment for high-volume users."),

      h2("3.2 Invoice Tokenization (RWA)"),
      p("The PolyLance RWA module allows freelancers to tokenized their pending invoices. These tokens represent a legal claim to future contract payments and can be sold on the internal liquidity market for immediate working capital, enabling 'Gig-Fi' (Freelance Finance)."),

      h1("4. Tokenomics ($POLY)"),
      p("The native $POLY token serves three critical functions:"),
      li("Governance: Quadratic voting for protocol parameters and court adjudicator selection."),
      li("Staking: Required for specialists to bid on 'Zenith Tier' institutional contracts."),
      li("Incentives: Rewards for high-resonance job completion and successful dispute adjudication."),

      h1("5. Roadmap & Security"),
      p("PolyLance is currently in Phase 3: Zenith Sovereign. Upcoming milestones include:"),
      li("Q3 2025: Polygon Mainnet Public Launch."),
      li("Q4 2025: Cross-chain expansion via LayerZero (Solana Anchor Integration)."),
      li("Q1 2026: Fully autonomous AI Arbitration (Zenith Oracle)."),

      new Paragraph({
        children: [
          new TextRun({
            text: "Copyright © 2026 PolyLance Protocol. All Rights Reserved.",
            size: 20,
            color: "888888",
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: 2400 },
      }),
    ],
  }],
});

Packer.toBuffer(doc).then((buffer) => {
  const filePath = path.join(__dirname, '..', 'docs', 'PolyLance_White_Paper_v2.5.0.docx');
  fs.writeFileSync(filePath, buffer);
  console.log(`White Paper generated at: ${filePath}`);
});
