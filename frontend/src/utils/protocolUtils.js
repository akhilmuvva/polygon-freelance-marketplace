/**
 * ProtocolUtils: Sanitizes strings and values for safe BigInt conversion.
 * Prevents "Blank Screen" crashes caused by malformed subgraph strings.
 */

export const parseProtocolValue = (val) => {
  if (val === null || val === undefined) return 0n;
  if (typeof val === 'bigint') return val;
  
  try {
    const str = String(val).trim();
    // Strip everything except numbers and the first decimal point (though BigInt only wants integers)
    // Most of our data comes as Wei strings "000000000000000"
    const numericOnly = str.split(' ')[0].replace(/,/g, '').split('.')[0];
    return BigInt(numericOnly || '0');
  } catch (e) {
    console.warn('[PROTOCOL] Failed to parse value:', val);
    return 0n;
  }
};
