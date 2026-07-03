# Python base — "slim" is small but has what we need. 3.12 matches a modern Django 6 setup.
FROM python:3.12-slim

# Don't buffer stdout/stderr (logs show up immediately), don't write .pyc files.
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

# Working directory inside the container.
WORKDIR /app

# Install requirements first, as its own layer.
# If code changes but requirements don't, Docker reuses this cached layer (fast rebuilds).
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Now copy the Django project code in.
COPY . .

# Django/gunicorn will listen on 8000.
EXPOSE 8000

# Copy and use the entrypoint (runs migrations, then starts gunicorn).
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
CMD ["/entrypoint.sh"]