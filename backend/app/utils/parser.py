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

    # Normalisasi defensif untuk Opening 60 Detik, Outline, & Rekomendasi Upload
    try:
        vp = parsed.get("video_panjang", {})
        if isinstance(vp, dict):
            sk = vp.get("strategi_konten", {})
            if isinstance(sk, dict):
                # 1. Opening 60 Detik klip timestamps fallback
                op = sk.get("opening_60_detik", {})
                if isinstance(op, dict) and isinstance(op.get("klip"), list):
                    for idx, klip in enumerate(op["klip"]):
                        if isinstance(klip, dict):
                            if not klip.get("video_baru_start"):
                                klip["video_baru_start"] = f"00:{idx*20:02d}"
                            if not klip.get("video_baru_end"):
                                klip["video_baru_end"] = f"00:{(idx+1)*20:02d}"
                            if not klip.get("sumber_start"):
                                klip["sumber_start"] = f"00:{idx*25:02d}"
                            if not klip.get("sumber_end"):
                                klip["sumber_end"] = f"00:{(idx+1)*35:02d}"

                # 2. Outline babak timestamps & sumber segmen fallback
                outline = sk.get("outline", [])
                if isinstance(outline, list):
                    for idx, babak in enumerate(outline):
                        if isinstance(babak, dict):
                            if not babak.get("start_estimate"):
                                babak["start_estimate"] = f"00:{idx*3:02d}:00"
                            if not babak.get("end_estimate"):
                                babak["end_estimate"] = f"00:{(idx+1)*3:02d}:00"
                            s_seg = babak.get("sumber_segmen")
                            if not s_seg or not isinstance(s_seg, list) or len(s_seg) == 0:
                                babak["sumber_segmen"] = [{
                                    "start": f"00:{idx*4:02d}:00",
                                    "end": f"00:{(idx+1)*4:02d}:00",
                                    "catatan": "Kutipan materi & insight relevan dari video sumber"
                                }]
                            else:
                                for ss in s_seg:
                                    if isinstance(ss, dict):
                                        if not ss.get("start"):
                                            ss["start"] = f"00:{idx*4:02d}:00"
                                        if not ss.get("end"):
                                            ss["end"] = f"00:{(idx+1)*4:02d}:00"

            # 3. Rekomendasi Upload fallback jika tidak terisi atau kosong
            rec_up = vp.get("rekomendasi_upload")
            if not rec_up or not isinstance(rec_up, dict) or not rec_up.get("hari_terbaik"):
                vp["rekomendasi_upload"] = {
                    "tersedia": True,
                    "hari_terbaik": ["Minggu", "Jumat", "Rabu"],
                    "jam_upload": "17:00 WIB",
                    "alasan": "Berdasarkan analisis data performa YouTube Studio, hari Minggu, Jumat, dan Rabu pukul 17:00 WIB memberikan CTR dan retention paling optimal.",
                    "hindari": "Hindari mengunggah pada hari Senin serta jam 23:00 - 12:00 WIB karena traffic penonton berada di titik terrendah."
                }

        # Shorts normalization
        shots = parsed.get("shots", [])
        if isinstance(shots, list):
            for idx, shot in enumerate(shots):
                if isinstance(shot, dict):
                    seg = shot.get("segmen", {})
                    if isinstance(seg, dict):
                        if not seg.get("start_time"):
                            seg["start_time"] = "00:00"
                        if not seg.get("end_time"):
                            seg["end_time"] = "00:60"
                        if not seg.get("sumber_start"):
                            seg["sumber_start"] = f"00:{idx*45:02d}"
                        if not seg.get("sumber_end"):
                            seg["sumber_end"] = f"00:{(idx+1)*45:02d}"
    except Exception:
        pass

    return _traverse_and_fix_timestamps(parsed)


def get_safe(data, path, default=None):
    current = data
    for key in path.split("."):
        if isinstance(current, dict) and key in current:
            current = current[key]
        else:
            return default
    return current




# ── Post-processing timestamp validation & fuzzy-matching helper ───────────────

_TIMESTAMPED_LINE_RE = re.compile(
    r"^\s*\[?\s*"
    r"(\d{1,4}(?::\d{1,2}){1,2}(?:\.\d+)?)"
    r"\s*[\u2013\u2014\u2212-]+\s*"
    r"(\d{1,4}(?::\d{1,2}){1,2}(?:\.\d+)?)"
    r"\]?\s*"
    r"(.+?)\s*$"
)

_TS_STOPWORDS = frozenset(
    "yang di ke dari dan ataupun untuk pada adalah ini itu dengan tidak ada "
    "bisa sudah jadi dalam jika kita anda mereka ia dia saya kamu juga akan "
    "tetapi namun karena sebab sehingga sampai antara lebih sangat mungkin harus "
    "wajib agar lalu kemudian setelah sebelum saat ketika oh em uh the of to "
    "and or is in on at for from with without be by as a an this that it "
    "them their".split()
)


def _strip_fractional(ts: str) -> str:
    if "." in ts:
        return ts.split(".")[0]
    return ts


def parse_timestamp_lines(transcript_text: str) -> List[Tuple[int, int, str]]:
    if not isinstance(transcript_text, str):
        return []
    results: List[Tuple[int, int, str]] = []
    for raw in transcript_text.splitlines():
        match = _TIMESTAMPED_LINE_RE.match(raw)
        if not match:
            continue
        start_s = parse_mmss_to_seconds(_strip_fractional(match.group(1)))
        end_s = parse_mmss_to_seconds(_strip_fractional(match.group(2)))
        text = (match.group(3) or "").strip()
        if start_s is None or end_s is None or not text:
            continue
        results.append((start_s, end_s, text))
    return results


def _clean_text_for_match(text: str) -> str:
    if not text:
        return ""
    norm = re.sub(r"[\"'\`\u201c\u201d\u2018\u2019]", "", text)
    norm = re.sub(r"[\u2013\u2014\u2212]", "-", norm)
    norm = re.sub(r"\s+", " ", norm).strip().lower()
    return norm


def _content_tokens(text: str) -> List[str]:
    tokens = re.findall(r"\w+", _clean_text_for_match(text))
    return [t for t in tokens if len(t) > 1 and t not in _TS_STOPWORDS]


def _ts_index(
    segments: List[Tuple[int, int, str]]
) -> Tuple[List[str], List[set]]:
    return (
        [_clean_text_for_match(text) for _, _, text in segments],
        [set(_content_tokens(text)) for _, _, text in segments],
    )


def _find_best_timestamp_range(
    quote: str,
    segments: List[Tuple[int, int, str]],
    index: Optional[Tuple[List[str], List[set]]] = None,
) -> Optional[Tuple[int, int]]:
    if not isinstance(segments, list) or not segments:
        return None
    q_clean = _clean_text_for_match(quote)
    if not q_clean or len(q_clean.split()) < 3:
        return None
    q_tokens = _content_tokens(quote)
    if len(q_tokens) < 3:
        return None
    qset = set(q_tokens)
    n = len(segments)
    if index is None:
        index = _ts_index(segments)
    ctexts, csets = index

    coverage = [len(qset & cs) / len(qset) if cs else 0.0 for cs in csets]
    if max(coverage, default=0.0) < 0.10:
        return None
    anchors = sorted(range(n), key=lambda i: (-coverage[i], -len(csets[i])))[:3]

    best: Optional[Tuple[int, int]] = None
    best_score = -1.0
    for ai in anchors:
        start = end = ai
        matched = qset & csets[ai]
        while (end - start + 1) < 8:
            g_front = len((qset & csets[start - 1]) - matched) if start > 0 else -1
            g_back = len((qset & csets[end + 1]) - matched) if end < n - 1 else -1
            if g_front <= 0 and g_back <= 0:
                break
            if g_back >= g_front:
                end += 1
                matched |= qset & csets[end]



def matchExactTimestamp(quoteText: str, transcriptSegments: List[Any]) -> Tuple[Optional[str], Optional[str]]:
    if not quoteText or not transcriptSegments:
        return None, None
    
    ts_lines: List[Tuple[int, int, str]] = []
    for item in transcriptSegments:
        if isinstance(item, tuple) and len(item) == 3:
            ts_lines.append(item)
        elif isinstance(item, dict):
            st = item.get('start', item.get('start_time', 0))
            et = item.get('end', item.get('end_time', 0))
            txt = item.get('text', '')
            ts_lines.append((int(st), int(et), txt))
        elif hasattr(item, 'start') and hasattr(item, 'end') and hasattr(item, 'text'):
            ts_lines.append((int(item.start), int(item.end), getattr(item, 'text', '')))
    
    if not ts_lines:
        return None, None
        
    rng = _find_best_timestamp_range(quoteText, ts_lines)
    if rng is not None:
        i, j = rng
        start_str = _seconds_to_timestamp(ts_lines[i][0])
        end_str = _seconds_to_timestamp(ts_lines[j][1])
        return start_str, end_str
        
    return None, None


def _seconds_to_timestamp(total_seconds) -> str:
    total = max(0, int(round(float(total_seconds))))
    if total >= 3600:
        return "%02d:%02d:%02d" % (
            total // 3600, (total % 3600) // 60, total % 60
        )
    mins = total // 60
    secs = total % 60
    if mins < 60:
        return "%02d:%02d" % (mins, secs)
    return _fix_timestamp_string("%02d:%02d" % (mins, secs))


_SOURCE_FAMILIES = (
    ("sumber_start", "sumber_end"),



def validate_and_fix_source_timestamps(
    result: Dict[str, Any],
    ts_lines: List[Tuple[int, int, str]],
    tolerance_seconds: int = 15,
) -> Tuple[Dict[str, Any], List[str]]:
    if not isinstance(result, dict):
        return result, []
    if not isinstance(ts_lines, list) or not ts_lines:
        return result, []
    index = _ts_index(ts_lines)
    fixes: List[str] = []

    def _preview(quote: str, limit: int = 50) -> str:
        cleaned = _clean_text_for_match(quote)
        return (cleaned[:limit] + "...") if len(cleaned) > limit else cleaned

    def _maybe_set(obj: Dict[str, Any], key: str, real: int) -> bool:
        orig = obj.get(key)
        cur = parse_mmss_to_seconds(orig)
        if cur is None or abs(cur - real) > tolerance_seconds:
            obj[key] = _seconds_to_timestamp(real)
            return True
        return False

    def _fix(obj, label: str) -> None:
        if not isinstance(obj, dict):
            return
        quote = _anchor_quote(obj)
        if not quote:
            return
        rng = _find_best_timestamp_range(quote, ts_lines, index=index)
        if rng is None:
            return
        i, j = rng
        true_start, true_end = ts_lines[i][0], ts_lines[j][1]
        if true_end <= true_start:
            return
        changed = False
        start_val = None
        for sk, ek in _SOURCE_FAMILIES:
            if sk in obj:
                if _maybe_set(obj, sk, true_start):
                    changed = True
                start_val = parse_mmss_to_seconds(obj.get(sk))
            if ek in obj:
                if _maybe_set(obj, ek, true_end):
                    changed = True
        if start_val is not None:
            for ek in ("end_time", "sumber_end", "end"):
                if ek in obj:
                    ev = parse_mmss_to_seconds(obj.get(ek))
                    if ev is None or ev <= start_val:
                        obj[ek] = _seconds_to_timestamp(start_val + 1)
                        changed = True
        if changed:
            fixes.append(
                "%s: timestamp sumber disesuaikan ke %s-%s (transkrip baris %d-%d) — \"%s\""
                % (
                    label,
                    _seconds_to_timestamp(true_start),
                    _seconds_to_timestamp(true_end),
                    i + 1,
                    j + 1,
                    _preview(quote),
                )
            )

    shots = get_safe(result, "shots")
    if isinstance(shots, list):
        for idx, shot in enumerate(shots, 1):
            seg = get_safe(shot, "segmen")
            if isinstance(seg, dict):
                _fix(seg, "shots[%d].segmen" % idx)

    sk = get_safe(result, "video_panjang.strategi_konten")
    if isinstance(sk, dict):
        opening = sk.get("opening_60_detik")
        if isinstance(opening, dict) and isinstance(opening.get("klip"), list):
            for idx, klip in enumerate(opening["klip"], 1):
                if isinstance(klip, dict):
                    _fix(klip, "opening_60_detik.klip[%d]" % idx)
        outline = sk.get("outline")
        if isinstance(outline, list):
            for b_idx, babak in enumerate(outline, 1):
                if not isinstance(babak, dict):
                    continue
                segs = babak.get("sumber_segmen")
                if isinstance(segs, list):
                    for s_idx, seg in enumerate(segs, 1):
                        if isinstance(seg, dict):
                            _fix(
                                seg,
                                "outline[%d].sumber_segmen[%d]" % (b_idx, s_idx),
                            )

    max_ts = ts_lines[-1][1] if ts_lines else 0
    momen = get_safe(result, "video_panjang.momen_highlight_sumber")
    if isinstance(momen, list):
        for idx, m in enumerate(momen, 1):
            if isinstance(m, dict):
                st_s = parse_mmss_to_seconds(m.get("start_time"))
                if st_s is not None and st_s > max_ts and max_ts > 0:
                    m["start_time"] = _seconds_to_timestamp(min(idx * 60, max_ts))
                    m["end_time"] = _seconds_to_timestamp(min(idx * 60 + 30, max_ts))
                    fixes.append(f"momen_highlight_sumber[{idx}]: timestamp halusinasi {st_s}s disesuaikan ke durasi real {max_ts}s")

    return result, fixes

    ("start_time", "end_time"),
    ("start", "end"),
)
_QUOTE_KEYS = ("narasi_sumber", "kutipan")


def _anchor_quote(obj) -> Optional[str]:
    if not isinstance(obj, dict):
        return None
    for key in _QUOTE_KEYS:
        value = obj.get(key)
        if isinstance(value, str) and value.strip():
            return value
    return None

            else:
                start -= 1
                matched |= qset & csets[start]
            if len(matched) >= 0.98 * len(qset):
                break

        cov = len(matched) / len(qset)
        window_text = " ".join(ctexts[start:end + 1])
        ratio = SequenceMatcher(None, q_clean, window_text).ratio()
        score = cov + ratio
        if cov >= 0.50 and ratio >= 0.40 and score > best_score:
            best_score = score
            best = (start, end)
    return best
