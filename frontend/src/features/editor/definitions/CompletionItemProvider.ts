import * as monaco from 'monaco-editor';

export const getCompletionItemProviderSuggestions = (
  model: monaco.editor.ITextModel,
  position: monaco.Position,
) => {
  const word = model.getWordUntilPosition(position);
  const range = {
    startLineNumber: position.lineNumber,
    endLineNumber: position.lineNumber,
    startColumn: word.startColumn,
    endColumn: word.endColumn,
  };
  return [
    {
      label: 'Value definition',
      detail: 'Value [option[,option...]] name regex',
      documentation:
        'One or more "Value" lines are used to describe each column that will be in the resulting table. These Value lines must all appear before any state definitions and must be contiguous lines, separated only by comments.',
      kind: monaco.languages.CompletionItemKind.Value,
      insertText: 'Value ${1:variable} (${2:regex})',
      insertTextRules:
        monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      range: range,
    },
    {
      label: 'Required',
      detail: 'Value Required[,option...] name regex',
      documentation:
        '[Value option] The record (row) is only saved into the table if this value is matched.',
      kind: monaco.languages.CompletionItemKind.Property,
      insertText: 'Required',
      range: range,
    },
    {
      label: 'Filldown',
      detail: 'Value Filldown[,option...] name regex',
      documentation:
        '[Value option] The previously matched value is retained for subsequent records (unless explicitly cleared or matched again). In other words, the most recently matched value is copied to newer rows unless matched again.',
      kind: monaco.languages.CompletionItemKind.Property,
      insertText: 'Filldown',
      range: range,
    },
    {
      label: 'Fillup',
      detail: 'Value Fillup[,option...] name regex',
      documentation:
        '[Value option] Like Filldown, but populates upwards until it finds a non-empty entry. Not compatible with Required.',
      kind: monaco.languages.CompletionItemKind.Property,
      insertText: 'Fillup',
      range: range,
    },
    {
      label: 'List',
      detail: 'Value List[,option...] name regex',
      documentation:
        '[Value option] The value is a list, appended to on each match. Normally a match will overwrite any previous value in that row.',
      kind: monaco.languages.CompletionItemKind.Property,
      insertText: 'List',
      range: range,
    },
    {
      label: 'Key',
      detail: 'Value Key[,option...] name regex',
      documentation:
        '[Value option] Declares that the fields contents contribute to the unique identifier for a row.',
      kind: monaco.languages.CompletionItemKind.Property,
      insertText: 'Key',
      range: range,
    },
    {
      label: 'State Rule',
      detail: '^regex [-> [line action][.][record action] [transition]]',
      documentation:
        'Each state definition consists of a list of one or more rules. The FSM reads a line from the input buffer and tests it against each rule, in turn, starting from the top of the current state. If a rule matches the line, then the action is carried out and the process repeats (from the top of the state again) with the next line.',
      kind: monaco.languages.CompletionItemKind.Value,
      insertText: '^${1:regex} -> ${2:action}',
      insertTextRules:
        monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      range: range,
    },
    {
      label: 'Start',
      documentation:
        '[Reserved state] The FSM starts in state Start, so this label is mandatory and the template will not parse without it.',
      kind: monaco.languages.CompletionItemKind.Event,
      insertText: 'Start',
      range: range,
    },
    {
      label: 'EOF',
      documentation:
        '[Reserved state] If EOF was reached on the input then the EOF state is executed.',
      kind: monaco.languages.CompletionItemKind.Event,
      insertText: 'EOF',
      range: range,
    },
    {
      label: '${variable}',
      documentation:
        'Value descriptors are in the format ${ValueName} and indicate value assignment.',
      kind: monaco.languages.CompletionItemKind.Variable,
      insertText: '${${1:variable}}',
      insertTextRules:
        monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      range: range,
    },
    {
      label: '->',
      detail: '^regex -> [action|transition]',
      documentation:
        'Following a regexp, actions may be described, delimited by "->".',
      kind: monaco.languages.CompletionItemKind.Operator,
      insertText: '->',
      range: range,
    },
    {
      label: 'Next',
      detail: '^regex -> Next[.action] [transition]',
      documentation:
        '[Line Action] Finish with the input line, read in the next and start matching again from the start of the state. This is the default behavior if no line action is specified.',
      kind: monaco.languages.CompletionItemKind.Function,
      insertText: 'Next',
      range: range,
    },
    {
      label: 'Continue',
      detail: '^regex -> Continue[.action] [transition]',
      documentation:
        '[Line Action] Retain the current line and do not resume matching from the first rule of the state. Continue processing rules as if a match did not occur (value assignments still occur).',
      kind: monaco.languages.CompletionItemKind.Function,
      insertText: 'Continue',
      range: range,
    },
    {
      label: 'NoRecord',
      detail: '^regex -> [action][.]NoRecord [transition]',
      documentation:
        '[Record Action] Do nothing. This is the default behavior if no record action is specified.',
      kind: monaco.languages.CompletionItemKind.Method,
      insertText: 'NoRecord',
      range: range,
    },
    {
      label: 'Record',
      detail: '^regex -> [action][.]Record [transition]',
      documentation:
        '[Record Action] Record the values collected so far as a row in the return data. Non Filldown values are cleared. Note: No record will be output if there are any "Required" values that are unassigned.',
      kind: monaco.languages.CompletionItemKind.Method,
      insertText: 'Record',
      range: range,
    },
    {
      label: 'Clear',
      detail: '^regex -> [action][.]Clear [transition]',
      documentation: '[Record Action] Clear non Filldown values.',
      kind: monaco.languages.CompletionItemKind.Method,
      insertText: 'Clear',
      range: range,
    },
    {
      label: 'Clearall',
      detail: '^regex -> [action][.]Clearall [transition]',
      documentation: '[Record Action] Clear all values.',
      kind: monaco.languages.CompletionItemKind.Method,
      insertText: 'Clearall',
      range: range,
    },
    {
      label: 'Error',
      detail: '^regex -> Error [word|string]',
      documentation:
        '[Error Action] There is a special action "Error". This action will terminate all processing and will not return the table, discarding all rows collected so far, and raises an exception.',
      kind: monaco.languages.CompletionItemKind.Event,
      insertText: 'Error',
      range: range,
    },
  ];
};
