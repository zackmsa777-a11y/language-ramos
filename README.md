# Ramos syntax grammar

TextMate-compatible highlighting for Ramos 0.15, with scope `source.ramos`
and extension `.ramos`. The grammar, editor configuration and newly authored
line-statistics tool in this repository are MIT licensed.

## VS Code

Download `language-ramos.vsix` from Releases. Run **Extensions: Install from
VSIX...** and select the file, or use `code --install-extension language-ramos.vsix`.
This registers Ramos locally in VS Code and highlights comments, literals,
keywords, types, function declarations/calls, native intrinsics and operators.
It provides comment toggling and matching parentheses/braces. It is a syntax
extension; compilation uses the native Ramos compiler separately.

Develop or package it with `npm ci`, `npm test`, and `npm run package`.

## GitHub Linguist

This is the grammar source for the proposed Ramos Linguist integration:

```sh
script/add-grammar https://github.com/zackmsa777-a11y/language-ramos
```

Publishing this grammar does not register Ramos on GitHub.com. Upstream Linguist
requires a language entry, samples, tests, and sufficient independent public
usage before acceptance; its deployed registry controls GitHub's language label.
See [Ramos recognition status](https://github.com/zackmsa777-a11y/ramos/blob/main/docs/github-language.md).

## Runnable sample

`examples/line-stats.ramos` is a stdin statistics tool that counts lines, blank
lines, payload bytes (excluding line terminators), and the longest line.
It handles read errors and a final unterminated line. Build with Ramos 0.9:

```sh
ramos build examples/line-stats.ramos -o line-stats
./line-stats < input.txt
```

On Windows, build with `ramos.exe` and use `-o line-stats.exe`. Interactive input
and redirected files use the same native API. This sample is intended for
Linguist's `samples/Ramos/` directory and remains available under MIT here.
