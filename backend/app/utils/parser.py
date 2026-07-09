"""
parser.py - Robust JSON parser for AI responses.
"""

from __future__ import annotations
import json
import re
from typing import Any, Dict, List, Optional


class AIResponseParseError(Exception):
    pass


def _strip_code_fences(text: str) -> str:
    text = text.strip()
    fence_pattern = re.compile(r"^```(?:json)?\s*(.*?)\s*```$", re.DOTALL)
    match = fence_pattern.match(text)
    if match:
        return match.group(1).strip()
    return text


def _extract_first_json_object(text: str) -> str:
    start = text.find("{")
    if start == -1:
        raise AIResponseParseError("No { found in AI response.")
    depth = 0
    in_string = False
    escape = False
    for i in range(start, len(text)):
        char = text[i]
        if in_string:
            if escape:
                escape = False
            elif char == "\\":
                escape = True
            elif char == '"':
                in_string = False
            continue
        if char == '"':
            in_string = True
        elif char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0:
                return text[start : i + 1]
    raise AIResponseParseError("JSON object not balanced.")


def _repair_common_json_issues(text: str) -> str:
    # Remove trailing commas
    text = re.sub(r",\s*([}\]])", r"\1", text)
    return text


def parse_mmss_to_seconds(value: Any) -> Optional[int]:
    if not isinstance(value, str):
        return None
    parts = value.strip().split(":")
    try:
        parts_int = [int(p) for p in parts]
    except ValueError:
        return None
    if len(parts_int) == 2:
        return parts_int[0] * 60 + parts_int[1]
    if len(parts_int) == 3:
        return parts_int[0] * 3600 + parts_int[1] * 60 + parts_int[2]
    return None


def enforce_shot_count(result, shot_count):
    if not shot_count:
        return result
    shots = result.get("shots")
    if isinstance(shots, list) and len(shots) > shot_count:
        result["shots"] = shots[:int(shot_count)]
    return result


def get_shot_segment_list(result):
    shots = result.get("shots")
    if not isinstance(shots, list):
        return []
    segments = []
    for shot in shots:
        if isinstance(shot, dict) and isinstance(shot.get("segmen"), dict):
            segments.append(shot["segmen"])
    return segments


def check_segment_duration_mismatch(segments, target_min_seconds, target_max_seconds, tolerance_seconds=8):
    warnings = []
    if target_min_seconds is None and target_max_seconds is None:
        return warnings
    if not isinstance(segments, list):
        return warnings
    lo = (target_min_seconds or target_max_seconds or 0) - tolerance_seconds
    hi = (target_max_seconds or target_min_seconds or 0) + tolerance_seconds
    for idx, seg in enumerate(segments, start=1):
        if not isinstance(seg, dict):
            continue
        start_s = parse_mmss_to_seconds(seg.get("start_time"))
        end_s = parse_mmss_to_seconds(seg.get("end_time"))
        if start_s is None or end_s is None:
            continue
        actual = end_s - start_s
        if actual <= 0:
            warnings.append("Shot #%d: durasi tidak valid." % idx)
        elif actual < lo or actual > hi:
            warnings.append("Shot #%d: durasi ~%d detik, di luar target." % (idx, actual))
    return warnings


def repair_truncated_json(text: str) -> str:
    start = text.find("{")
    if start == -1:
        return text
    
    cleaned_text = text[start:].strip()
    
    stack = []
    in_string = False
    escape = False
    
    i = 0
    while i < len(cleaned_text):
        char = cleaned_text[i]
        if in_string:
            if escape:
                escape = False
            elif char == "\\":
                escape = True
            elif char == '"':
                in_string = False
        else:
            if char == '"':
                in_string = True
            elif char in ("{", "["):
                stack.append(char)
            elif char == "}":
                if stack and stack[-1] == "{":
                    stack.pop()
            elif char == "]":
                if stack and stack[-1] == "[":
                    stack.pop()
        i += 1
    
    if in_string:
        cleaned_text += '"'
        in_string = False
    
    while True:
        cleaned_text = cleaned_text.rstrip()
        if cleaned_text.endswith(","):
            cleaned_text = cleaned_text[:-1]
            continue
        if cleaned_text.endswith(":"):
            cleaned_text = cleaned_text[:-1]
            continue
        if cleaned_text.endswith('"'):
            idx = cleaned_text[:-1].rfind('"')
            if idx != -1:
                before_str = cleaned_text[:idx].rstrip()
                if before_str.endswith(",") or before_str.endswith("{") or before_str.endswith("["):
                    cleaned_text = before_str
                    continue
        break
        
    stack = []
    in_string = False
    escape = False
    for char in cleaned_text:
        if in_string:
            if escape:
                escape = False
            elif char == "\\":
                escape = True
            elif char == '"':
                in_string = False
        else:
            if char == '"':
                in_string = True
            elif char in ("{", "["):
                stack.append(char)
            elif char == "}":
                if stack and stack[-1] == "{":
                    stack.pop()
            elif char == "]":
                if stack and stack[-1] == "[":
                    stack.pop()
                    
    while stack:
        opened = stack.pop()
        if opened == "{":
            cleaned_text += "}"
        elif opened == "[":
            cleaned_text += "]"
            
    return cleaned_text


def _fix_timestamp_string(text: str) -> str:
    if not isinstance(text, str):
        return text
    
    # Sub mm:ss where mm >= 60 into hh:mm:ss
    def replace_match(match):
        minutes = int(match.group(1))
        seconds = int(match.group(2))
        if minutes >= 60:
            hours = minutes // 60
            mins = minutes % 60
            return f"{hours:02d}:{mins:02d}:{seconds:02d}"
        return match.group(0)
    
    return re.sub(r"\b(\d{2,3}):([0-5]\d)\b", replace_match, text)


def _traverse_and_fix_timestamps(data: Any) -> Any:
    if isinstance(data, dict):
        return {k: _traverse_and_fix_timestamps(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [_traverse_and_fix_timestamps(item) for item in data]
    elif isinstance(data, str):
        return _fix_timestamp_string(data)
    return data


def parse_ai_response(raw_text: str) -> Dict[str, Any]:
    if not raw_text or not raw_text.strip():
        raise AIResponseParseError("Respons AI kosong.")

    parsed = None
    # 1. Coba parsing langsung kandidat teks
    candidates = [raw_text, _strip_code_fences(raw_text)]
    for candidate in candidates:
        try:
            parsed = json.loads(candidate)
            break
        except (json.JSONDecodeError, TypeError):
            continue

    if parsed is None:
        # 2. Coba ekstraksi objek JSON pertama
        stripped = _strip_code_fences(raw_text)
        try:
            extracted = _extract_first_json_object(stripped)
            try:
                parsed = json.loads(extracted)
            except json.JSONDecodeError:
                pass

            if parsed is None:
                try:
                    repaired = _repair_common_json_issues(extracted)
                    parsed = json.loads(repaired)
                except json.JSONDecodeError:
                    pass
        except AIResponseParseError:
            pass

    if parsed is None:
        # 3. Coba perbaiki JSON jika terpotong (truncated)
        try:
            truncated_repaired = repair_truncated_json(stripped)
            truncated_repaired = _repair_common_json_issues(truncated_repaired)
            parsed = json.loads(truncated_repaired)
        except Exception as exc:
            raise AIResponseParseError(f"Respons AI tidak bisa diparsing (termasuk setelah dicoba perbaikan): {exc}")

    return _traverse_and_fix_timestamps(parsed)


def get_safe(data, path, default=None):
    current = data
    for key in path.split("."):
        if isinstance(current, dict) and key in current:
            current = current[key]
        else:
            return default
    return current
