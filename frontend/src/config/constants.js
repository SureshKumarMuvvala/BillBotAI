/**
 * src/config/constants.js
 * All app-wide constants — single source of truth.
 * API base URL is read from Vite env at build time; falls back to localhost.
 */

export const API_BASE_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, '') ?? 'http://localhost:8000';

export const APP_VERSION = '3.1.0';

// ── Pipeline step definitions ─────────────────────────────────────────────────
export const PIPELINE_STEPS = [
  {
    key: 'upload',
    name: 'Upload File',
    idleDescription: 'Awaiting invoice payload transfer to backend...',
  },
  {
    key: 'convert',
    name: 'Convert OCR',
    idleDescription: 'Awaiting Chandra layout-aware tokenization...',
  },
  {
    key: 'extract',
    name: 'Extract Structured Data',
    idleDescription: 'Awaiting schema parser extraction mapping...',
  },
  {
    key: 'preview',
    name: 'Build Preview',
    idleDescription: 'Awaiting layout preview matrix construction...',
  },
  {
    key: 'excel',
    name: 'Generate Excel',
    idleDescription: 'Awaiting openpyxl compiled Workbook generation...',
  },
];

/**
 * Build initial step state array — always call this instead of mutating
 * PIPELINE_STEPS directly so every reset starts from a clean object.
 */
export const makeInitialSteps = () =>
  PIPELINE_STEPS.map(({ key, name, idleDescription }) => ({
    key,
    name,
    status: 'idle',
    duration: 0,
    description: idleDescription,
  }));

// ── SSE retry config ──────────────────────────────────────────────────────────
export const SSE_MAX_RETRIES   = 3;
export const SSE_BASE_DELAY_MS = 1_000; // doubles each retry

// ── Demo mode sentinel ────────────────────────────────────────────────────────
export const DEMO_FILE_NAME = 'sample_pharmacy_invoice.pdf';
export const DEMO_FILE_SIZE = 1_048_576; // 1 MB

// ── GRN result table column schema ───────────────────────────────────────────
export const RESULT_COLUMNS = [
  { key: 'medicine_name',    label: 'Item Name',    width: 'min-w-[180px]', align: 'left'   },
  { key: 'batch_no',         label: 'Batch No',     width: 'min-w-[90px]',  align: 'left'   },
  { key: 'expiry_date',      label: 'Expiry Date',  width: 'min-w-[85px]',  align: 'center' },
  { key: 'pack',             label: 'Pack',         width: 'min-w-[75px]',  align: 'center' },
  { key: 'quantity',         label: 'Qty',          width: 'min-w-[55px]',  align: 'right'  },
  { key: 'free_quantity',    label: 'Free Qty',     width: 'min-w-[60px]',  align: 'right'  },
  { key: 'mrp',              label: 'MRP(₹)',       width: 'min-w-[72px]',  align: 'right'  },
  { key: 'rate',             label: 'Rate(₹)',      width: 'min-w-[72px]',  align: 'right'  },
  { key: 'mrp_per_tab',      label: 'MRP(PerTab)',  width: 'min-w-[80px]',  align: 'right'  },
  { key: 'rate_per_tab',     label: 'Rate(PerTab)', width: 'min-w-[82px]',  align: 'right'  },
  { key: 'discount_percent', label: 'Discount(%)',  width: 'min-w-[78px]',  align: 'right'  },
  { key: 'gst_percent',      label: 'Tax(%)',       width: 'min-w-[58px]',  align: 'right'  },
  { key: 'tax_amount',       label: 'Tax(₹)',       width: 'min-w-[68px]',  align: 'right'  },
  { key: 'amount',           label: 'Amount(₹)',    width: 'min-w-[82px]',  align: 'right'  },
  { key: 'barcode',          label: 'Barcode',      width: 'min-w-[120px]', align: 'left'   },
  { key: 'hsn_code',         label: 'HSN Code',     width: 'min-w-[80px]',  align: 'left'   },
];

// Keys where the footer shows column sums
export const TOTAL_KEYS = new Set(['quantity', 'free_quantity', 'tax_amount', 'amount']);

// Keys rendered with 2 decimal places
export const DECIMAL_KEYS = new Set(['mrp', 'rate', 'mrp_per_tab', 'rate_per_tab', 'tax_amount', 'amount']);

