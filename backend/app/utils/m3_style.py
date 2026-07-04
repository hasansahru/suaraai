"""
m3_style.py - Material Design 3 Theme for Suara AI
Light/Dark mode support. Compatible with Python 3.14+.
"""

import streamlit as st


LIGHT = {
    "bg_0": "#FAFAFA", "bg_1": "#FFFFFF", "bg_2": "#F3F4F6", "bg_3": "#E5E7EB",
    "primary": "#2563EB", "primary_dk": "#1D4ED8", "primary_ct": "#EFF6FF", "primary_br": "#BFDBFE",
    "text_0": "#0F172A", "text_1": "#1E293B", "text_2": "#64748B", "text_3": "#94A3B8",
    "border_0": "#F1F5F9", "border_1": "#E2E8F0", "border_2": "#CBD5E1",
    "success_ct": "#F0FDF4", "success_br": "#86EFAC", "success_tx": "#15803D",
    "warning_ct": "#FEF2F2", "warning_br": "#FCA5A5", "warning_tx": "#991B1B",
    "info_ct": "#EFF6FF", "info_br": "#BFDBFE", "info_tx": "#1D4ED8",
    "shadow_sm": "0 1px 2px rgba(0,0,0,0.05)", "shadow_md": "0 4px 6px rgba(0,0,0,0.08)",
}

DARK = {
    "bg_0": "#0F172A", "bg_1": "#1A202C", "bg_2": "#2D3748", "bg_3": "#4A5568",
    "primary": "#60A5FA", "primary_dk": "#93C5FD", "primary_ct": "#1E3A5F", "primary_br": "#2A4E80",
    "text_0": "#F8FAFC", "text_1": "#E2E8F0", "text_2": "#94A3B8", "text_3": "#64748B",
    "border_0": "rgba(255,255,255,0.05)", "border_1": "rgba(255,255,255,0.10)",
    "border_2": "rgba(255,255,255,0.15)",
    "success_ct": "#1B4D2F", "success_br": "#22863A", "success_tx": "#4ADE80",
    "warning_ct": "#4B1818", "warning_br": "#7F1D1D", "warning_tx": "#FCA5A5",
    "info_ct": "#1E3A5F", "info_br": "#2A4E80", "info_tx": "#60A5FA",
    "shadow_sm": "0 1px 2px rgba(0,0,0,0.3)", "shadow_md": "0 4px 12px rgba(0,0,0,0.4)",
}


def inject_m3_css(dark_mode=False):
    c = DARK if dark_mode else LIGHT

    parts = []
    parts.append("@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');")
    parts.append(":root {")
    for k, v in c.items():
        parts.append("  --md3-" + k + ": " + v + ";")
    parts.append("}")
    parts.append("html, body, [class*='css'] { font-family: 'Inter', sans-serif !important; }")
    parts.append(".stApp { background-color: var(--md3-bg_0) !important; }")
    parts.append(".main .block-container { padding-top: 2rem !important; max-width: 1400px; }")
    parts.append("[data-testid='stSidebar'] { background-color: var(--md3-bg_1) !important; border-right: 1px solid var(--md3-border_1) !important; }")

    # === 1. SUPER PREMIUM SAAS HEADER ===
    parts.append(".app-header { padding: 2.5rem; margin-bottom: 2rem; border-radius: 20px; background: linear-gradient(145deg, var(--md3-bg_1), var(--md3-bg_0)); border: 1px solid var(--md3-border_1); box-shadow: 0 8px 32px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.05); position: relative; overflow: hidden; }")
    parts.append(".app-header::before { content: ''; position: absolute; top: -100px; right: -50px; width: 300px; height: 300px; background-color: var(--md3-primary); filter: blur(100px); opacity: 0.15; pointer-events: none; }")
    parts.append(".app-header-inner { position: relative; z-index: 1; }")
    parts.append(".app-header-eyebrow { font-size: 0.85rem; font-weight: 800; letter-spacing: 2px; color: var(--md3-primary); text-transform: uppercase; margin-bottom: 12px; }")
    parts.append(".app-header h1 { margin: 0 0 0.5rem 0; font-size: 2.6rem; font-weight: 800; letter-spacing: -0.5px; color: var(--md3-text_0) !important; }")
    parts.append(".app-header h1 span { color: transparent; background: linear-gradient(90deg, var(--md3-primary), #60A5FA); -webkit-background-clip: text; background-clip: text; }")
    parts.append(".app-subtitle { font-size: 1.05rem; color: var(--md3-text_2) !important; max-width: 600px; line-height: 1.5; }")
    parts.append(".app-header-stats { display: flex; gap: 12px; margin-top: 1.5rem; flex-wrap: wrap; }")
    parts.append(".app-header-stat { background-color: var(--md3-bg_2); padding: 8px 16px; border-radius: 999px; font-size: 0.8rem; font-weight: 600; color: var(--md3-text_1); border: 1px solid var(--md3-border_1); display: flex; align-items: center; gap: 8px; box-shadow: var(--md3-shadow_sm); transition: all 0.2s; }")
    parts.append(".app-header-stat:hover { border-color: var(--md3-primary_br); transform: translateY(-2px); }")

    # PERBAIKAN BUG DROP-DOWN (background -> background-color)
    parts.append(".stTextInput input, .stTextArea textarea { background-color: var(--md3-bg_2) !important; border: 1.5px solid var(--md3-border_1) !important; border-radius: 10px !important; color: var(--md3-text_1) !important; font-size: 0.9rem !important; padding: 11px 14px !important; }")
    parts.append(".stTextInput input:focus, .stTextArea textarea:focus { border-color: var(--md3-primary) !important; box-shadow: 0 0 0 3px var(--md3-primary_ct) !important; outline: none !important; }")
    parts.append("div[data-baseweb='select'] > div { background-color: var(--md3-bg_2) !important; border: 1.5px solid var(--md3-border_1) !important; border-radius: 10px !important; cursor: pointer !important; }")

    parts.append(".stButton > button { border-radius: 10px !important; font-size: 0.9rem !important; font-weight: 500 !important; padding: 10px 20px !important; border: 1.5px solid var(--md3-border_2) !important; background-color: var(--md3-bg_2) !important; color: var(--md3-text_1) !important; transition: all 0.2s !important; }")
    parts.append(".stButton > button:hover { background-color: var(--md3-bg_3) !important; border-color: var(--md3-primary_br) !important; transform: translateY(-1px) !important; }")
    parts.append(".stButton > button[kind='primary'] { background-color: var(--md3-primary) !important; border-color: var(--md3-primary_dk) !important; color: #FFFFFF !important; font-weight: 600 !important; box-shadow: var(--md3-shadow_md) !important; }")
    parts.append(".stButton > button[kind='primary']:hover { background-color: var(--md3-primary_dk) !important; transform: translateY(-2px) !important; }")

    # === 2. PILL-SHAPED MODERN TABS ===
    parts.append("[data-testid='stTabs'] [role='tablist'] { gap: 8px; background-color: transparent !important; border: none !important; padding: 0 0 15px 0 !important; }")
    parts.append("[data-testid='stTabs'] [role='tablist']::after { display: none !important; }")
    parts.append("[data-testid='stTabs'] button[role='tab'] { background-color: var(--md3-bg_1) !important; border: 1px solid var(--md3-border_1) !important; border-radius: 999px !important; padding: 8px 20px !important; color: var(--md3-text_2) !important; font-weight: 600 !important; font-size: 0.85rem !important; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important; box-shadow: var(--md3-shadow_sm) !important; }")
    parts.append("[data-testid='stTabs'] button[role='tab']:hover { border-color: var(--md3-primary_br) !important; color: var(--md3-text_1) !important; background-color: var(--md3-bg_2) !important; transform: translateY(-1px); }")
    parts.append("[data-testid='stTabs'] button[role='tab'][aria-selected='true'] { background: linear-gradient(135deg, var(--md3-primary), var(--md3-primary_dk)) !important; border-color: transparent !important; color: #FFFFFF !important; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4) !important; }")

    parts.append("details[data-testid='stExpander'] { background-color: var(--md3-bg_1) !important; border: 1px solid var(--md3-border_1) !important; border-radius: 12px !important; }")
    parts.append(".stMetric { background-color: var(--md3-bg_1) !important; border: 1px solid var(--md3-border_1) !important; border-radius: 12px !important; padding: 16px 20px !important; box-shadow: var(--md3-shadow_sm) !important; }")
    parts.append("[data-testid='stSuccessMessage'] { background-color: var(--md3-success_ct) !important; border: 1px solid var(--md3-success_br) !important; border-radius: 10px !important; }")
    parts.append("[data-testid='stWarningMessage'] { background-color: var(--md3-warning_ct) !important; border: 1px solid var(--md3-warning_br) !important; border-radius: 10px !important; }")
    parts.append("[data-testid='stInfoMessage'] { background-color: var(--md3-info_ct) !important; border: 1px solid var(--md3-info_br) !important; border-radius: 10px !important; }")
    parts.append("[data-testid='stVerticalBlockBorderWrapper'] > div { background-color: var(--md3-bg_1) !important; border: 1px solid var(--md3-border_1) !important; border-radius: 12px !important; }")
    parts.append("[data-testid='stFileUploader'] > div { background-color: var(--md3-bg_2) !important; border: 2px dashed var(--md3-border_2) !important; border-radius: 12px !important; }")
    parts.append("[data-testid='stProgressBar'] > div { background-color: var(--md3-bg_2) !important; border-radius: 999px; height: 8px !important; }")
    parts.append("[data-testid='stProgressBar'] > div > div { background-color: var(--md3-primary) !important; border-radius: 999px; }")
    parts.append("h1, h2, h3, h4 { color: var(--md3-text_0) !important; font-weight: 700 !important; }")
    parts.append(".stMarkdown p { color: var(--md3-text_1) !important; line-height: 1.7; font-size: 0.95rem; }")
    parts.append("a { color: var(--md3-primary) !important; text-decoration: none; }")
    parts.append("::-webkit-scrollbar { width: 8px; }")
    parts.append("::-webkit-scrollbar-thumb { background-color: var(--md3-border_2); border-radius: 999px; }")
    parts.append("hr { border: none !important; border-top: 1px solid var(--md3-border_0) !important; margin: 1.5rem 0 !important; }")
    parts.append("footer.app-footer { margin-top: 3rem; padding: 1rem 0; text-align: center; font-size: 0.75rem; color: var(--md3-text_3); border-top: 1px solid var(--md3-border_0); }")

    css = "\n".join(parts)
    st.markdown("<style>" + css + "</style>", unsafe_allow_html=True)


def add_dark_mode_toggle():
    import streamlit.components.v1 as components

    if "md3_dark_mode" not in st.session_state:
        detected = st.query_params.get("m3_theme")
        if detected == "dark":
            st.session_state.md3_dark_mode = True
        elif detected == "light":
            st.session_state.md3_dark_mode = False
        else:
            components.html(
                "<script>try{var d=window.matchMedia('(prefers-color-scheme:dark)').matches;var u=new URL(window.parent.location.href);if(!u.searchParams.has('m3_theme')){u.searchParams.set('m3_theme',d?'dark':'light');window.parent.location.replace(u.toString());}}catch(e){}</script>",
                height=0,
            )
            st.session_state.md3_dark_mode = False

    with st.sidebar:
        col1, col2 = st.columns([3, 1])
        with col1:
            st.caption("Tema tampilan")
        with col2:
            dark = st.toggle("Theme", value=st.session_state.md3_dark_mode, key="md3_dark_toggle", label_visibility="collapsed")
        st.session_state.md3_dark_mode = dark

    return dark
