/**
 * Report Generator
 * Single Responsibility: Generate migration reports
 */

/**
 * Generate a comprehensive migration report
 * @param {Object[]} tests - Array of migrated test info
 * @param {string} projectName - Project name
 * @returns {string} Markdown report
 */
export function generateMigrationReport(tests, projectName = 'Test Migration') {
  const now = new Date().toISOString();
  const stats = calculateMigrationStats(tests);
  const tagSummary = generateTagSummary(tests);
  const fileList = generateFileList(tests);
  const testRows = generateTestRows(tests);

  return `# ${projectName} - Migration Report

**Generated:** ${now}
**Tool Version:** MCP Test Migration Server v2.1.0

---

## 📊 Migration Summary

| Metric | Count |
|--------|-------|
| Total Tests | ${stats.total} |
| Migrated | ${stats.migrated} |
| Pending | ${stats.pending} |
| Failed | ${stats.failed} |
| **Success Rate** | **${stats.successRate}%** |

---

## 🏷️ Tags Summary

${tagSummary}

---

## 📁 Files

### Migrated Files

${fileList.migrated}

### Pending Files

${fileList.pending}

### Failed Files

${fileList.failed}

---

## 📋 Detailed Test List

| Original File | Migrated File | Status | Tags |
|--------------|---------------|--------|------|
${testRows}

---

## 🔧 Next Steps

1. Review migrated tests for any manual adjustments
2. Run tests: \`npx playwright test\`
3. Run specific tags: \`npx playwright test --grep @smoke\`
4. View report: \`npx playwright show-report\`

---

## 📚 Resources

- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Playwright Test Annotations](https://playwright.dev/docs/test-annotations)
- [Playwright Locators](https://playwright.dev/docs/locators)
`;
}

function calculateMigrationStats(tests) {
  const total = tests.length;
  const migrated = tests.filter(t => t.status === 'migrated' || t.status === 'success').length;
  const pending = tests.filter(t => t.status === 'pending' || !t.status).length;
  const failed = tests.filter(t => t.status === 'failed' || t.status === 'error').length;
  const successRate = total > 0 ? Math.round((migrated / total) * 100) : 0;

  return { total, migrated, pending, failed, successRate };
}

function generateTagSummary(tests) {
  const tagCounts = {};
  
  tests.forEach(test => {
    (test.tags || []).forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });

  if (Object.keys(tagCounts).length === 0) {
    return '_No tags found in tests_';
  }

  const sortedTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);

  return `| Tag | Count | Playwright Command |
|-----|-------|-------------------|
${sortedTags.map(([tag, count]) => `| \`@${tag}\` | ${count} | \`npx playwright test --grep @${tag}\` |`).join('\n')}`;
}

function generateFileList(tests) {
  const migrated = tests
    .filter(t => t.status === 'migrated' || t.status === 'success')
    .map(t => `- ✅ ${t.migratedPath || t.originalPath}`)
    .join('\n') || '_None_';

  const pending = tests
    .filter(t => t.status === 'pending' || !t.status)
    .map(t => `- ⏳ ${t.originalPath}`)
    .join('\n') || '_None_';

  const failed = tests
    .filter(t => t.status === 'failed' || t.status === 'error')
    .map(t => `- ❌ ${t.originalPath}: ${t.error || 'Unknown error'}`)
    .join('\n') || '_None_';

  return { migrated, pending, failed };
}

function generateTestRows(tests) {
  return tests.map(t => {
    const tags = (t.tags || []).map(tag => '`@' + tag + '`').join(', ') || '-';
    return `| ${t.originalPath || '-'} | ${t.migratedPath || '-'} | ${t.status || 'pending'} | ${tags} |`;
  }).join('\n');
}
