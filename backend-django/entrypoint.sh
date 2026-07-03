#!/bin/sh
# Ensure the database schema exists, then start the server.
set -e

echo "Running migrations..."
python manage.py migrate --noinput

echo "Starting gunicorn..."
exec gunicorn transitpulse.wsgi:application --bind 0.0.0.0:8000 --workers 3