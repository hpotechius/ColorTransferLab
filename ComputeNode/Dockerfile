FROM python:3.12-slim

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       build-essential cmake git \
       libx11-6 \
       libgl1 \
       libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements_hf.txt .
RUN CMAKE_BUILD_PARALLEL_LEVEL=1 MAKEFLAGS=-j1 \
    pip install --no-cache-dir -r requirements_hf.txt

COPY main_computenode.py .
COPY utils ./utils
COPY meta ./meta

ENV PYTHONUNBUFFERED=1
ENV CMAKE_BUILD_PARALLEL_LEVEL=1
ENV MAKEFLAGS=-j1

EXPOSE 7860

CMD ["python", "main_computenode.py", "--web", "--web-host", "0.0.0.0", "--web-port", "7860"]
