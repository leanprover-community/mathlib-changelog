from crawler.parser.strip_lean_comments import strip_lean_comments


def test_strip_lean_comments_removes_single_line_comments() -> None:
    input = """
hi
ok -- this is a comment
just some more code
-- I don't know what I'm doing
more stuff
    """.strip()
    expected = """
hi
ok 
just some more code

more stuff
    """.strip()
    assert strip_lean_comments(input) == expected


def test_strip_lean_comments_removes_multi_line_comments() -> None:
    input = """
/-
Copyright (c) 2019 Yury Kudryashov. All rights reserved.
Released under Apache 2.0 license as described in the file LICENSE.
Authors: Yury Kudryashov
-/
import category_theory.single_obj
import category_theory.limits.shapes.products
import category_theory.pi.basic
import category_theory.limits.is_limit

/-!
# Category of groupoids
This file contains the definition of the category `Groupoid` of all groupoids.
In this category objects are groupoids and morphisms are functors
between these groupoids.
We also provide two “forgetting” functors: `objects : Groupoid ⥤ Type`
and `forget_to_Cat : Groupoid ⥤ Cat`.
## Implementation notes
Though `Groupoid` is not a concrete category, we use `bundled` to define
its carrier type.
-/

universes v u

namespace category_theory

/-- Category of groupoids -/
@[nolint check_univs] -- intended to be used with explicit universe parameters
def Groupoid := bundled groupoid.{v u}
    """.strip()
    expected = """
import category_theory.single_obj
import category_theory.limits.shapes.products
import category_theory.pi.basic
import category_theory.limits.is_limit



universes v u

namespace category_theory


@[nolint check_univs] 
def Groupoid := bundled groupoid.{v u}
    """.strip()
    assert strip_lean_comments(input).strip() == expected


def test_strip_lean_comments_removes_nested_multi_line_comments() -> None:
    input = """
/-
Copyright (c) 2019 Yury Kudryashov. All rights reserved.
Released under Apache 2.0 license as described in the file LICENSE.
Authors: Yury Kudryashov
-/
import category_theory.single_obj
import category_theory.limits.shapes.products
import category_theory.pi.basic
import category_theory.limits.is_limit

/--!
# Category of groupoids
This file contains the definition of the category `Groupoid` of all groupoids.
In this category objects are groupoids and morphisms are functors
between these groupoids.
We also provide two “forgetting” functors: `objects : Groupoid ⥤ Type`
and `forget_to_Cat : Groupoid ⥤ Cat`.
```
/-- blah blah -/
```

## Implementation notes
Though `Groupoid` is not a concrete category, we use `bundled` to define
its carrier type.
-/

/- On the other hand, `F n a --> f a` implies that `∥F n a - f a∥ --> 0`  -/
universes v u

namespace category_theory

/-- Category of groupoids -/
@[nolint check_univs] -- intended to be used with explicit universe parameters
def Groupoid := bundled groupoid.{v u}
    """.strip()
    expected = """
import category_theory.single_obj
import category_theory.limits.shapes.products
import category_theory.pi.basic
import category_theory.limits.is_limit




universes v u

namespace category_theory


@[nolint check_univs] 
def Groupoid := bundled groupoid.{v u}
    """.strip()
    assert strip_lean_comments(input).strip() == expected


def test_strip_lean_comments_handles_block_chars_in_line_comments() -> None:
    input = """
hi
ok -- this is +/- fine
-- r = +/- j ^ 2
-- s = +/- k ^ 2
just some more code
    """.strip()
    expected = """
hi
ok 


just some more code
    """.strip()
    assert strip_lean_comments(input) == expected


def test_strip_lean_comments_ignores_delimiters_in_string_literals() -> None:
    input = """
def foo : IO Unit := do
  if s.startsWith "/-" then
    IO.println "found block comment start"
  IO.println s!"delim is /-"
    """.strip()
    expected = """
def foo : IO Unit := do
  if s.startsWith "/-" then
    IO.println "found block comment start"
  IO.println s!"delim is /-"
    """.strip()
    assert strip_lean_comments(input) == expected


def test_strip_lean_comments_handles_string_and_real_comment_together() -> None:
    input = """
/-- A doc comment -/
def foo := "this has /- in it"
/- real block comment -/
def bar := 42
    """.strip()
    result = strip_lean_comments(input)
    assert '"this has /- in it"' in result
    assert "def foo" in result
    assert "def bar := 42" in result
    assert "A doc comment" not in result
    assert "real block comment" not in result
