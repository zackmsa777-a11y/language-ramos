const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const tm = require('vscode-textmate');
const onig = require('vscode-oniguruma');

async function main() {
  const wasm = fs.readFileSync(require.resolve('vscode-oniguruma/release/onig.wasm'));
  await onig.loadWASM(wasm.buffer.slice(wasm.byteOffset, wasm.byteOffset + wasm.byteLength));
  const registry = new tm.Registry({
    onigLib: Promise.resolve({ createOnigScanner: patterns => new onig.OnigScanner(patterns),
                              createOnigString: text => new onig.OnigString(text) }),
    loadGrammar: async scope => scope === 'source.ramos'
      ? tm.parseRawGrammar(fs.readFileSync(path.join(__dirname, '../syntaxes/ramos.tmLanguage.json'), 'utf8'), 'ramos.json')
      : null
  });
  const grammar = await registry.loadGrammar('source.ramos');
  let checks = 0;
  function check(line, fragment, scope, state = tm.INITIAL) {
    const result = grammar.tokenizeLine(line, state);
    const index = line.indexOf(fragment);
    assert(index >= 0, fragment);
    const token = result.tokens.find(t => t.startIndex <= index && index < t.endIndex);
    assert(token && token.scopes.includes(scope), `${line}: ${fragment}: ${JSON.stringify(token)}`);
    checks++;
    return result.ruleStack;
  }
  check('fn sum(a: int64, b: int64) -> int64 {', 'sum', 'entity.name.function.ramos');
  check('fn sum(a: int64, b: int64) -> int64 {', 'fn', 'storage.type.function.ramos');
  check('let line = read_line()', 'read_line', 'support.function.builtin.ramos');
  check('if true && !false {', 'true', 'constant.language.boolean.ramos');
  check('if true && !false {', '&&', 'keyword.operator.ramos');
  check('let count = 123', '123', 'constant.numeric.integer.decimal.ramos');
  check('fn main() { let n: int64 = 0 }', 'int64', 'storage.type.ramos');
  check('// read_line() && "text"', 'read_line', 'comment.line.double-slash.ramos');
  check('print("// read_line()")', '//', 'string.quoted.double.ramos');
  check('print("x\\n")', '\\n', 'constant.character.escape.ramos');
  check('print("x\\q")', '\\q', 'invalid.illegal.escape.ramos');
  const state = check('/* first line', 'first', 'comment.block.ramos');
  check('read_line() */ print(1)', 'read_line', 'comment.block.ramos', state);
  check('/* first /* inner */ print(1)', 'print', 'support.function.builtin.ramos');
  check('combine(a, b)', 'combine', 'entity.name.function.call.ramos');
  check('int_to_text(-9223372036854775808)', 'int_to_text', 'support.function.builtin.ramos');
  check('for i in -2..n {', 'for', 'keyword.control.ramos');
  check('for i in -2..n {', 'in', 'keyword.control.ramos');
  check('for i in -2..n {', '..', 'keyword.operator.ramos');
  check('n += 2', '+=', 'keyword.operator.ramos');
  check('n -= 2', '-=', 'keyword.operator.ramos');
  check('weave "stdlib/gui.ramos"', 'weave', 'keyword.control.ramos');
  check('struct Point { x: int64 }', 'struct', 'keyword.control.ramos');
  check('fn greet() -> string {', 'string', 'storage.type.ramos');
  check('let title = s"Hello"', 's"', 'string.quoted.double.ramos');
  check('array(int64, 2, 0)', 'array', 'support.function.builtin.ramos');
  check('collect()', 'collect', 'support.function.builtin.ramos');
  for (const name of ['cwd', 'env_get', 'dir_open', 'dir_next', 'dir_kind', 'dir_close', 'dir_create', '_process_run', '_run_file']) {
    check(name + '()', name, 'support.function.builtin.ramos');
  }
  check('file_close(handle)', 'file_close', 'support.function.builtin.ramos');
  // An invalid unterminated string must not consume later source lines.
  const badString = grammar.tokenizeLine('print("unterminated', tm.INITIAL).ruleStack;
  check('return false', 'return', 'keyword.control.ramos', badString);
  // Tokenize a real runnable sample, exercising line-state transitions end to end.
  let sampleState = tm.INITIAL;
  for (const line of fs.readFileSync(path.join(__dirname, '../examples/line-stats.ramos'), 'utf8').split('\n')) {
    const result = grammar.tokenizeLine(line, sampleState);
    assert(result.tokens.every(t => t.scopes[0] === 'source.ramos'));
    sampleState = result.ruleStack;
  }
  registry.dispose();
  console.log(`${checks} scope assertions and runnable sample tokenization passed.`);
}
main().catch(error => { console.error(error); process.exitCode = 1; });
