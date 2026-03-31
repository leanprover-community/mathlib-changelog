import re
from .errors import LeanParseError


def strip_lean_comments(lean_contents: str) -> str:
    processed = strip_nested_block_comment(lean_contents)
    return re.sub(r"\-\-[^\n\r]*", "", processed, flags=re.MULTILINE)


DELIM_L = "/-"
DELIM_R = "-/"
LINE_DELIM = "--"


def _find_outside_strings(txt: str, target: str) -> int:
    """Find the first occurrence of target not inside a string literal.

    Returns -1 if not found.
    """
    i = 0
    n = len(txt)
    target_len = len(target)
    while i <= n - target_len:
        if txt[i] == '"':
            i += 1
            while i < n:
                if txt[i] == "\\" and i + 1 < n:
                    i += 2
                elif txt[i] == '"':
                    i += 1
                    break
                else:
                    i += 1
            continue
        if txt[i : i + target_len] == target:
            return i
        i += 1
    return -1


def has_nested_comment(txt_in_block: str) -> bool:
    if DELIM_L not in txt_in_block:
        return False
    # this shouldn't happen - we should always have a DELIM_R if we're in a block
    if DELIM_R not in txt_in_block:
        return True
    next_delim_l_index = txt_in_block.index(DELIM_L)
    next_delim_r_index = txt_in_block.index(DELIM_R)
    return next_delim_l_index < next_delim_r_index


# loosely based on https://www.rosettacode.org/wiki/Strip_block_comments#Python
def strip_single_comment_block(txt: str, strip_line_comments: bool = True) -> str:
    "Strips first nest of block comments"
    out = ""
    next_line_comment_index: int | None = None
    if strip_line_comments:
        # At top level: skip delimiters inside string literals
        raw_line_idx = _find_outside_strings(txt, LINE_DELIM)
        next_line_comment_index = raw_line_idx if raw_line_idx >= 0 else None
        block_start_index = _find_outside_strings(txt, DELIM_L)
    else:
        # Inside a block comment: strings are not special
        block_start_index = txt.index(DELIM_L) if DELIM_L in txt else -1

    if block_start_index >= 0:
        # if we see a line comment before the start of the next block comment, remove it first
        # otherwise stuff like "-- this is /- irrelevant" will break the system
        if (
            next_line_comment_index is not None
            and next_line_comment_index < block_start_index
        ):
            out += txt[:next_line_comment_index]
            remaining = re.sub(
                r"^.*$", "", txt[next_line_comment_index:], count=1, flags=re.MULTILINE
            )
            return out + strip_single_comment_block(remaining, True)

        out += txt[:block_start_index]
        remaining_txt = txt[block_start_index + len(DELIM_L) :]
        if has_nested_comment(remaining_txt):
            remaining_txt = strip_single_comment_block(remaining_txt, False)
        if DELIM_R not in remaining_txt:
            raise LeanParseError(
                "Cannot find closing comment delimiter in " + remaining_txt
            )
        block_end_index = remaining_txt.index(DELIM_R)
        out += remaining_txt[(block_end_index + len(DELIM_R)) :]
    else:
        out = txt
    return out


def strip_nested_block_comment(txt: str) -> str:
    "Strips nests of block comments"
    stripped_txt = txt

    while _find_outside_strings(stripped_txt, DELIM_L) >= 0:
        stripped_txt = strip_single_comment_block(stripped_txt, True)
    return stripped_txt
