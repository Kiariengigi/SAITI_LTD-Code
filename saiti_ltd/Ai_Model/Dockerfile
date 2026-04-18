FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY app.py ./
COPY Inference.py ./
COPY llm_recommendation.py ./
COPY generate_demo_data.py ./
COPY models ./models

ENV DEMO_DATA_MODE=true

RUN python generate_demo_data.py

EXPOSE 8000

CMD ["sh", "-c", "uvicorn app:app --host 0.0.0.0 --port ${PORT:-8000}"]
