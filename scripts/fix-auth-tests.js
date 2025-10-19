/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

const files = [
  'e2e/member-island-selection.spec.ts',
  'e2e/member-many-boats-visibility.spec.ts',
  'e2e/member-reservation-daily-limit.spec.ts',
  'e2e/member-reservation-happy-path.spec.ts',
  'e2e/member-reservation-list-cancel.spec.ts',
  'e2e/member-sauna-display.spec.ts',
  'e2e/reservation-cancellation.spec.ts',
  'e2e/sauna-heating-status-communication.spec.ts',
  'e2e/shared-reservation.spec.ts',
];

files.forEach((file) => {
  const filePath = path.join(process.cwd(), file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Pattern 1: goto + waitForURL on next line
  content = content.replace(
    /(\s+)await page\.goto\(`\/auth\?secret=\$\{clubSecret\}`\);\n\s+await page\.waitForURL\(\/\\\/islands\/,\s*\{\s*timeout:\s*\d+\s*\}\);/g,
    '$1await authenticateMember(page, clubSecret);'
  );

  // Pattern 2: goto + waitForLoadState
  content = content.replace(
    /(\s+)await page\.goto\(`\/auth\?secret=\$\{clubSecret\}`\);\n\s+await page\.waitForLoadState\(['"]networkidle['"]\);/g,
    '$1await authenticateMember(page, clubSecret);'
  );

  // Pattern 3: just goto (will need manual follow-up)
  content = content.replace(
    /(\s+)await page\.goto\(`\/auth\?secret=\$\{clubSecret\}`\);(?!\n\s+await page\.waitFor)/g,
    '$1await authenticateMember(page, clubSecret);'
  );

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Fixed: ${file}`);
});

console.log('Done!');
