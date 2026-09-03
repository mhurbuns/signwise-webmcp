import type { Agreement } from "../domain/types";

export const fixtureAgreement: Agreement = {
  id: "northstar-msa-2026",
  filename: "Northstar_SaaS_Agreement.pdf",
  title: "Master Services Agreement",
  parties: ["Northstar Systems Ltd.", "Meridian Labs"],
  sender: "Northstar Systems Ltd.",
  recipient: "Malen Hurbuns · Meridian Labs",
  dueDate: "7 September 2026",
  pageCount: 12,
  fingerprint: "sha256:8f23c19de47a2b05c7f4e920a14c9e84d268c0b9",
  clauses: [
    {
      id: "services",
      number: "1",
      title: "Services",
      page: 1,
      text: "Northstar will provide hosted analytics services as described in Schedule A. Service begins on the Effective Date and continues for the Initial Term.",
    },
    {
      id: "fees",
      number: "3",
      title: "Fees and payment",
      page: 3,
      text: "Customer will pay undisputed invoices within 30 days. Fees may increase by up to five percent at each annual anniversary after written notice.",
    },
    {
      id: "renewal",
      number: "4",
      title: "Term and renewal",
      page: 4,
      text: "This Agreement automatically renews for successive 24-month terms unless Customer provides written notice at least 120 days before the end of the then-current term.",
    },
    {
      id: "indemnity",
      number: "8",
      title: "Indemnification",
      page: 8,
      text: "Customer shall defend, indemnify, and hold harmless Northstar from any and all claims, losses, expenses, and liabilities arising from use of the Services, including claims caused in whole or in part by Northstar.",
    },
    {
      id: "liability",
      number: "10",
      title: "Limitation of liability",
      page: 10,
      text: "Northstar’s aggregate liability will not exceed fees paid during the thirty days preceding the event giving rise to the claim. This limitation applies regardless of the theory of liability.",
    },
    {
      id: "signatures",
      number: "12",
      title: "Signatures",
      page: 12,
      text: "Each signatory represents that they are authorized to bind the named party. Electronic counterparts are treated as originals.",
    },
  ],
};
