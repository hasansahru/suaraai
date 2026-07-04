FROM python:3.11-slim

# Install system dependencies if needed (e.g., for some AI/Youtube libs)
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy all backend code
COPY backend /app/backend

# Hugging Face Spaces uses port 7860 by default
EXPOSE 7860

# Run FastAPI using Uvicorn
CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "7860"]
