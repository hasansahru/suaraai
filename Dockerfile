FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y curl gcc g++ && rm -rf /var/lib/apt/lists/*

# Create a non-root user (Hugging Face Requirement)
RUN useradd -m -u 1000 user
USER user

# Set home and path
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

WORKDIR $HOME/app

# Install python dependencies
COPY --chown=user backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY --chown=user backend $HOME/app/backend

# Set working directory to where main.py is
WORKDIR $HOME/app/backend

# Expose port
EXPOSE 7860

# Run the app
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]
