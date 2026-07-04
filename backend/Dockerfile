FROM python:3.12-slim

RUN apt-get update && apt-get install -y git gcc libffi-dev && apt-get clean

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir supabase==2.31.0 --no-deps && \
    pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]