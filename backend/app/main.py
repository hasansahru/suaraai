from __future__ import annotations
import json
import os
from typing import Any, Dict, List, Optional
from fastapi import FastAPI, HTTPException, Body, UploadFile, File, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.utils import prompt_loader
from app.utils import youtube_utils
from app.utils import ai_client
from app.utils import parser as ai_parser
from app.utils import auth as auth_utils

app = FastAPI(title="AI YouTube Content Intelligence API")


# ── Startup: init default admin ──────────────────────────────
@app.on_event("startup")
async def startup_init():
    try:
        auth_utils.init_default_admin()
    except Exception as e:
        print(f"Warning: Gagal init default admin: {e}")


# ── Auth dependency ──────────────────────────────────────────
async def get_current_user(
    authorization: Optional[str] = Header(None),
) -> auth_utils.UserInfo:
    """Dependency untuk endpoint yang membutuhkan autentikasi."""
    if not authorization:
        raise HTTPException(status_code=401, detail="Token tidak ditemukan. Silakan login.")
    
    # Format: "Bearer <token>"
    parts = authorization.split(" ", 1)
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status_code=401, detail="Format token tidak valid. Gunakan 'Bearer <token>'.")
    
    token = parts[1]
    try:
        return auth_utils.verify_token(token)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SETTINGS_DIR = os.path.join(BASE_DIR, "settings")

def load_json_setting(filename: str) -> dict:
    path = os.path.join(SETTINGS_DIR, filename)
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

@app.get("/health")
async def health_check():
    """Endpoint untuk monitoring — dipakai oleh UptimeRobot agar Space tidak sleep."""
    return {"status": "ok", "message": "Backend aktif"}

@app.get("/api/settings")

async def get_settings():
    try:
        return {
            "ui": load_json_setting("ui_setting.json"),
            "duration": load_json_setting("duration_setting.json"),
            "output": load_json_setting("output_setting.json"),
            "channel": load_json_setting("channel_setting.json"),
            "ai_provider": load_json_setting("ai_provider_setting.json"),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal memuat konfigurasi: {e}")

@app.get("/api/channels")
async def get_channels():
    try:
        return prompt_loader.get_available_channels()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal memuat daftar channel: {e}")

@app.get("/api/channels/{channel_id}/analytics")
async def get_channel_analytics(channel_id: str):
    analytics_dir = os.path.join(SETTINGS_DIR, "channel_analytics")
    cache_path = os.path.join(analytics_dir, f"{channel_id}.json")
    if os.path.exists(cache_path):
        try:
            with open(cache_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            return {"exists": True, "summary": data}
        except Exception:
            pass
    return {"exists": False}

@app.delete("/api/channels/{channel_id}/analytics")
async def delete_channel_analytics(channel_id: str):
    analytics_dir = os.path.join(SETTINGS_DIR, "channel_analytics")
    cache_path = os.path.join(analytics_dir, f"{channel_id}.json")
    if os.path.exists(cache_path):
        try:
            os.remove(cache_path)
            return {"status": "success"}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Gagal menghapus file: {e}")
    return {"status": "success"}

@app.post("/api/channels/{channel_id}/analytics")
async def upload_channel_analytics(channel_id: str, file: UploadFile = File(...)):
    try:
        from app.utils import analytics_parser
        file_content = await file.read()
        
        file_tuples = [(file.filename, file_content)]
        summary, warnings = analytics_parser.process_uploaded_analytics(
            channel_id=channel_id,
            uploaded_files=file_tuples
        )
        
        if summary.is_empty():
            raise HTTPException(status_code=400, detail="Data analytics kosong atau format tidak didukung.")
            
        analytics_dir = os.path.join(SETTINGS_DIR, "channel_analytics")
        os.makedirs(analytics_dir, exist_ok=True)
        cache_path = os.path.join(analytics_dir, f"{channel_id}.json")
        
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
        with open(cache_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            
        return {"status": "success", "warnings": warnings, "summary": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal memproses file: {e}")

class TestConnectionRequest(BaseModel):
    mode: str
    model: str
    api_key: Optional[str] = None
    base_url: Optional[str] = None
    timeout: float = 30.0

@app.post("/api/test-connection")
async def api_test_connection(req: TestConnectionRequest):
    active_prov = {}
    api_key_env = "ANTHROPIC_API_KEY"
    try:
        ai_provider_setting = load_json_setting("ai_provider_setting.json")
        provider_options = ai_provider_setting.get("providers", [])
        active_prov = next((p for p in provider_options if p["id"] == req.mode or p.get("mode") == req.mode), {})
        api_key_env = active_prov.get("api_key_env", "ANTHROPIC_API_KEY")
    except Exception:
        pass

    try:
        resolved_mode = active_prov.get("mode", req.mode)
        resolved_base_url = req.base_url or active_prov.get("default_base_url", "")
        msg = ai_client.test_connection(
            mode=resolved_mode,
            model=req.model.strip(),
            api_key=req.api_key,
            api_key_env=api_key_env,
            base_url=resolved_base_url,
            timeout=req.timeout,
        )
        return {"status": "success", "message": msg or "Koneksi berhasil."}
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))

class AnalyzeRequest(BaseModel):
    youtube_url: Optional[str] = None
    manual_transcript: Optional[str] = None
    channel_dna: str
    output_type_id: str
    duration_id: str
    shot_count: Optional[int] = None
    provider_id: str
    model: str
    api_key: Optional[str] = None
    base_url: Optional[str] = None
    request_timeout: float = 180.0
    enable_web_search: bool = False
    web_search_max_uses: int = 5
    enable_thinking: bool = False
    thinking_budget_tokens: int = 4000
    enable_code_execution: bool = False
    extra_notes: Optional[str] = None
    
    proxy_mode: str = "none"
    proxy_http_url: Optional[str] = None
    proxy_https_url: Optional[str] = None
    proxy_webshare_username: Optional[str] = None
    proxy_webshare_password: Optional[str] = None

@app.post("/api/analyze")
async def api_analyze(req: AnalyzeRequest):
    try:
        ai_provider_setting = load_json_setting("ai_provider_setting.json")
        provider_options = ai_provider_setting.get("providers", [])
        selected_provider = next((p for p in provider_options if p["id"] == req.provider_id), None)
        if not selected_provider:
            raise HTTPException(status_code=400, detail=f"Provider ID '{req.provider_id}' tidak dikenal.")
        
        provider_mode = selected_provider.get("mode", "anthropic")
        provider_api_key_env = selected_provider.get("api_key_env", "ANTHROPIC_API_KEY")

        video_title = "Video Kustom / Transkrip Manual"
        transcript_text = ""
        metadata = {}

        if req.manual_transcript and req.manual_transcript.strip():
            transcript_text = req.manual_transcript.strip()
        elif req.youtube_url and req.youtube_url.strip():
            video_id = youtube_utils.extract_video_id(req.youtube_url)
            if not video_id:
                raise HTTPException(status_code=400, detail="URL YouTube tidak valid.")
            
            try:
                metadata = youtube_utils.get_video_metadata(req.youtube_url)
                video_title = metadata.get("title", "Video YouTube")
            except Exception:
                video_title = "Video YouTube"
            
            proxy_setting = None
            if req.proxy_mode != "none":
                proxy_setting = youtube_utils.ProxySetting(
                    mode=req.proxy_mode,
                    http_url=req.proxy_http_url,
                    https_url=req.proxy_https_url,
                    webshare_username=req.proxy_webshare_username,
                    webshare_password=req.proxy_webshare_password,
                )
            
            try:
                proxy_config = youtube_utils.build_proxy_config(proxy_setting)
                
                if not youtube_utils._YTT_AVAILABLE:
                    raise HTTPException(status_code=500, detail="youtube-transcript-api belum terinstal.")
                
                transcript_list = youtube_utils.YouTubeTranscriptApi.list_transcripts(video_id, proxies=proxy_config)
                try:
                    transcript_obj = transcript_list.find_transcript(['id', 'en'])
                except Exception:
                    transcript_obj = next(iter(transcript_list))
                
                fetched_data = transcript_obj.fetch()
                segments = [
                    youtube_utils.TranscriptSegment(start=s["start"], duration=s["duration"], text=s["text"])
                    for s in fetched_data
                ]
                video_transcript = youtube_utils.VideoTranscript(video_id=video_id, language=transcript_obj.language, segments=segments)
                transcript_text = video_transcript.full_text
            except Exception as exc:
                raise HTTPException(
                    status_code=400,
                    detail=f"Gagal mengambil transkrip otomatis: {str(exc)}. Silakan gunakan opsi upload transkrip manual."
                )
        else:
            raise HTTPException(status_code=400, detail="Masukkan URL YouTube atau transkrip manual.")

        if not transcript_text.strip():
            raise HTTPException(status_code=400, detail="Transkrip video kosong atau tidak dapat diekstraksi.")

        # duration_setting.json: struktur output_types[{id, durations:[{id,...}]}]
        # Cari di semua output_types karena ID durasi unik di seluruh file
        duration_setting = load_json_setting("duration_setting.json")
        all_durations = []
        for ot in duration_setting.get("output_types", []):
            all_durations.extend(ot.get("durations", []))
        selected_duration = next((d for d in all_durations if d["id"] == req.duration_id), None)
        if not selected_duration:
            raise HTTPException(status_code=400, detail=f"Duration ID '{req.duration_id}' tidak dikenal.")
        
        final_duration_label = selected_duration.get("label", "")
        target_min_seconds = selected_duration.get("min_seconds")
        target_max_seconds = selected_duration.get("max_seconds")

        # output_setting.json pakai key "sections", bukan "types"
        # output_type_id dari frontend: "shorts" atau "video_panjang"
        output_setting = load_json_setting("output_setting.json")
        output_type_labels = {
            "shorts": "YouTube Shorts / Reels",
            "video_panjang": "YouTube Video Panjang",
            "long": "YouTube Video Panjang",
        }
        output_type_label = output_type_labels.get(req.output_type_id, req.output_type_id)

        # Load channel analytics summary if exists
        analytics_text = ""
        analytics_short_text = ""
        analytics_dir = os.path.join(SETTINGS_DIR, "channel_analytics")
        analytics_cache_path = os.path.join(analytics_dir, f"{req.channel_dna}.json")
        if os.path.exists(analytics_cache_path):
            try:
                with open(analytics_cache_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                
                from app.utils import analytics_parser
                summary = analytics_parser.ChannelAnalyticsSummary(
                    channel_id=data.get("channel_id", req.channel_dna),
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
                    summary.top_videos_by_views.append(analytics_parser.VideoStat(**v))
                for v in data.get("top_videos_by_ctr", []):
                    summary.top_videos_by_ctr.append(analytics_parser.VideoStat(**v))
                for v in data.get("top_videos_by_retention", []):
                    summary.top_videos_by_retention.append(analytics_parser.VideoStat(**v))
                
                if not summary.is_empty():
                    analytics_text = summary.to_prompt_text()
                    analytics_short_text = summary.to_short_summary()
            except Exception as e:
                print(f"Error loading analytics cache: {e}")

        system_prompt = prompt_loader.build_system_prompt(req.channel_dna)
        
        user_content = ai_client.build_user_content(
            video_title=video_title,
            transcript_text=transcript_text,
            output_type=output_type_label,
            duration_label=final_duration_label,
            segment_mode="Otomatis (AI)",
            manual_start=None,
            manual_end=None,
            extra_notes=req.extra_notes,
            shot_count=req.shot_count,
            target_min_seconds=target_min_seconds,
            target_max_seconds=target_max_seconds,
            analytics_text=analytics_text,
            analytics_short_text=analytics_short_text,
        )

        # Hitung kebutuhan token berdasarkan output yang diminta:
        # - Video panjang (multi-babak): minimal 20000 token agar outline lengkap tidak terpotong
        # - Shorts multi-shot: skala linear per shot (tiap shot ~1800 token)
        # - Cap ke 32000 (aman untuk semua model Anthropic claude-3-5/claude-sonnet-4)
        is_long_video = "panjang" in output_type_label.lower() or "long" in req.output_type_id.lower()

        computed_max_tokens = ai_client.DEFAULT_MAX_TOKENS  # baseline 16000
        if req.shot_count:
            computed_max_tokens = max(computed_max_tokens, 6000 + int(req.shot_count) * 1800)
        elif is_long_video:
            # Video panjang tanpa shot_count butuh lebih banyak token untuk outline+strategi
            computed_max_tokens = max(computed_max_tokens, 24000)
        computed_max_tokens = min(computed_max_tokens, 32000)

        ai_req = ai_client.AnalysisRequest(
            system_prompt=system_prompt,
            user_content=user_content,
            model=req.model.strip(),
            mode=provider_mode,
            base_url=req.base_url,
            max_tokens=computed_max_tokens,
            timeout=float(req.request_timeout),
            enable_web_search=req.enable_web_search,
            web_search_max_uses=req.web_search_max_uses,
            enable_thinking=req.enable_thinking,
            thinking_budget_tokens=req.thinking_budget_tokens,
            enable_code_execution=req.enable_code_execution,
        )

        raw_text, web_sources = ai_client.run_analysis(
            ai_req,
            api_key=req.api_key,
            api_key_env=provider_api_key_env
        )

        result = ai_parser.parse_ai_response(raw_text)
        result = ai_parser.enforce_shot_count(result, req.shot_count)
        
        shot_segments_for_check = ai_parser.get_shot_segment_list(result)
        duration_warnings = ai_parser.check_segment_duration_mismatch(
            shot_segments_for_check, target_min_seconds, target_max_seconds
        )

        return {
            "status": "success",
            "video_title": video_title,
            "metadata": metadata,
            "duration_warnings": duration_warnings,
            "web_sources": web_sources,
            "raw_ai_text": raw_text,
            "result": result,
        }
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ── YouTube Keyword Suggestions ──────────────────────────────
@app.get("/api/youtube-suggestions")
async def api_youtube_suggestions(
    q: str = "",
    lang: str = "id",
):
    """Ambil rekomendasi kata kunci dari YouTube Autocomplete."""
    if not q.strip():
        return {"suggestions": []}
    suggestions = youtube_utils.get_youtube_suggestions(q, language=lang)
    return {"suggestions": suggestions}


# ── Auth Endpoints ───────────────────────────────────────────
class LoginRequest(BaseModel):
    username: str
    password: str

class RegisterRequest(BaseModel):
    username: str
    password: str
    display_name: Optional[str] = None

@app.post("/api/auth/login")
async def api_login(req: LoginRequest):
    try:
        user = auth_utils.authenticate(req.username, req.password)
        token = auth_utils.generate_token(user)
        return {
            "status": "success",
            "token": token,
            "user": {
                "username": user.username,
                "display_name": user.display_name,
                "role": user.role,
            }
        }
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Login gagal: {e}")

@app.post("/api/auth/register")
async def api_register(req: RegisterRequest):
    try:
        user = auth_utils.register_user(
            username=req.username,
            password=req.password,
            display_name=req.display_name or req.username,
        )
        token = auth_utils.generate_token(user)
        return {
            "status": "success",
            "token": token,
            "user": {
                "username": user.username,
                "display_name": user.display_name,
                "role": user.role,
            }
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Registrasi gagal: {e}")

@app.get("/api/auth/me")
async def api_me(current_user: auth_utils.UserInfo = Depends(get_current_user)):
    return {
        "username": current_user.username,
        "display_name": current_user.display_name,
        "role": current_user.role,
    }
