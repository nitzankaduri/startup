import re
from typing import Dict, List
from validator_constants import JSX_PRIMITIVES, VALID_SDK_EXPORTS, WIN_LOSE_PATTERNS


def _scan_template(code: str, i: int, out: List[str]) -> int:
    n = len(code)
    out.append(" ")
    while i < n:
        if code[i] == "\\" and i + 1 < n:
            i += 2
        elif code[i] == "`":
            return i + 1
        elif code[i] == "$" and i + 1 < n and code[i + 1] == "{":
            out.append("{")
            i, depth = _scan_code(code, i + 2, out, stop_depth=1)
            out.append("}" if depth == 0 else "")
        else:
            i += 1
    return i


def _scan_code(code: str, start: int = 0, out: List[str] | None = None, stop_depth: int = 0) -> tuple[int, int]:
    out = out if out is not None else []
    i, n, depth = start, len(code), stop_depth
    while i < n:
        ch, nxt = code[i], code[i + 1] if i + 1 < n else ""
        if ch == "/" and nxt == "/":
            i = code.find("\n", i) if "\n" in code[i:] else n
        elif ch == "/" and nxt == "*":
            end = code.find("*/", i + 2)
            i = (end + 2) if end != -1 else n
        elif ch in ("'", '"'):
            q, i = ch, i + 1
            out.append(" ")
            while i < n and code[i] != q:
                i += 2 if (code[i] == "\\" and i + 1 < n) else 1
            i += 1
        elif ch == "`":
            i = _scan_template(code, i + 1, out)
        else:
            if stop_depth > 0:
                depth += (1 if ch == "{" else -1 if ch == "}" else 0)
                if depth == 0:
                    return i + 1, 0
            out.append(ch)
            i += 1
    return i, depth


def _check_balanced_delimiters(stripped: str) -> List[str]:
    pairs, stack = {"(": ")", "[": "]", "{": "}"}, []
    closing = {v: k for k, v in pairs.items()}
    for ch in stripped:
        if ch in pairs:
            stack.append(ch)
        elif ch in closing:
            if not stack or stack[-1] != closing[ch]:
                return [f"Unmatched closing `{ch}` in JSX/JS structure."]
            stack.pop()
    return [f"Unclosed `{stack[-1]}` delimiter ({len(stack)} unclosed)."] if stack else []


def _check_jsx_tags(stripped: str) -> List[str]:
    stack, i, n = [], 0, len(stripped)
    while i < n:
        if stripped[i] == "<":
            close_m = re.match(r"</([A-Za-z][A-Za-z0-9_.]*)\s*>", stripped[i:])
            if close_m:
                name = close_m.group(1)
                if name in JSX_PRIMITIVES or name[0].isupper():
                    if not stack or stack[-1] != name:
                        return [f"Mismatched closing JSX tag `</{name}>`."]
                    stack.pop()
                i += close_m.end()
                continue
            prev = stripped[:i].rstrip()
            open_m = re.match(r"<([A-Za-z][A-Za-z0-9_.]*)(?=[\s/>])", stripped[i:])
            if open_m and (not prev or prev[-1] in "(=,:?[{>&|\n" or prev.endswith("return")):
                name = open_m.group(1)
                if name in JSX_PRIMITIVES or name[0].isupper():
                    j, brace = i + open_m.end(), 0
                    while j < n:
                        brace += (1 if stripped[j] == "{" else -1 if stripped[j] == "}" else 0)
                        if brace <= 0 and stripped[j] == ">":
                            if stripped[j - 1] != "/":
                                stack.append(name)
                            i = j + 1
                            break
                        j += 1
                    else:
                        return [f"Unclosed JSX opening tag `<{name}>`."]
                    continue
        i += 1
    return [f"Unclosed JSX tag `<{stack[-1]}>`."] if stack else []


def _check_sdk_symbols(code: str, stripped: str) -> List[str]:
    errors, declared, imported = [], set(re.findall(r"(?:function|const|let|var|class)\s+([A-Z][A-Za-z0-9_]*)", code)), set()
    for m in re.finditer(r"import\s+\{([^}]+)\}\s+from\s+['\"][^'\"]*spawnSdk[^'\"]*['\"]", code):
        for spec in m.group(1).split(","):
            name = spec.strip().split(" as ")[0].strip()
            if name and name not in VALID_SDK_EXPORTS:
                errors.append(f"Unknown SDK import `{name}`.")
    for m in re.finditer(r"import\s+(?:([A-Z][A-Za-z0-9_]*)\s*,?\s*)?(?:\{([^}]+)\})?\s+from\s+['\"][^'\"]+['\"]", code):
        if m.group(1):
            imported.add(m.group(1))
        imported.update(s.strip().split(" as ")[-1].strip() for s in (m.group(2) or "").split(",") if s.strip())
    known = VALID_SDK_EXPORTS | declared | imported | {"Suspense", "Fragment", "ErrorBoundary"}
    for tag in re.findall(r"<([A-Z][A-Za-z0-9_]*)(?=[\s/>])", stripped):
        if tag not in known:
            errors.append(f"Undefined JSX component `<{tag}>`.")
            known.add(tag)
    return errors[:5]


def _check_useframe_setstate(stripped: str) -> List[str]:
    errors: List[str] = []
    for hook in ("useFrame", "useGameLoop"):
        for m in re.finditer(rf"\b{hook}\s*\(", stripped):
            depth, i, n = 0, m.end() - 1, len(stripped)
            while i < n:
                depth += (1 if stripped[i] == "(" else -1 if stripped[i] == ")" else 0)
                if depth == 0:
                    hits = re.findall(r"\b(set[A-Z][A-Za-z0-9_]*)\s*\(", stripped[m.end() - 1 : i])
                    if hits:
                        errors.append(f"`{hits[0]}()` inside `{hook}`; move state updates out of per-frame loop.")
                    break
                i += 1
    return errors[:3]


def validate_game_code(code: str) -> Dict[str, object]:
    """Run pre-flight structural, SDK, R3F DOM, win/lose, and useFrame safety checks."""
    errors: List[str] = ["Missing `GeneratedGame` component export."] if (not code or "GeneratedGame" not in code) else []
    out: List[str] = []
    _scan_code(code or "", 0, out, 0)
    stripped = "".join(out)
    errors.extend(_check_balanced_delimiters(stripped) + _check_jsx_tags(stripped))
    errors.extend(_check_sdk_symbols(code or "", stripped) + _check_useframe_setstate(stripped))
    if "<Html" not in (code or "") and re.search(r"<(div|span|button|h[1-4]|section)\b", stripped):
        errors.append("Raw HTML tag (`<div>`/`<span>`) inside Three.js Canvas! Remove DOM HUD tags and use `registerHud` / `useMissionState` or wrap labels in `<Html>`.")
    if re.search(r"registerHud\s*\(\s*(React\.createElement|<)", code or ""):
        errors.append("`registerHud` only accepts a plain object `{ meters: [{ label, value }] }`, NEVER JSX or `React.createElement`.")
    if not any(tok in (code or "") for tok in WIN_LOSE_PATTERNS):
        errors.append("Missing win/lose condition (`onWin`, `onGameOver`, `triggerVictory`, `triggerDefeat`, or `completeObjective`).")
    return {"passed": len(errors) == 0, "errors": errors}
