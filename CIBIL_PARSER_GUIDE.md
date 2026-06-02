# CIBIL Parser Technical Documentation

This document outlines the technical implementation and regex patterns used in the refined CIBIL parser within `analyzer.js`.

## 1. Bank Name Normalization
To prevent misidentification (e.g., IndusInd being tagged as ICICI), a high-priority normalization function is used.

### Implementation:
- **Exact Match Priority**: Explicitly checks for keywords like `INDUSIND`, `ICICI`, `IDFC`, `HDFC`, `AXIS`, etc., before using regex.
- **Pattern Registry**: Falls back to `LENDER_PATTERNS` for smaller or regional banks.
- **Cleaning**: Removes whitespace and standardizes case before matching.

## 2. Summary Table Parsing
The parser uses a hybrid approach to handle complex tabular layouts in CIBIL text.

### Loan & Credit Card Summary:
- **Section Isolation**: Finds `SUMMARY: LOAN ACCOUNTS` and `SUMMARY: CREDIT CARDS` sections.
- **Line-by-Line Processing**: Splits the section into lines and uses a `row-joining` logic.
- **Row Joining**: If a line contains only a bank name and the next line starts with a loan type (e.g., "Personal Loan"), it joins them to form a single valid row.
- **Strict Regex**: Uses a 12-column regex to extract:
  - Lender Name
  - Account Type
  - Account Number (Masked/Unmasked)
  - Ownership Status
  - Dates (Opened, Last Updated)
  - Amounts (Sanctioned, Outstanding, Overdue, EMI)

## 3. Credit Enquiry Extraction
Enquiries are often compressed or split across pages.

### Global Regex Approach:
- **Pattern**: `(\d{1,3})\s{2,}([A-Z][a-zA-Z\s]{2,40}?)\s{2,}([A-Z][A-Z0-9 &.'-]{2,60}?)\s{2,}(\d{2}[-\/]\d{2}[-\/]\d{4})`
- **Filtering**: Specifically excludes report headers, ECN numbers, and "Table of Contents" noise by checking the "Member" and "Purpose" fields against a blacklist.
- **Multi-row Support**: The regex is designed to find multiple occurrences within a single block of text even if newline characters are inconsistent.

## 4. Personal Information
Extracts key identity markers from the report header and contact sections.

- **Name**: Supports "Hello, [Name]" and "Hey [Name]" patterns.
- **Mobile**: Scans for 10-digit Indian mobile numbers (starting with 6-9) associated with "Mobile" or "Phone" labels.
- **PAN**: Validates standard Indian PAN format `[A-Z]{5}[0-9]{4}[A-Z]`.
- **DOB**: Extracts dates associated with "Date of Birth" or "DOB" labels.

## 5. DPD & Payment History
Handles the "Payment History" grid which is often horizontal and separated by years.

- **Year-based Segmentation**: Segments the history by year (e.g., 2026, 2025).
- **Horizontal Mapping**: Maps month headers (JAN, FEB, etc.) to values (0, STD, XXX, or DPD days).
- **Secondary Extraction**: If the standard grid regex fails, a secondary logic extracts all months and all status codes separately and aligns them based on their relative order.

## 6. Account Merging
Combines data from "Summary" and "Details" sections using a composite key:
- **Key**: `Normalize(Lender) + Normalize(AccountNo)`
- This prevents collisions where two different banks have the same masked account number (e.g., both ending in `XXXX1234`).
