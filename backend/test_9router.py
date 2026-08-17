import os
from dotenv import load_dotenv
from app.utils.ai_client import test_connection, MODE_OPENAI_COMPATIBLE

# Load environment variables from .env
load_dotenv()

try:
    print("Menguji koneksi ke 9Router...")
    result = test_connection(
        mode=MODE_OPENAI_COMPATIBLE,
        model="gc/gemini-3-flash", # Model configured in ai_provider_setting.json
        api_key=None,
        api_key_env="NINEROUTER_API_KEY",
        base_url="https://ai.sahru.my.id/v1",
        timeout=30.0
    )
    print("Sukses:", result)
except Exception as e:
    print("Gagal:", str(e))
