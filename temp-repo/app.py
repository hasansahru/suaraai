"""
AI YouTube Content Intelligence Pro
=====================================

Aplikasi web untuk menganalisis video YouTube (reverse engineering strategi
konten) dan menghasilkan paket produksi YouTube baru yang orisinal, sesuai
DNA channel yang dipilih pengguna.

Jalankan dengan:
    streamlit run app.py
"""

from __future__ import annotations

import json
import os
import base64
import tempfile

import streamlit as st

from utils import prompt_loader
from utils import youtube_utils
from utils import ai_client
from utils import parser as ai_parser
from utils import ui_components as ui
from utils import analytics_parser
from utils.m3_style import inject_m3_css, add_dark_mode_toggle

try:
    from dotenv import load_dotenv

    load_dotenv()
except ImportError:
    pass

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SETTINGS_DIR = os.path.join(BASE_DIR, "settings")


# ---------------------------------------------------------------------------
# Load settings (JSON) — dilakukan sekali di awal, di-cache oleh Streamlit.
# ---------------------------------------------------------------------------

@st.cache_data
def load_json_setting(filename: str) -> dict:
    path = os.path.join(SETTINGS_DIR, filename)
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


ui_setting = load_json_setting("ui_setting.json")
duration_setting = load_json_setting("duration_setting.json")
output_setting = load_json_setting("output_setting.json")
channel_setting = load_json_setting("channel_setting.json")
ai_provider_setting = load_json_setting("ai_provider_setting.json")


# ---------------------------------------------------------------------------
# Page config & global style
# ---------------------------------------------------------------------------

st.set_page_config(
    page_title=ui_setting.get("app_title", "AI YouTube Content Intelligence Pro"),
    page_icon=ui_setting.get("page_icon", "🎬"),
    layout=ui_setting.get("layout", "wide"),
)

# M3 REDESIGN — tambahkan setelah st.set_page_config(...)
dark_mode = add_dark_mode_toggle()
inject_m3_css(dark_mode=dark_mode)


# ---------------------------------------------------------------------------
# Session state defaults
# ---------------------------------------------------------------------------

if "analysis_result" not in st.session_state:
    st.session_state.analysis_result = None
if "raw_ai_text" not in st.session_state:
    st.session_state.raw_ai_text = None
if "web_sources" not in st.session_state:
    st.session_state.web_sources = []
if "last_error" not in st.session_state:
    st.session_state.last_error = None
if "duration_warnings" not in st.session_state:
    st.session_state.duration_warnings = []
if "run_context" not in st.session_state:
    st.session_state.run_context = {}
if "selected_shot_index" not in st.session_state:
    st.session_state.selected_shot_index = 0
if "connection_test_result" not in st.session_state:
    st.session_state.connection_test_result = None
if "thumbnail_review_result" not in st.session_state:
    st.session_state.thumbnail_review_result = None
if "enable_web_search" not in st.session_state:
    st.session_state.enable_web_search = False
if "enable_thinking" not in st.session_state:
    st.session_state.enable_thinking = False
if "provider_mode_cache" not in st.session_state:
    st.session_state.provider_mode_cache = "anthropic"


# ---------------------------------------------------------------------------
# Header
# ---------------------------------------------------------------------------

# SPASI DIHILANGKAN agar dirender sebagai HTML, bukan Code Block
header_html = f"""<div class="app-header">
<div class="app-header-inner">
<div class="app-header-eyebrow">AI Content Engine</div>
<h1>{ui_setting.get("page_icon", "🎬")} <span>YouTube</span> Content Intelligence</h1>
<div class="app-subtitle">{ui_setting.get("app_subtitle", "")}</div>
<div class="app-header-stats">
<div class="app-header-stat">🧠 <strong>5 modul AI</strong> · analisis & generasi</div>
<div class="app-header-stat">⚡ <strong>Multi-provider</strong> · Claude · GPT · Gemini</div>
<div class="app-header-stat">📦 <strong>Siap upload</strong> · Shorts & Video Panjang</div>
</div>
</div>
</div>"""

st.markdown(header_html, unsafe_allow_html=True)


# ---------------------------------------------------------------------------
# Sidebar — input & settings
# ---------------------------------------------------------------------------

with st.sidebar:
    with st.expander("⚙ Konfigurasi AI", expanded=True):
        provider_options = ai_provider_setting.get("providers", [])
        provider_id_list = [p["id"] for p in provider_options]
        provider_labels = {p["id"]: p["label"] for p in provider_options}
        default_provider_id = ai_provider_setting.get("default_provider", provider_id_list[0] if provider_id_list else "anthropic")
        default_provider_index = provider_id_list.index(default_provider_id) if default_provider_id in provider_id_list else 0

        selected_provider_id = st.selectbox(
            "🤖 AI Provider",
            options=provider_id_list,
            format_func=lambda pid: provider_labels.get(pid, pid),
            index=default_provider_index,
            help="Pilih provider AI yang akan dipakai untuk analisis & generasi konten.",
            key="selected_provider_id",
        )
        selected_provider = next(p for p in provider_options if p["id"] == selected_provider_id)
        st.caption(selected_provider.get("description", ""))

        provider_mode = selected_provider.get("mode", "anthropic")
        provider_api_key_env = selected_provider.get("api_key_env", "ANTHROPIC_API_KEY")

        api_key_input = st.text_input(
            f"API Key ({provider_labels.get(selected_provider_id, selected_provider_id)})",
            type="password",
            value=os.environ.get(provider_api_key_env, ""),
            help=f"Bisa juga diatur lewat environment variable {provider_api_key_env} atau file .env.",
            key=f"api_key_{selected_provider_id}",
        )

        base_url_input = selected_provider.get("default_base_url", "")
        if provider_mode == "openai_compatible":
            base_url_input = st.text_input(
                "🔗 Base URL Endpoint",
                value=selected_provider.get("default_base_url", ""),
                placeholder="contoh: http://localhost:20128/v1",
                help=(
                    "Untuk 9Router Proxy, ini adalah URL dashboard lokal Anda "
                    "(default http://localhost:20128/v1). Untuk provider lain, isi sesuai "
                    "dokumentasi base_url OpenAI-compatible mereka."
                ),
                key=f"base_url_{selected_provider_id}",
            )

        model_options = selected_provider.get("models", [])
        model_id_list = [m["id"] for m in model_options]
        model_labels = {m["id"]: m["label"] for m in model_options}
        allow_custom_model = selected_provider.get("allow_custom_model", False)

        model_choice_options = list(model_id_list)
        if allow_custom_model:
            model_choice_options.append("__custom__")
            model_labels["__custom__"] = "✏️ Model lain (ketik manual)"

        if not model_choice_options:
            model_choice_options = ["__custom__"]
            model_labels["__custom__"] = "✏️ Model lain (ketik manual)"

        selected_model_choice = st.selectbox(
            "Model AI",
            options=model_choice_options,
            format_func=lambda mid: model_labels.get(mid, mid),
            index=0,
            key=f"model_select_{selected_provider_id}",
        )

        if selected_model_choice == "__custom__":
            selected_model = st.text_input(
                "ID Model Custom",
                placeholder="contoh: cc/claude-sonnet-4-6, gpt-5.2, deepseek-chat, dll.",
                key=f"model_custom_{selected_provider_id}",
            )
        else:
            selected_model = selected_model_choice

        request_timeout = st.slider(
            "⏱️ Timeout API (detik)",
            min_value=30,
            max_value=600,
            value=180,
            step=10,
            help=(
                "Jika proses 'Memanggil AI' terasa lama/macet, ini batas waktu tunggu sebelum "
                "dianggap gagal."
            ),
        )

        st.session_state.provider_mode_cache = provider_mode

        _col_test, _col_clear = st.columns([3, 1])
        with _col_test:
            _do_test = st.button("🔌 Test Koneksi API", use_container_width=True)
        with _col_clear:
            if st.button("✕", use_container_width=True, help="Hapus hasil test"):
                st.session_state.connection_test_result = None
                st.rerun()

        if _do_test:
            with st.spinner("Menghubungi provider..."):
                try:
                    success_msg = ai_client.test_connection(
                        mode=provider_mode,
                        model=(selected_model or "").strip(),
                        api_key=api_key_input,
                        api_key_env=provider_api_key_env,
                        base_url=base_url_input,
                        timeout=min(float(request_timeout), 30.0),
                    )
                    st.session_state.connection_test_result = {
                        "ok": True,
                        "message": success_msg or "Model merespons dengan benar.",
                        "provider": provider_labels.get(selected_provider_id, selected_provider_id),
                    }
                except Exception as exc:
                    _raw = str(exc)
                    _short = _raw[:180] + ("…" if len(_raw) > 180 else "")
                    st.session_state.connection_test_result = {
                        "ok": False,
                        "message": _short,
                        "provider": provider_labels.get(selected_provider_id, selected_provider_id),
                    }

        _conn_result = st.session_state.connection_test_result
        if _conn_result:
            _ok = _conn_result["ok"]
            _badge_color = "#22c55e" if _ok else "#ef4444"
            _bg_color = "#0f2818" if _ok else "#2a0f0f"
            _border_color = "#166534" if _ok else "#7f1d1d"
            _icon = "✅" if _ok else "❌"
            _label = "Koneksi berhasil" if _ok else "Koneksi gagal"
            _msg = _conn_result["message"]
            _prov = _conn_result["provider"]
            
            conn_html = f"""<div style="background:{_bg_color}; border:1px solid {_border_color}; border-left: 3px solid {_badge_color}; border-radius:10px; padding:10px 12px; margin-top:6px; font-size:0.82rem; line-height:1.45;">
<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
<span style="font-size:0.95rem">{_icon}</span>
<span style="font-weight:700;color:{_badge_color}">{_label}</span>
<span style="margin-left:auto;font-size:0.72rem;color:#6B7280;white-space:nowrap">{_prov}</span>
</div>
<div style="color:#CBD5E1;word-break:break-word;">{_msg}</div>
</div>"""
            st.markdown(conn_html, unsafe_allow_html=True)

    st.markdown(
        '<div style="font-size:0.78rem;font-weight:600;color:#8A8B8D;letter-spacing:0.03em;'
        'margin:14px 0 6px 2px;">✦ SKILL TAMBAHAN & THUMBNAIL</div>',
        unsafe_allow_html=True,
    )
    
    _is_anthropic = (provider_mode == ai_client.MODE_ANTHROPIC)

    # DEFAULT VALUES: WAJIB ADA AGAR TIDAK ERROR "NameError" JIKA TIDAK DICENTANG
    enable_web_search = False
    web_search_max_uses = 5
    enable_thinking = False
    thinking_budget_tokens = 4000
    enable_code_execution = False

    if _is_anthropic:
        with st.expander("🧠 Skill Claude Tambahan (lebih pintar, lebih lambat)", expanded=False):
            enable_web_search = st.checkbox(
                "🔍 Aktifkan Web Search",
                key="enable_web_search",
                help="Claude akan mencari informasi terkini di internet (tren YouTube, kata kunci SEO, judul kompetitor).",
            )
            if enable_web_search:
                web_search_max_uses = st.slider("Maks. jumlah pencarian per analisis", min_value=1, max_value=10, value=5, step=1)

            enable_thinking = st.checkbox(
                "🧩 Aktifkan Extended Thinking",
                key="enable_thinking",
                help="Claude akan 'berpikir' lebih panjang & terstruktur sebelum menjawab (reasoning eksplisit).",
            )
            if enable_thinking:
                thinking_budget_tokens = st.slider("Token budget untuk thinking", min_value=1024, max_value=16000, value=4000, step=1024)

            enable_code_execution = st.checkbox(
                "🧮 Aktifkan Code Execution",
                key="enable_code_execution",
                help="Claude akan benar-benar MENGHITUNG durasi dan waktu melalui sandbox Python.",
            )

        # --- Skill Claude: Vision — Review Thumbnail ---
        with st.expander("🖼️ Review Thumbnail dengan Vision (Opsional)", expanded=False):
            st.caption(
                "Upload thumbnail (punya sendiri, atau bandingkan dengan kompetitor) — Claude "
                "akan mengkritiknya secara visual nyata. Fitur ini berjalan independen."
            )
            thumbnail_images_uploaded = st.file_uploader(
                "Upload Gambar Thumbnail (maks. 3 — gambar pertama = yang dinilai)",
                type=["png", "jpg", "jpeg", "webp"],
                accept_multiple_files=True,
                key="thumbnail_review_uploader",
            )
            thumbnail_review_notes = st.text_input(
                "Konteks tambahan (opsional)",
                placeholder="Misalnya: judul videonya 'Rahasia Sukses di Usia 20'",
                key="thumbnail_review_notes",
            )

            _col_thumb_run, _col_thumb_clear = st.columns([3, 1])
            with _col_thumb_run:
                # Tombol ini hanya aktif (bisa diklik) jika ada gambar yang diupload
                _do_thumb_review = st.button(
                    "🔍 Analisis Thumbnail Ini",
                    use_container_width=True,
                    disabled=not thumbnail_images_uploaded,
                )
            with _col_thumb_clear:
                if st.button("✕", use_container_width=True, help="Hapus hasil review", key="clear_thumb_review"):
                    st.session_state.thumbnail_review_result = None
                    st.rerun()

            if _do_thumb_review and thumbnail_images_uploaded:
                if len(thumbnail_images_uploaded) > 3:
                    st.warning("Maksimal 3 gambar — hanya 3 gambar pertama yang akan dianalisis.")
                _files_to_use = thumbnail_images_uploaded[:3]
                with st.spinner("Claude sedang menganalisis thumbnail secara visual..."):
                    try:
                        _images_payload = []
                        for _f in _files_to_use:
                            _bytes = _f.getvalue()
                            _media_type = _f.type or "image/png"
                            _images_payload.append(
                                {
                                    "media_type": _media_type,
                                    "data": base64.b64encode(_bytes).decode("utf-8"),
                                }
                            )
                        _review_text = ai_client.analyze_thumbnail(
                            images=_images_payload,
                            notes=thumbnail_review_notes,
                            model=(selected_model or ai_client.DEFAULT_MODEL).strip(),
                            api_key=api_key_input,
                            api_key_env=provider_api_key_env,
                            timeout=min(float(request_timeout), 90.0),
                        )
                        st.session_state.thumbnail_review_result = {"ok": True, "text": _review_text}
                    except ai_client.AIClientError as exc:
                        st.session_state.thumbnail_review_result = {"ok": False, "text": str(exc)}
                    except Exception as exc:  # noqa: BLE001
                        st.session_state.thumbnail_review_result = {"ok": False, "text": f"Terjadi error tak terduga: {exc}"}

            _thumb_result = st.session_state.thumbnail_review_result
            if _thumb_result:
                if _thumb_result["ok"]:
                    st.success("Analisis thumbnail selesai.")
                    st.markdown(_thumb_result["text"])
                else:
                    st.error(_thumb_result["text"])


    with st.expander("📥 Sumber Konten", expanded=True):
        with st.container(border=True):
            youtube_url = st.text_input(
                "🔗 URL YouTube",
                placeholder="https://www.youtube.com/watch?v=XXXXXXXXXXX",
                help="Tempel link video YouTube. Transkrip & metadata video akan diambil otomatis.",
                key="youtube_url_input",
            ).strip()

            st.markdown('<div class="section-divider-label">atau</div>', unsafe_allow_html=True)

            uploaded_transcript = st.file_uploader(
                "📄 Upload Transkrip (Opsional)",
                type=["txt", "srt", "vtt"],
                help="Gunakan ini jika pengambilan transkrip otomatis gagal.",
            )

            pasted_transcript = st.text_area(
                "📋 Atau Paste Transkrip di Sini (Opsional)",
                placeholder="Copy-paste teks transkrip dari YouTube langsung ke sini...",
                height=180,
            )

        st.markdown(
            '<div style="font-size:0.72rem;font-weight:600;color:#8A8B8D;'
            'letter-spacing:0.03em;margin:12px 0 4px 2px;">🌐 PROXY YOUTUBE</div>',
            unsafe_allow_html=True,
        )
        show_proxy_opts = st.checkbox("Aktifkan opsi proxy (untuk atasi IP block)", value=False)
        proxy_mode_labels = {
            "none": "Tidak pakai proxy",
            "webshare": "Webshare (rotating residential proxy)",
            "generic": "Proxy HTTP/HTTPS biasa",
        }
        webshare_username, webshare_password = None, None
        webshare_locations_input = ""
        webshare_retries = 10
        generic_http_url, generic_https_url = None, None
        proxy_mode = "none"

        if show_proxy_opts:
            proxy_mode = st.selectbox(
                "Mode Proxy",
                options=["none", "webshare", "generic"],
                format_func=lambda m: proxy_mode_labels.get(m, m),
            )
            if proxy_mode == "webshare":
                webshare_username = st.text_input("Webshare Proxy Username", value=os.environ.get("YOUTUBE_WEBSHARE_USERNAME", ""))
                webshare_password = st.text_input("Webshare Proxy Password", type="password", value=os.environ.get("YOUTUBE_WEBSHARE_PASSWORD", ""))
                webshare_retries = st.slider("Jumlah Retry Saat IP Diblokir", min_value=1, max_value=10, value=10)
            elif proxy_mode == "generic":
                generic_http_url = st.text_input("HTTP Proxy URL", value=os.environ.get("YOUTUBE_HTTP_PROXY", ""))
                generic_https_url = st.text_input("HTTPS Proxy URL", value=os.environ.get("YOUTUBE_HTTPS_PROXY", ""))

        st.markdown(
            '<div style="font-size:0.72rem;font-weight:600;color:#8A8B8D;'
            'letter-spacing:0.03em;margin:14px 0 4px 2px;">🍪 COOKIE YOUTUBE</div>',
            unsafe_allow_html=True,
        )
        show_cookie_opts = st.checkbox("Aktifkan upload cookie (solusi 429/rate limit)", value=False)
        uploaded_cookie_file = None
        if show_cookie_opts:
            uploaded_cookie_file = st.file_uploader(
                "Upload file cookies.txt",
                type=["txt"],
                key="youtube_cookie_uploader",
            )


    with st.expander("🎭 Target Channel & Analytics", expanded=False):
        channel_options = channel_setting.get("channels", [])
        channel_labels = {c["id"]: f"{c.get('emoji', '')} {c['name']}" for c in channel_options}
        selected_channel_id = st.selectbox(
            "🎭 Target Channel",
            options=[c["id"] for c in channel_options],
            format_func=lambda cid: channel_labels.get(cid, cid),
        )
        selected_channel_desc = next((c["description"] for c in channel_options if c["id"] == selected_channel_id), "")
        st.caption(selected_channel_desc)

        _analytics_dir = os.path.join(os.path.dirname(__file__), "settings", "channel_analytics")
        os.makedirs(_analytics_dir, exist_ok=True)
        _analytics_cache_path = os.path.join(_analytics_dir, f"{selected_channel_id}.json")

        def _load_saved_analytics(path: str):
            if not os.path.exists(path):
                return None
            try:
                with open(path, "r", encoding="utf-8") as _f:
                    data = json.load(_f)
                s = analytics_parser.ChannelAnalyticsSummary(
                    channel_id=data.get("channel_id", selected_channel_id),
                    source_files=data.get("source_files", []),
                    total_videos_analyzed=data.get("total_videos_analyzed", 0),
                    avg_ctr_pct=data.get("avg_ctr_pct"),
                    avg_retention_pct=data.get("avg_retention_pct"),
                    avg_view_duration_seconds=data.get("avg_view_duration_seconds"),
                    avg_views_per_video=data.get("avg_views_per_video"),
                    avg_impressions_per_video=data.get("avg_impressions_per_video"),
                    notes=data.get("notes", []),
                )
                for v in data.get("top_videos_by_views", []):
                    s.top_videos_by_views.append(analytics_parser.VideoStat(**v))
                for v in data.get("top_videos_by_ctr", []):
                    s.top_videos_by_ctr.append(analytics_parser.VideoStat(**v))
                for v in data.get("top_videos_by_retention", []):
                    s.top_videos_by_retention.append(analytics_parser.VideoStat(**v))
                return s if not s.is_empty() else None
            except Exception:
                return None

        def _save_analytics(path: str, summary: analytics_parser.ChannelAnalyticsSummary):
            def _stat_to_dict(stat):
                return {
                    "title": stat.title, "views": stat.views, "watch_time_hours": stat.watch_time_hours,
                    "impressions": stat.impressions, "ctr_pct": stat.ctr_pct, "avg_duration_seconds": stat.avg_duration_seconds,
                    "avg_pct_viewed": stat.avg_pct_viewed, "subscribers_gained": stat.subscribers_gained,
                    "likes": stat.likes, "comments": stat.comments,
                }
            data = {
                "channel_id": summary.channel_id, "source_files": summary.source_files,
                "total_videos_analyzed": summary.total_videos_analyzed, "avg_ctr_pct": summary.avg_ctr_pct,
                "avg_retention_pct": summary.avg_retention_pct, "avg_view_duration_seconds": summary.avg_view_duration_seconds,
                "avg_views_per_video": summary.avg_views_per_video, "avg_impressions_per_video": summary.avg_impressions_per_video,
                "notes": summary.notes, "top_videos_by_views": [_stat_to_dict(v) for v in summary.top_videos_by_views],
                "top_videos_by_ctr": [_stat_to_dict(v) for v in summary.top_videos_by_ctr],
                "top_videos_by_retention": [_stat_to_dict(v) for v in summary.top_videos_by_retention],
            }
            with open(path, "w", encoding="utf-8") as _f:
                json.dump(data, _f, ensure_ascii=False, indent=2)

        saved_analytics = _load_saved_analytics(_analytics_cache_path)

        st.markdown(
            '<div style="font-size:0.78rem;font-weight:600;color:#8A8B8D;letter-spacing:0.03em;margin:10px 0 6px 0;border-top:1px solid rgba(255,255,255,0.08);padding-top:10px;">📊 ANALYTICS CHANNEL</div>',
            unsafe_allow_html=True,
        )
        
        if saved_analytics:
            st.success(f"✅ Analytics **{channel_labels.get(selected_channel_id, selected_channel_id)}** sudah tersimpan.")
            if st.button("🗑️ Hapus data analytics channel ini", key="del_analytics"):
                try:
                    os.remove(_analytics_cache_path)
                    st.rerun()
                except Exception:
                    st.error("Gagal menghapus file analytics.")

        uploaded_analytics_files = st.file_uploader(
            "Upload / perbarui analytics (.csv atau .zip berisi beberapa .csv)",
            type=["csv", "zip"],
            accept_multiple_files=True,
            key=f"analytics_uploader_{selected_channel_id}",
        )
        if uploaded_analytics_files:
            _file_tuples: list = []
            for _f in uploaded_analytics_files:
                _raw = _f.read()
                _file_tuples.append((_f.name, _raw))

            _new_summary, _new_warnings = analytics_parser.process_uploaded_analytics(
                channel_id=selected_channel_id,
                uploaded_files=_file_tuples,
            )
            if not _new_summary.is_empty():
                _save_analytics(_analytics_cache_path, _new_summary)
                st.success("✅ Analytics disimpan. Akan otomatis digunakan untuk analisis berikutnya.")
                saved_analytics = _new_summary

        channel_analytics_summary = saved_analytics


    with st.expander("📦 Format Output", expanded=True):
        output_types = duration_setting.get("output_types", [])
        output_type_ids = [ot["id"] for ot in output_types]

        _ot_key = "selected_output_type_id_state"
        if _ot_key not in st.session_state:
            st.session_state[_ot_key] = output_type_ids[0] if output_type_ids else None

        selected_output_type_id = st.radio(
            "Output Type",
            options=output_type_ids,
            format_func=lambda oid: next((f"{o.get('emoji','')} {o['label']}" for o in output_types if o["id"] == oid), oid),
            label_visibility="collapsed",
            key=_ot_key,
        )

        selected_output_type = next(ot for ot in output_types if ot["id"] == selected_output_type_id)
        duration_options = selected_output_type.get("durations", [])
        duration_labels  = {d["id"]: d["label"] for d in duration_options}

        st.markdown('<div style="font-size:0.72rem;font-weight:600;color:#8A8B8D;letter-spacing:0.04em;margin:0 0 8px 0;">⏱ DURASI</div>', unsafe_allow_html=True)

        _dur_key = "selected_duration_id_state"
        _dur_ids  = [d["id"] for d in duration_options]
        if _dur_key not in st.session_state or st.session_state[_dur_key] not in _dur_ids:
            st.session_state[_dur_key] = _dur_ids[0] if _dur_ids else None

        selected_duration_id = st.radio(
            "Pilih Durasi",
            options=_dur_ids,
            format_func=lambda did: duration_labels.get(did, did),
            horizontal=True,
            label_visibility="collapsed",
            key=_dur_key,
        )

        _sel_dur_opt = next((d for d in duration_options if d["id"] == selected_duration_id), {})
        _min_s = _sel_dur_opt.get("min_seconds")
        _max_s = _sel_dur_opt.get("max_seconds")

        if selected_duration_id != "custom" and _min_s is not None and _max_s is not None:
            def _fmt_sec(s):
                if s < 120: return f"{s} dtk"
                elif s < 3600:
                    m, r = s // 60, s % 60
                    return f"{m}:{r:02d} mnt" if r else f"{m} mnt"
                else:
                    return (f"{s/3600:.1f}".rstrip("0").rstrip(".")) + " jam"

            _total_max = 14400
            _pct_min   = max(0, int(_min_s / _total_max * 100))
            _pct_max   = min(100, int(_max_s / _total_max * 100))
            _width_pct = max(2, _pct_max - _pct_min)
            
            dur_html = f"""<div style="margin:4px 0 14px 0;">
<div style="position:relative;height:8px;border-radius:999px;background:rgba(255,255,255,0.06);margin-bottom:7px;overflow:hidden;">
<div style="position:absolute;left:{_pct_min}%;width:{_width_pct}%;height:100%;border-radius:999px;background:#2383E2;"></div>
</div>
<div style="display:flex;justify-content:space-between;align-items:center;font-size:0.7rem;color:#4A4B4D;font-weight:500;">
<span>0</span>
<span style="background:rgba(35,131,226,0.12);border:1px solid rgba(35,131,226,0.25);color:#2383E2;font-weight:600;font-size:0.72rem;padding:2px 10px;border-radius:999px;">⏱ {_fmt_sec(_min_s)} – {_fmt_sec(_max_s)}</span>
<span>4 jam</span>
</div>
</div>"""
            st.markdown(dur_html, unsafe_allow_html=True)

        custom_duration_label = None
        if selected_duration_id == "custom":
            custom_duration_label = st.text_input("Durasi Custom", placeholder="contoh: 2 jam 30 menit", label_visibility="collapsed")

        final_duration_label     = custom_duration_label or duration_labels.get(selected_duration_id, "")
        target_min_seconds       = _sel_dur_opt.get("min_seconds")
        target_max_seconds       = _sel_dur_opt.get("max_seconds")

        shot_count = None
        shot_count_setting = selected_output_type.get("shot_count", {})
        if shot_count_setting.get("enabled"):
            shot_count = st.number_input(
                shot_count_setting.get("label", "🎯 Jumlah Shots/Segmen"),
                min_value=int(shot_count_setting.get("min", 1)),
                max_value=int(shot_count_setting.get("max", 10)),
                value=int(shot_count_setting.get("default", 3)),
                step=1,
            )

    with st.expander("✂️ Segment & Catatan", expanded=False):
        segment_modes      = duration_setting.get("segment_modes", [])
        segment_mode_labels = {sm["id"]: sm["label"] for sm in segment_modes}
        _seg_ids = [sm["id"] for sm in segment_modes]

        _seg_key = "selected_segment_mode_id_state"
        if _seg_key not in st.session_state or st.session_state[_seg_key] not in _seg_ids:
            st.session_state[_seg_key] = _seg_ids[0] if _seg_ids else None

        st.markdown('<div style="font-size:0.72rem;font-weight:600;color:#8A8B8D;letter-spacing:0.04em;margin:0 0 7px 0;">🎯 SEGMENT MODE</div>', unsafe_allow_html=True)

        selected_segment_mode_id = st.radio(
            "Segment Mode",
            options=_seg_ids,
            format_func=lambda sid: segment_mode_labels.get(sid, sid),
            label_visibility="collapsed",
            key=_seg_key,
        )

        manual_start, manual_end = None, None
        if selected_segment_mode_id == "manual":
            col_start, col_end = st.columns(2)
            with col_start:
                manual_start = st.text_input("Start Time", placeholder="00:30")
            with col_end:
                manual_end = st.text_input("End Time", placeholder="01:15")

        extra_notes = st.text_area("Catatan Tambahan", placeholder="Misalnya: fokuskan ke topik X...", label_visibility="collapsed")

    run_button = st.button("🚀 Jalankan Analisis", type="primary", use_container_width=True)


# ---------------------------------------------------------------------------
# Pipeline eksekusi saat tombol ditekan
# ---------------------------------------------------------------------------

def run_pipeline() -> None:
    st.session_state.last_error = None
    st.session_state.analysis_result = None
    st.session_state.raw_ai_text = None
    st.session_state.web_sources = []
    st.session_state.duration_warnings = []
    st.session_state.selected_shot_index = 0

    if not youtube_url and not uploaded_transcript and not (pasted_transcript and pasted_transcript.strip()):
        st.session_state.last_error = "Mohon isi URL YouTube, upload transkrip, atau paste transkrip terlebih dahulu."
        return

    if not selected_model or not selected_model.strip():
        st.session_state.last_error = "Mohon isi ID Model AI terlebih dahulu (lihat sidebar)."
        return

    progress_placeholder = st.empty()
    total_steps = 5
    ui.step_progress(0, total_steps, "Memulai pipeline analisis...", progress_placeholder)

    proxy_setting = youtube_utils.ProxySetting(
        mode=proxy_mode,
        http_url=generic_http_url,
        https_url=generic_https_url,
        webshare_username=webshare_username,
        webshare_password=webshare_password,
    )

    try:
        proxy_config = youtube_utils.build_proxy_config(proxy_setting)
    except youtube_utils.YouTubeUtilsError as exc:
        st.session_state.last_error = str(exc)
        return

    try:
        video_title = ""
        transcript_text = ""

        # Step 1: Ambil metadata + transkrip
        ui.step_progress(1, total_steps, "Mengambil data video / transkrip...", progress_placeholder)

        if uploaded_transcript is not None:
            raw_bytes = uploaded_transcript.read()
            transcript_text = raw_bytes.decode("utf-8", errors="ignore")
            if youtube_url:
                try:
                    meta = youtube_utils.get_video_metadata(youtube_url)
                    video_title = meta.get("title", "")
                except youtube_utils.YouTubeUtilsError:
                    video_title = ""
        elif pasted_transcript and pasted_transcript.strip():
            transcript_text = pasted_transcript.strip()
            if youtube_url:
                try:
                    meta = youtube_utils.get_video_metadata(youtube_url)
                    video_title = meta.get("title", "")
                except youtube_utils.YouTubeUtilsError:
                    video_title = ""
        else:
            video_id = youtube_utils.extract_video_id(youtube_url)
            if not video_id:
                raise youtube_utils.YouTubeUtilsError(
                    "URL YouTube tidak valid. Pastikan formatnya benar."
                )

            try:
                meta = youtube_utils.get_video_metadata(youtube_url)
                video_title = meta.get("title", "")
            except youtube_utils.YouTubeUtilsError:
                video_title = ""

            _cookie_path = None
            if uploaded_cookie_file is not None:
                try:
                    _cookie_bytes = uploaded_cookie_file.read()
                    uploaded_cookie_file.seek(0)
                    _tmp = tempfile.NamedTemporaryFile(mode='wb', suffix='.txt', delete=False)
                    _tmp.write(_cookie_bytes)
                    _tmp.flush()
                    _tmp.close()
                    _cookie_path = _tmp.name
                except Exception:
                    _cookie_path = None

            try:
                video_transcript = youtube_utils.get_video_transcript(
                    video_id, proxy_config=proxy_config, cookie_path=_cookie_path, max_retries=3
                )
            finally:
                if _cookie_path and os.path.exists(_cookie_path):
                    try:
                        os.unlink(_cookie_path)
                    except Exception:
                        pass

            if selected_segment_mode_id == "manual" and manual_start and manual_end:
                start_sec = youtube_utils.parse_time_to_seconds(manual_start)
                end_sec = youtube_utils.parse_time_to_seconds(manual_end)
                if start_sec is not None and end_sec is not None and end_sec > start_sec:
                    video_transcript = video_transcript.slice_by_time(start_sec, end_sec)

            transcript_text = video_transcript.full_text

        if not transcript_text.strip():
            raise youtube_utils.YouTubeUtilsError("Transkrip kosong setelah diproses.")

        # Step 2: Bangun system prompt gabungan
        ui.step_progress(2, total_steps, "Menyusun system prompt (modul AI)...", progress_placeholder)
        system_prompt = prompt_loader.build_system_prompt(selected_channel_id)

        # Step 3: Bangun user content
        ui.step_progress(3, total_steps, "Menyiapkan konteks transkrip & setting...", progress_placeholder)
        analytics_text = ""
        analytics_short_text = ""
        if channel_analytics_summary and not channel_analytics_summary.is_empty() and channel_analytics_summary.channel_id == selected_channel_id:
            analytics_text = channel_analytics_summary.to_prompt_text()
            analytics_short_text = channel_analytics_summary.to_short_summary()

        user_content = ai_client.build_user_content(
            video_title=video_title,
            transcript_text=transcript_text,
            output_type=selected_output_type.get("label", selected_output_type_id),
            duration_label=final_duration_label,
            segment_mode=segment_mode_labels.get(selected_segment_mode_id, selected_segment_mode_id),
            manual_start=manual_start,
            manual_end=manual_end,
            extra_notes=extra_notes,
            shot_count=shot_count,
            target_min_seconds=target_min_seconds,
            target_max_seconds=target_max_seconds,
            analytics_text=analytics_text,
            analytics_short_text=analytics_short_text,
        )

        # Step 4: Panggil AI
        ui.step_progress(4, total_steps, f"Memanggil {provider_labels.get(selected_provider_id, selected_provider_id)} untuk analisis & generasi konten...", progress_placeholder)
        computed_max_tokens = ai_client.DEFAULT_MAX_TOKENS
        if shot_count:
            computed_max_tokens = max(computed_max_tokens, 6000 + int(shot_count) * 1800)
        computed_max_tokens = min(computed_max_tokens, 32000)

        request = ai_client.AnalysisRequest(
            system_prompt=system_prompt,
            user_content=user_content,
            model=selected_model.strip(),
            mode=provider_mode,
            base_url=base_url_input,
            max_tokens=computed_max_tokens,
            timeout=float(request_timeout),
            enable_web_search=enable_web_search,
            web_search_max_uses=web_search_max_uses,
            enable_thinking=enable_thinking,
            thinking_budget_tokens=thinking_budget_tokens,
            enable_code_execution=enable_code_execution,
        )
        raw_text, web_sources = ai_client.run_analysis(request, api_key=api_key_input, api_key_env=provider_api_key_env)
        st.session_state.raw_ai_text = raw_text
        st.session_state.web_sources = web_sources

        # Step 5: Parse hasil
        ui.step_progress(5, total_steps, "Mem-parsing hasil & menyiapkan tampilan...", progress_placeholder)
        result = ai_parser.parse_ai_response(raw_text)

        result = ai_parser.enforce_shot_count(result, shot_count)
        shot_segments_for_check = ai_parser.get_shot_segment_list(result)
        duration_warnings = ai_parser.check_segment_duration_mismatch(
            shot_segments_for_check, target_min_seconds, target_max_seconds
        )

        actual_shot_total = len(result.get("shots", []) or [])
        if shot_count and actual_shot_total < shot_count:
            duration_warnings.insert(
                0,
                f"Diminta {shot_count} shots, tetapi AI hanya menghasilkan {actual_shot_total} shot."
            )

        st.session_state.analysis_result = result
        st.session_state.duration_warnings = duration_warnings if selected_output_type_id == "shorts" else []

        st.session_state.run_context = {
            "output_type_id": selected_output_type_id,
            "output_type_label": selected_output_type.get("label", selected_output_type_id),
            "shot_count": shot_count,
            "duration_label": final_duration_label,
            "target_min_seconds": target_min_seconds,
            "target_max_seconds": target_max_seconds,
        }

        ui.step_progress(total_steps, total_steps, "Analisis Selesai! Konten siap.", progress_placeholder)

    except (youtube_utils.YouTubeUtilsError, ai_client.AIClientError, ai_parser.AIResponseParseError) as exc:
        st.session_state.last_error = str(exc)
    except Exception as exc:
        st.session_state.last_error = f"Terjadi error tak terduga: {exc}"


if run_button:
    run_pipeline()


# ---------------------------------------------------------------------------
# Render error (jika ada)
# ---------------------------------------------------------------------------

if st.session_state.last_error:
    st.error(st.session_state.last_error)

    if st.session_state.raw_ai_text:
        with st.expander("🔎 Lihat respons mentah dari AI (untuk debugging)"):
            st.code(st.session_state.raw_ai_text, language="json")


# ---------------------------------------------------------------------------
# Render hasil analisis
# ---------------------------------------------------------------------------

result = st.session_state.analysis_result

if result is None and not st.session_state.last_error:
    st.info("👈 Isi pengaturan di sidebar, lalu klik **Jalankan Analisis**.")

if result:
    run_ctx = st.session_state.get("run_context", {}) or {}
    is_shorts_run = run_ctx.get("output_type_id") == "shorts"

    sections = output_setting.get("sections", [])
    tab_titles = []
    _group_seen = []
    for s in sections:
        if s["key"] == "segmen":
            tab_titles.append("✂️ Shots" if is_shorts_run else "🎯 Momen Terbaik")
        else:
            tab_titles.append(f"{s['emoji']} {s['label']}")
        _grp = s.get("group")
        if _grp and _grp not in _group_seen:
            _group_seen.append(_grp)

    if _group_seen:
        group_chips_inner = "".join(
            f'<span style="display:inline-flex;align-items:center;gap:6px;font-size:0.72rem;color:#8A8B8D;letter-spacing:0.03em;margin-right:18px;"><span style="width:6px;height:6px;border-radius:50%;background:#2383E2;display:inline-block;"></span>{g.upper()}</span>'
            for g in _group_seen
        )
        st.markdown(f'<div style="margin:4px 0 2px 2px;">{group_chips_inner}</div>', unsafe_allow_html=True)

    color_type = "#3B82F6" if is_shorts_run else "#22C55E"
    mode_text = "✂️ Mode: Klip Terpisah" if is_shorts_run else "🎬 Mode: Video Utuh"
    shots_badge = f"""<div style="background: rgba(107, 114, 128, 0.15); color: var(--md3-text_1); padding: 6px 14px; border-radius: 8px; font-size: 0.8rem; font-weight: 600; border: 1px solid var(--md3-border_1); display: flex; align-items: center; gap: 6px;">🎯 {run_ctx.get('shot_count')} shots diminta</div>""" if (is_shorts_run and run_ctx.get("shot_count")) else ""

    html_bento = f"""<div style="background: var(--md3-bg_1); border: 1px solid var(--md3-border_1); border-radius: 14px; padding: 16px 20px; margin-bottom: 24px; display: flex; flex-wrap: wrap; align-items: center; gap: 12px; box-shadow: var(--md3-shadow_sm);">
<div style="margin-right: auto; font-size: 0.75rem; font-weight: 700; color: var(--md3-text_2); letter-spacing: 1px; text-transform: uppercase;">PARAMETER ANALISIS:</div>
<div style="background: {color_type}20; color: {color_type}; padding: 6px 14px; border-radius: 8px; font-size: 0.8rem; font-weight: 700; border: 1px solid {color_type}40; display: flex; align-items: center; gap: 6px;">📦 {run_ctx.get('output_type_label', '-')}</div>
<div style="background: rgba(245, 158, 11, 0.15); color: #F59E0B; padding: 6px 14px; border-radius: 8px; font-size: 0.8rem; font-weight: 700; border: 1px solid rgba(245, 158, 11, 0.3); display: flex; align-items: center; gap: 6px;">⏱️ {run_ctx.get('duration_label', '-')}</div>
{shots_badge}
<div style="background: var(--md3-bg_2); color: var(--md3-text_1); padding: 6px 14px; border-radius: 8px; font-size: 0.8rem; font-weight: 600; border: 1px solid var(--md3-border_1); display: flex; align-items: center; gap: 6px;">{mode_text}</div>
</div>"""
    st.markdown(html_bento, unsafe_allow_html=True)

    duration_warnings = st.session_state.get("duration_warnings") or []
    if duration_warnings:
        with st.expander(f"⚠️ {len(duration_warnings)} peringatan kecocokan durasi (klik untuk lihat)", expanded=False):
            for w in duration_warnings:
                st.warning(w)

    shots_list = result.get("shots", []) or []
    video_panjang_packet = result.get("video_panjang", {}) or {}

    active_packet: dict = {}
    selected_shot_label = None

    if is_shorts_run:
        if shots_list:
            max_idx = len(shots_list) - 1
            if st.session_state.selected_shot_index > max_idx:
                st.session_state.selected_shot_index = 0

            def _shot_option_label(idx: int) -> str:
                shot = shots_list[idx] if idx < len(shots_list) else {}
                seg = shot.get("segmen", {}) if isinstance(shot, dict) else {}
                judul_preview = ""
                if isinstance(shot, dict):
                    judul_preview = (shot.get("judul", {}) or {}).get("best_choice", "")
                preview = f" — {judul_preview[:40]}{'…' if len(judul_preview) > 40 else ''}" if judul_preview else ""
                return f"🎬 Shot {shot.get('shot_number', idx + 1)} ({seg.get('start_time', '-')}→{seg.get('end_time', '-')}){preview}"

            _current_idx = st.session_state.selected_shot_index
            _chosen_idx = st.selectbox(
                "🎯 Pilih Shot yang Ditampilkan di Bawah",
                options=list(range(len(shots_list))),
                format_func=_shot_option_label,
                index=_current_idx,
            )
            if _chosen_idx != st.session_state.selected_shot_index:
                st.session_state.selected_shot_index = _chosen_idx
                st.rerun()

            active_packet = shots_list[st.session_state.selected_shot_index] or {}
            selected_shot_label = _shot_option_label(st.session_state.selected_shot_index)
            ui.badge(f"📦 Sedang menampilkan: {selected_shot_label}", "#22C55E")
        else:
            st.warning("⚠️ AI tidak menghasilkan satu pun shot pada array `shots`.")
    else:
        active_packet = video_panjang_packet
        if not active_packet:
            st.warning("⚠️ AI tidak mengisi object `video_panjang`.")

    st.divider()

    web_sources = st.session_state.get("web_sources") or []
    if web_sources:
        with st.expander(f"🔍 Sumber Riset Web yang Dipakai AI ({len(web_sources)} sumber)", expanded=False):
            for i, src in enumerate(web_sources, start=1):
                title = src.get("title") or src.get("url", "")
                url = src.get("url", "")
                if url:
                    st.markdown(f"{i}. [{title}]({url})")
                else:
                    st.markdown(f"{i}. {title}")

    tabs = st.tabs(tab_titles)
    tab_map = {s["key"]: tabs[i] for i, s in enumerate(sections)}

    with tab_map["ringkasan"]:
        ringkasan = result.get("ringkasan", {})
        st.subheader("📊 Ringkasan Video Sumber")
        col1, col2 = st.columns(2)
        with col1:
            st.markdown(f"**Judul Video Sumber:** {ringkasan.get('judul_video_sumber', '-')}")
            st.markdown(f"**Ide Utama:** {ringkasan.get('ide_utama', '-')}")
            st.markdown(f"**Hook Sumber:** {ringkasan.get('hook_sumber', '-')}")
        with col2:
            st.markdown(f"**Opening Terbaik:** {ringkasan.get('opening_terbaik', '-')}")
            st.markdown(f"**Estimasi Durasi Video Sumber:** {ringkasan.get('durasi_estimasi', '-')}")

        with st.expander("🧩 Struktur Video Sumber"):
            st.write(ringkasan.get("struktur_video", "-"))

        st.divider()
        st.subheader("🧠 Psikologi Audiens")
        psi = result.get("psikologi_audiens", {})

        col1, col2 = st.columns(2)
        with col1:
            st.markdown("**Pain Point**")
            for p in psi.get("pain_point", []) or ["-"]:
                st.markdown(f"- {p}")
            st.markdown("**Desire**")
            for d in psi.get("desire", []) or ["-"]:
                st.markdown(f"- {d}")
        with col2:
            st.markdown("**Fear**")
            for f_ in psi.get("fear", []) or ["-"]:
                st.markdown(f"- {f_}")
            st.markdown("**Hope**")
            for h in psi.get("hope", []) or ["-"]:
                st.markdown(f"- {h}")

    with tab_map["strategi"]:
        strat = active_packet.get("strategi_konten", {}) or {}
        st.subheader("🎯 Strategi Konten Baru")
        st.markdown(f"**Big Idea:** {strat.get('big_idea', '-')}")
        st.markdown(f"**Unique Angle:** {strat.get('unique_angle', '-')}")
        st.markdown(f"**Hook Baru:** {strat.get('hook_baru', '-')}")
        st.markdown(f"**CTA:** {strat.get('cta', '-')}")

        if not is_shorts_run:
            st.divider()
            st.markdown("### 🌅 Rekomendasi Opening 60 Detik (Video Baru)")
            opening = strat.get("opening_60_detik", {}) or {}
            if opening:
                cols_open = st.columns([2, 8])
                with cols_open[0]:
                    ui.badge(f"⏱️ {opening.get('start_time', '00:00')} → {opening.get('end_time', '01:00')}", "#3B82F6")
                with cols_open[1]:
                    klip_list = opening.get("klip", [])
                    if klip_list:
                        for klip in klip_list:
                            vb_start = klip.get("video_baru_start", "-")
                            vb_end   = klip.get("video_baru_end", "-")
                            src_start = klip.get("sumber_start", "-")
                            src_end   = klip.get("sumber_end", "-")
                            narasi    = klip.get("narasi_sumber", "-")
                            catatan   = klip.get("catatan_editing", "")
                            st.markdown(f"**`{vb_start}–{vb_end}` (Video Baru)** ← 📹 Ambil dari Video Sumber `{src_start}–{src_end}`")
                            st.markdown(f"> _{narasi}_")
                            if catatan:
                                st.caption(f"🎬 {catatan}")
                            st.markdown("---")
                    else:
                        st.write(opening.get("isi_rekomendasi", "-"))
                st.caption(f"💡 Alasan: {opening.get('alasan', '-')}")

        outline = strat.get("outline", [])
        if is_shorts_run:
            st.markdown("**⏩ Beat Timeline (urutan ketat, jangan molor):**")
            if outline:
                n_beats = len(outline)
                for i, ob in enumerate(outline, start=1):
                    babak = ob.get("babak", "-") if isinstance(ob, dict) else str(ob)
                    isi = ob.get("isi", "-") if isinstance(ob, dict) else ""
                    cols = st.columns([1, 9])
                    with cols[0]:
                        ui.badge(f"#{i}/{n_beats}", "#3B82F6")
                    with cols[1]:
                        st.markdown(f"**{babak}** — {isi}")
            else:
                st.write("-")
        else:
            st.markdown("**📑 Outline / Chapter (dengan estimasi menit di video BARU):**")
            if outline:
                for i, ob in enumerate(outline, start=1):
                    if isinstance(ob, dict):
                        start_est = ob.get("start_estimate", "-")
                        end_est = ob.get("end_estimate", "-")
                        cols = st.columns([2, 8])
                        with cols[0]:
                            ui.badge(f"⏱️ {start_est} → {end_est}", "#6B7280")
                        with cols[1]:
                            st.markdown(f"**Babak {i}: {ob.get('babak', '-')}**")
                            st.write(ob.get("isi", "-"))
                            sumber_segmen = ob.get("sumber_segmen", []) or []
                            if sumber_segmen:
                                for seg in sumber_segmen:
                                    if not isinstance(seg, dict): continue
                                    s_start = seg.get("start", "-")
                                    s_end = seg.get("end", "-")
                                    s_note = seg.get("catatan", "")
                                    note_suffix = f" — _{s_note}_" if s_note else ""
                                    st.caption(f"📹 Ambil dari Video `{s_start}–{s_end}`{note_suffix}")
                    else:
                        st.markdown(f"**Babak {i}**")
                        st.write(ob)
                    if i < len(outline):
                        st.markdown("---")

        st.divider()
        st.subheader("📈 Skor Growth Video Sumber")
        ui.render_score_grid(result.get("skor_growth", {}))

    with tab_map["segmen"]:
        if is_shorts_run:
            st.subheader("✂️ Shots Siap Dipotong")
            target_min_seconds = run_ctx.get("target_min_seconds")
            target_max_seconds = run_ctx.get("target_max_seconds")

            for i, shot in enumerate(shots_list, start=1):
                seg = shot.get("segmen", {}) if isinstance(shot, dict) else {}
                start_s = ai_parser.parse_mmss_to_seconds(seg.get("start_time"))
                end_s = ai_parser.parse_mmss_to_seconds(seg.get("end_time"))
                is_mismatch = False
                if start_s is not None and end_s is not None and (target_min_seconds or target_max_seconds):
                    actual = end_s - start_s
                    lo = (target_min_seconds or target_max_seconds or 0) - 8
                    hi = (target_max_seconds or target_min_seconds or 0) + 8
                    is_mismatch = actual <= 0 or actual < lo or actual > hi
                status_badge = "⚠️ Durasi Tidak Sesuai" if is_mismatch else "✅ Durasi Sesuai"
                is_active = (i - 1) == st.session_state.selected_shot_index
                header_prefix = "👁️ " if is_active else "🎬 "
                with st.expander(
                    f"{header_prefix}Shot {shot.get('shot_number', i)}: {seg.get('start_time', '-')} → "
                    f"{seg.get('end_time', '-')} ({seg.get('durasi', '-')}) · {status_badge}",
                    expanded=is_active,
                ):
                    st.write(seg.get("alasan", "-"))
                    if not is_active:
                        if st.button(f"👁️ Lihat Shot {shot.get('shot_number', i)}", key=f"view_shot_{i}"):
                            st.session_state.selected_shot_index = i - 1
                            st.rerun()
        else:
            momen_list = video_panjang_packet.get("momen_highlight_sumber", []) or []
            st.subheader("🎯 Momen / Highlight Terbaik")
            for i, seg in enumerate(momen_list, start=1):
                with st.expander(f"🔖 Momen {i}: {seg.get('start_time', '-')} → {seg.get('end_time', '-')} ({seg.get('durasi', '-')})"):
                    st.write(seg.get("alasan", "-"))

    with tab_map["judul"]:
        judul = active_packet.get("judul", {}) or {}
        st.subheader("🏆 Opsi Judul")
        opsi = judul.get("opsi", [])
        best_choice = judul.get("best_choice", "")
        ideal_max_chars = 40 if is_shorts_run else 70

        for j in opsi:
            is_best = j == best_choice
            char_len = len(j)
            is_too_long = char_len > ideal_max_chars
            cols = st.columns([7, 2, 2])
            with cols[0]:
                st.code(j, language="text")
            with cols[1]:
                ui.badge(f"{char_len} karakter", "#EF4444" if is_too_long else "#6B7280")
            with cols[2]:
                if is_best:
                    ui.badge("⭐ BEST CHOICE", "#22C55E")

    with tab_map["thumbnail"]:
        thumb = active_packet.get("thumbnail", {}) or {}
        st.subheader("🖼 Konsep Thumbnail")
        aspect_ratio_label = "9:16 (Vertikal)" if is_shorts_run else "16:9 (Horizontal)"
        ui.badge(f"📐 Rasio Aspek: {aspect_ratio_label}", "#3B82F6")
        
        preview_w, preview_h = (220, 391) if is_shorts_run else (391, 220)
        preview_text = thumb.get("teks_thumbnail", "-") or "-"
        
        thumb_html = f"""<div style="width:{preview_w}px;height:{preview_h}px;background:linear-gradient(135deg,#1F2937,#374151);border:2px dashed #6B7280;border-radius:10px;display:flex;align-items:center;justify-content:center;text-align:center;padding:10px;margin:8px 0;">
<span style="color:#FAFAFA;font-weight:700;font-size:1.05rem;">{preview_text}</span>
</div>"""
        st.markdown(thumb_html, unsafe_allow_html=True)
        st.markdown(f"**Konsep:** {thumb.get('konsep', '-')}")
        st.markdown(f"**Komposisi:** {thumb.get('komposisi', '-')}")

    with tab_map["deskripsi"]:
        st.subheader("📝 Deskripsi YouTube")
        deskripsi_text = active_packet.get("deskripsi_youtube", "-")
        ui.copy_block(deskripsi_text)

    with tab_map["seo"]:
        seo = active_packet.get("seo", {}) or {}
        st.subheader("🔍 Paket SEO")
        st.markdown("**Keyword Utama**")
        for kw in seo.get("keyword_utama", []) or ["-"]:
            ui.badge(kw, "#F59E0B")
        st.markdown("**Tags (siap copy)**")
        ui.copy_block(", ".join(seo.get("tags", []) or []))
        st.markdown("**Hashtags (siap copy)**")
        ui.copy_block(" ".join(seo.get("hashtags", []) or []))

    with tab_map["editing"]:
        st.subheader("🎞 Rekomendasi Editing")
        editing = active_packet.get("editing", {}) or {}
        rekom = editing.get("rekomendasi", [])
        if rekom:
            for r in rekom:
                st.markdown(f"- {r}")

    with tab_map["prediksi"]:
        st.subheader("📈 Prediksi Performa")
        prediksi = active_packet.get("prediksi_performa", {}) or {}
        skor_keseluruhan = prediksi.get("skor_keseluruhan", 0)
        st.metric("Skor Keseluruhan", f"{skor_keseluruhan}/10")
        st.write(prediksi.get("ringkasan", "-"))

    with tab_map["checklist"]:
        st.subheader("✅ Checklist Siap Upload")
        ai_checklist = active_packet.get("checklist", []) or []
        ui.render_checklist(list(ai_checklist))

    st.divider()
    with st.expander("🧾 Lihat JSON mentah hasil analisis"):
        st.json(result)

footer_text = ui_setting.get("footer_text", "")
footer_html = f"""<footer class="app-footer">{footer_text}</footer>"""
st.markdown(footer_html, unsafe_allow_html=True)
