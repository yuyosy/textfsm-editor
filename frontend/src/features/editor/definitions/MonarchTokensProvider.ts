import type * as monaco from 'monaco-editor';

export const monarchTokensProvider:
  | monaco.languages.IMonarchLanguage
  | monaco.Thenable<monaco.languages.IMonarchLanguage> = {
  defaultToken: '',
  escapes: /\\(?:[dDwWsStrnvfb0*+.?(){}[\]^$\-|/\\])/,
  valueOptions: ['Required', 'Fillup', 'Filldown', 'Key', 'List'],
  lineActions: ['Next', 'Continue', 'Error'],
  recordActions: ['NoRecord', 'Record', 'Clear', 'Clearall'],
  tokenizer: {
    root: [
      { include: '@whitespace' },
      { include: '@value' },
      { include: '@stete_definition' },
      // { include: '@state_definitions'}
    ],
    // value: [
    //     [/^(Value)/, 'value-definition', '@definition'],
    //     [/\(.+\)$/, 'regex'],
    // ],
    // definition: [
    //     [/^|$/, '', '@pop'],
    //     [/[\w]+/, {
    //         cases: {
    //             '@valueOptions': 'value-option',
    //             '@default': {
    //                 token: '@rematch',
    //                 next: '@pop'
    //             }
    //         }
    //     }],
    // ],
    whitespace: [
      [/^\s*[#].*$/, 'comment'],
      [/[\s\t\r\n]+/, ''],
    ],
    stete_definition: [
      [/@escapes/, 'string.escape'],
      [/\$\{\w+\}/, 'variable'],
      [
        /\w+/,
        {
          cases: {
            '@lineActions': 'line-action',
            '@recordActions': 'record-action',
            '@default': '',
          },
        },
      ],
    ],

    value: [
      [/^(Value)/, 'value-definition', '@definition'],
      [/\(.+\)$/, 'regex'],
    ],
    definition: [
      [/^|$/, '', '@pop'],
      [
        /[\w]+/,
        {
          cases: {
            '@valueOptions': 'value-option',
            '@default': {
              token: '@rematch',
              next: '@pop',
            },
          },
        },
      ],
    ],
    // state_definitions: [
    //     [/^\s+\^/, 'variable'],
    // ],
    // line_content: [
    //     [/\d+/, { token: 'number', log: 'found number $0 in state $S0' } ],
    //     [/\$\{\w+\}/, 'variable'],
    //     [/$/, '', '@pop'],
    // ],
    // string_backtick: [
    // 	[/\$\{/, { token: 'delimiter.bracket', next: '@bracketCounting' }],
    // 	[/[^\\$]+/, 'string'],
    // 	[/@escapes/, 'string.escape'],
    // 	[/\\./, 'string.escape.invalid'],
    // 	[/}/, 'string', '@pop']
    // ],
    // bracketCounting: [
    // 	[/\{/, 'delimiter.bracket', '@bracketCounting'],
    // 	[/\}/, 'delimiter.bracket', '@pop'],
    // 	{ include: 'common' }
    // ],
    // string: [
    // 	[/@escapes/, 'string.escape'],
    // ],
    // root: [
    //     {\*
    //         include: '@whitespace'
    //     },
    //     {
    //         include: '@comment'
    //     },
    //     {
    //         include: '@value'
    //     },
    //     {
    //         include: '@state'
    //     },
    //     {
    //         include: '@variables'
    //     },
    //     {
    //         include: '@action'
    //     },
    // ],
    // whitespace: [
    //     [/\s+/, { cases: { '@eos': { token: '', next: '@pop' }, '@default': '' } }]
    // ],
    // comment: [
    //     [/(^\s*#.*$)/, 'comment']
    // ],
    // value: [
    //     [/^(Value)/, 'value-definition', '@definition'],
    //     [/\(.+\)$/, 'regex'],
    // ],
    // definition: [
    //     [/^|$/, '', '@pop'],
    //     [/[\w]+/, {
    //         cases: {
    //             '@valueOptions': 'value-option',
    //             '@default': {
    //                 token: '@rematch',
    //                 next: '@pop'
    //             }
    //         }
    //     }],

    // ],
    // state: [
    //     [/^\w+$/, 'state']
    // ],
    // action: [
    //     [/^|$/, '', '@pop'],
    //     // [/[\s]+/, ''],
    //     [/[\w]+/, {
    //         cases: {
    //             '@lineActions': 'line-action',
    //             '@recordActions': 'record-action',
    //             '@default': '',
    //         }
    //     }],
    // ],
    // variables: [
    //     [/\$\{/, 'variable-brackets', '@variableBody'],
    // ],
    // variableBody: [
    //     [/[\w]+/, 'variable'],
    //     [/[}]/, 'variable-brackets', '@pop']
    // ],
  },
};
