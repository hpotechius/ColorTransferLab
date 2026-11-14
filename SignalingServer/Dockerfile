FROM python:3.10-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    HOME=/home/user

RUN useradd --create-home --uid 1000 user

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY --chown=user:user . .

USER user

EXPOSE 8071

CMD ["python", "main_signalingserver.py"]