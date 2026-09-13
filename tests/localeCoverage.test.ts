import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const root = path.resolve(import.meta.dirname, '..');
const catalogs = ['ckb', 'ar'].map(locale => JSON.parse(fs.readFileSync(path.join(root, `src/locales/${locale}.json`), 'utf8')) as Record<string, string>);
function files(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? files(path.join(dir, entry.name)) : /\.tsx?$/.test(entry.name) ? [path.join(dir, entry.name)] : []);
}

test('active UI translation calls, source descriptions and AI errors have both catalogs', () => {
  const labels = new Set<string>();
  function collect(node: ts.Node) {
    if (ts.isStringLiteralLike(node)) { const text = node.text.replace(/\s+/g, ' ').trim(); if (text) labels.add(text); }
    else if (ts.isConditionalExpression(node)) { collect(node.whenTrue); collect(node.whenFalse); }
  }
  for (const file of files(path.join(root, 'src'))) {
    const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
    function visit(node: ts.Node) {
      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 't') node.arguments.forEach(collect);
      if (file.endsWith('ScientificReferencesModal.tsx') && ts.isPropertyAssignment(node) && ['title', 'body', 'label'].includes(node.name.getText(source))) collect(node.initializer);
      if (/(?:aiClient|gemini|storage)\.ts$/.test(file)) {
        if (ts.isNewExpression(node) && node.expression.getText(source) === 'Error') node.arguments?.forEach(collect);
        if (ts.isPropertyAssignment(node) && (ts.isNumericLiteral(node.name) || node.name.getText(source) === 'error')) collect(node.initializer);
      }
      ts.forEachChild(node, visit);
    }
    visit(source);
  }
  for (const catalog of catalogs) assert.deepEqual([...labels].filter(label => !catalog[label]), []);
});

test('privacy translations preserve all sections and support address', () => {
  const data = JSON.parse(fs.readFileSync(path.join(root, 'public/privacy-data.json'), 'utf8'));
  for (const locale of ['ckb', 'ar']) {
    assert.equal(data[locale].sections.length, data.en.sections.length);
    assert.ok(data[locale].title.includes('Calorie Pewar'));
    assert.ok(data[locale].updated);
    for (const section of data[locale].sections) {
      assert.deepEqual(Object.keys(section).sort(), ['body', 'heading']);
      assert.match(section.heading, /[\u0600-\u06ff]/);
      assert.match(section.body, /[\u0600-\u06ff]/);
    }
    assert.match(data[locale].sections.at(-1).body, /sahandabas2@gmail\.com/);
  }
});
