import re

from .errors import LeanParseError

# Characters that can change the lexer state at the top level of a file.
# Alternation order matters for overlapping cases: "/--" must lex as "/-" "-",
# and "--/" as "--" "/".
_TOP_LEVEL_TOKEN_REGEX = re.compile(r'"|/-|--')
# Inside a block comment only nesting delimiters matter, and "--/" must close
# the block (the "-/" starts at the second dash), so "--" is not a token here.
_BLOCK_TOKEN_REGEX = re.compile(r"/-|-/")
# Inside a string literal: an escape sequence, or the closing quote.
_STRING_TOKEN_REGEX = re.compile(r'\\.|"', re.DOTALL)
_END_OF_LINE_REGEX = re.compile(r"[\r\n]")


def strip_lean_comments(lean_contents: str) -> str:
    """
    Remove `--` line comments and (nested) `/- ... -/` block comments,
    including `/-- ... -/` and `/-! ... -/` doc comments. Comment delimiters
    inside string literals are left alone.

    This is a single linear pass. Regex searches jump between the few
    characters that can change the lexer state, so the scanning happens in C
    rather than one character at a time in Python.
    """
    out: list[str] = []
    text_len = len(lean_contents)
    keep_from = 0  # start of the text not yet copied to `out`
    pos = 0  # where the next token search starts
    depth = 0  # block comment nesting depth

    while pos < text_len:
        if depth > 0:
            match = _BLOCK_TOKEN_REGEX.search(lean_contents, pos)
            if match is None:
                break
            if match.group() == "/-":
                depth += 1
            else:
                depth -= 1
                if depth == 0:
                    keep_from = match.end()
            pos = match.end()
            continue

        match = _TOP_LEVEL_TOKEN_REGEX.search(lean_contents, pos)
        if match is None:
            break
        token = match.group()
        start = match.start()
        if token == '"':
            if _is_char_literal_quote(lean_contents, start):
                pos = start + 2
            else:
                pos = _skip_string_literal(lean_contents, match.end())
        elif token == "--":
            out.append(lean_contents[keep_from:start])
            eol = _END_OF_LINE_REGEX.search(lean_contents, start)
            pos = keep_from = text_len if eol is None else eol.start()
        else:  # "/-"
            out.append(lean_contents[keep_from:start])
            depth = 1
            pos = match.end()

    if depth > 0:
        raise LeanParseError(
            "Cannot find closing comment delimiter in " + lean_contents[keep_from:]
        )
    out.append(lean_contents[keep_from:])
    return "".join(out)


def _is_char_literal_quote(txt: str, quote_index: int) -> bool:
    "True if the quote at quote_index is the character literal '\"'"
    return (
        quote_index > 0
        and txt[quote_index - 1] == "'"
        and txt[quote_index + 1 : quote_index + 2] == "'"
    )


def _skip_string_literal(txt: str, pos: int) -> int:
    "Return the index just past the string literal whose opening quote is before pos"
    while True:
        match = _STRING_TOKEN_REGEX.search(txt, pos)
        if match is None:
            return len(txt)
        pos = match.end()
        if match.group() == '"':
            return pos
