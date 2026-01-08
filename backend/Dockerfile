FROM python:3.10-slim

# Отключаем интерактивный режим apt
ENV DEBIAN_FRONTEND=noninteractive

WORKDIR /app

# Устанавливаем системные зависимости
RUN apt-get update && apt-get install -y \
    g++ \
    build-essential \
    libgl1 \
    libglib2.0-0 \
    libopencv-dev \
    libstdc++6 \
    git \
    && rm -rf /var/lib/apt/lists/*

# Обновляем pip и ставим wheel, чтобы не падала сборка
RUN pip install --upgrade pip setuptools wheel

# Копируем requirements
COPY requirements.txt .

# Устанавливаем Python зависимости
RUN pip install --no-cache-dir -r requirements.txt

# Копируем код
COPY . .

# Запускаем приложение
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
