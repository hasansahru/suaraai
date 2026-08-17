"""
ui_components_enhanced.py — Modern UI Components
================================================
Reusable, professional UI elements for Suara AI.

Enhanced from ui_components.py with:
  ✓ Modern badge styling
  ✓ Professional score grid
  ✓ Interactive checklist
  ✓ Better step progress
  ✓ Copy-able blocks
"""

from __future__ import annotations
from typing import Any, Dict, Optional

import streamlit as st


def badge(text: str, color: str = "#3B82F6", variant: str = "filled") -> None:
    """
    Render badge pill with modern styling.

    Args:
        text: Badge text
        color: Color hex (primary blue default)
        variant: 'filled' or 'outline'
    """
    if variant == "outline":
        st.markdown(
            f"""
            <span style="
                background: transparent;
                color: {color};
                border: 1.5px solid {color};
                padding: 3px 12px;
                border-radius: 999px;
                font-size: 0.78rem;
                font-weight: 600;
                display: inline-block;
                margin: 2px 6px 2px 0;
            ">{text}</span>
            """,
            unsafe_allow_html=True,
        )
    else:
        st.markdown(
            f"""
            <span style="
                background: {color}20;
                color: {color};
                border: 1px solid {color}40;
                padding: 3px 12px;
                border-radius: 999px;
                font-size: 0.78rem;
                font-weight: 600;
                display: inline-block;
                margin: 2px 6px 2px 0;
            ">{text}</span>
            """,
            unsafe_allow_html=True,
        )


def score_badge(score: Any, label: str) -> None:
    """Badge for score 1-10 with color coding."""
    try:
        numeric = float(score)
    except (TypeError, ValueError):
        numeric = 0.0

    if numeric >= 8:
        color = "#16A34A"  # Green
    elif numeric >= 6:
        color = "#2563EB"  # Blue
    elif numeric >= 5:
        color = "#DC2626"  # Orange/Red
    else:
        color = "#991B1B"  # Deep red

    badge(f"⭐ {label}: {score}/10", color)


def copy_block(content: str, language: Optional[str] = None) -> None:
    """
    Render content in code block for easy copy.

    Args:
        content: Text to display
        language: Syntax highlighting (default: None for plain text)
    """
    if language:
        st.code(content, language=language)
    else:
        st.code(content, language="text")


def render_score_grid(skor_growth: Dict[str, Any]) -> None:
    """
    Render score grid with modern cards and expander for explanations.

    Args:
        skor_growth: Dict with keys like 'ctr', 'retention', etc.
    """
    label_map = {
        "ctr": ("CTR", "📊 Click-through rate"),
        "retention": ("Retention", "👀 Penonton bertahan"),
        "watch_time": ("Watch Time", "⏱ Durasi tonton"),
        "seo": ("SEO", "🔍 Pencarian YouTube"),
        "viral_potential": ("Viral Potential", "🔥 Potensi viral"),
        "evergreen": ("Evergreen", "🌿 Konten jangka panjang"),
        "emotional_impact": ("Emotional Impact", "💡 Dampak emosi"),
    }

    cols = st.columns(3)

    for idx, (key, (label, description)) in enumerate(label_map.items()):
        item = skor_growth.get(key, {}) if isinstance(skor_growth, dict) else {}
        score = item.get("score", "-") if isinstance(item, dict) else "-"

        with cols[idx % 3]:
            with st.container(border=True):
                st.caption(f"{label} — {description}")
                try:
                    numeric = float(score)
                    if numeric >= 7:
                        st.success(f"**{score}/10**")
                    elif numeric >= 5:
                        st.warning(f"**{score}/10**")
                    else:
                        st.error(f"**{score}/10**")
                except:
                    st.info(f"**{score}/10**")

    with st.expander("📋 Alasan Skor (detail)"):
        for key, (label, description) in label_map.items():
            item = skor_growth.get(key, {}) if isinstance(skor_growth, dict) else {}
            if not isinstance(item, dict):
                continue
            st.markdown(f"**{label}** — {item.get('score', '-')}/10")
            st.info(item.get("alasan", "-"))


def render_checklist(checklist: list) -> None:
    """
    Render interactive checklist for pre-upload verification.

    Args:
        checklist: List of dicts with keys 'item', 'wajib', 'auto'
                   or simple strings
    """
    if not checklist:
        st.info("Tidak ada checklist.")
        return

    st.subheader("✅ Checklist")

    total = len(checklist)
    checked = 0

    for idx, item in enumerate(checklist):
        if isinstance(item, dict):
            label = item.get("item", "")
            wajib = item.get("wajib", True)
            is_auto = item.get("auto", False)
        else:
            label = str(item)
            wajib = True
            is_auto = False

        # Build display text
        suffix_parts = []
        if wajib:
            suffix_parts.append("🔴 WAJIB")
        else:
            suffix_parts.append("⬜ OPSIONAL")

        if is_auto:
            suffix_parts.append("🤖 otomatis")

        suffix = " · ".join(suffix_parts)

        # Render checkbox with Streamlit
        key_name = f"check_{idx}"
        if key_name not in st.session_state:
            st.session_state[key_name] = False

        st.checkbox(
            f"{label}  `{suffix}`",
            key=key_name,
        )
        if st.session_state[key_name]:
            checked += 1

    # Progress
    if total > 0:
        progress = checked / total
        if progress >= 0.8:
            st.success(f"✅ {checked}/{total} item selesai")
        else:
            st.info(f"📋 {checked}/{total} item selesai")
        st.progress(progress)


def step_progress(current_step: int, total_steps: int, label: str, placeholder) -> None:
    """
    Update progress with a modern, custom HTML card matching M3 Theme.

    Args:
        current_step: Current step (0-indexed or 1-indexed)
        total_steps: Total number of steps
        label: Description of current step
        placeholder: Streamlit st.empty() object
    """
    fraction = min(max(current_step / max(total_steps, 1), 0.0), 1.0)
    pct = int(fraction * 100)
    is_done = current_step >= total_steps

    # Warna menyesuaikan status (Progress vs Selesai)
    bg_icon = "var(--md3-success_tx)" if is_done else "var(--md3-primary)"
    bg_bar = "linear-gradient(90deg, var(--md3-success_br), var(--md3-success_tx))" if is_done else "linear-gradient(90deg, var(--md3-primary), #60A5FA)"
    shadow_icon = "rgba(74, 222, 128, 0.3)" if is_done else "rgba(37, 99, 235, 0.3)"
    text_step = "SELESAI" if is_done else f"LANGKAH {current_step} DARI {total_steps}"
    
    # Gunakan ikon centang jika selesai, jika belum tampilkan angka
    icon_content = "✓" if is_done else str(current_step) if current_step > 0 else "⏳"

    # PERHATIAN: Teks HTML di bawah ini sengaja dirapatkan ke ujung paling kiri
    # agar tidak dibaca sebagai Code Block oleh Markdown Streamlit.
    html = f"""<div style="background: var(--md3-bg_1); border: 1.5px solid var(--md3-border_1); border-radius: 16px; padding: 20px 24px; box-shadow: var(--md3-shadow_md); margin: 10px 0 24px 0; position: relative; overflow: hidden;">
<div style="position: absolute; top: 0; left: 0; width: {pct}%; height: 100%; background: linear-gradient(90deg, transparent, {'var(--md3-success_ct)' if is_done else 'var(--md3-primary_ct)'}); opacity: 0.5; pointer-events: none; transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);"></div>
<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; position: relative; z-index: 1;">
<div style="display: flex; align-items: center; gap: 16px;">
<div style="background: {bg_icon}; color: #FFFFFF; border-radius: 50%; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1.2rem; box-shadow: 0 4px 14px {shadow_icon}; transition: all 0.3s ease;">
{icon_content}
</div>
<div>
<div style="color: var(--md3-text_2); font-size: 0.75rem; font-weight: 700; letter-spacing: 1.2px; margin-bottom: 4px;">{text_step}</div>
<div style="color: var(--md3-text_0); font-weight: 700; font-size: 1.05rem;">{label}</div>
</div>
</div>
<div style="background: var(--md3-bg_2); padding: 6px 14px; border-radius: 999px; color: var(--md3-text_1); font-weight: 800; font-size: 0.95rem; border: 1px solid var(--md3-border_1); min-width: 65px; text-align: center;">{pct}%</div>
</div>
<div style="width: 100%; background: var(--md3-bg_2); border-radius: 999px; height: 10px; overflow: hidden; position: relative; z-index: 1;">
<div style="width: {pct}%; height: 100%; background: {bg_bar}; border-radius: 999px; transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: inset 0 -2px 4px rgba(0,0,0,0.15);"></div>
</div>
</div>"""

    placeholder.markdown(html, unsafe_allow_html=True)
