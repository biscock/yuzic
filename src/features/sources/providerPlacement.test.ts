import fs from 'fs';
import path from 'path';
import ts from 'typescript';

/** Check the actual route composition: screen tests usually mock navigation
 * hooks and cannot catch a player rendered beside its context provider. */
function elements(relativePath: string) {
  const file = path.resolve(__dirname, '../../app', relativePath);
  const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const found: { name: string; ancestors: string[] }[] = [];
  function visit(node: ts.Node, ancestors: string[]) {
    if (ts.isJsxElement(node)) {
      const name = node.openingElement.tagName.getText(source);
      found.push({ name, ancestors });
      node.children.forEach(child => visit(child, [...ancestors, name]));
    } else if (ts.isJsxSelfClosingElement(node)) {
      found.push({ name: node.tagName.getText(source), ancestors });
    } else {
      ts.forEachChild(node, child => visit(child, ancestors));
    }
  }
  visit(source, []);
  return found;
}

it('gives the global player, song options and browsing routes one resolution provider', () => {
  const root = elements('_layout.tsx');
  const providers = root.filter(node => node.name === 'ExternalResolutionProvider');
  expect(providers).toHaveLength(1);
  // The resolution provider itself renders picker sheets.
  expect(providers[0].ancestors).toContain('BottomSheetModalProvider');
  for (const consumer of ['Stack', 'PlayerHost', 'SongActionSheetProvider']) {
    const nodes = root.filter(node => node.name === consumer);
    expect(nodes.length).toBeGreaterThan(0);
    nodes.forEach(node => expect(node.ancestors).toContain('ExternalResolutionProvider'));
  }
  expect(elements('(home)/_layout.tsx').filter(node => node.name === 'ExternalResolutionProvider')).toHaveLength(0);
});
