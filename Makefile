# TransitPulse dev shortcuts. Recipe lines MUST be tab-indented.

dev:
	@mkdir -p logs
	@echo "Starting Postgres..."
	@sudo service postgresql start
	@echo "Starting Django..."
	@cd backend-django && . venv/bin/activate && nohup python manage.py runserver > ../logs/django.log 2>&1 &
	@echo "Starting frontend..."
	@cd frontend && nohup npm run dev > ../logs/frontend.log 2>&1 &
	@echo "Started. Open http://localhost:3000/dashboard"

stop:
	@pkill -f "manage.py runserver" || true
	@pkill -f "next dev" || true
	@echo "Stopped Django and frontend."

logs:
	@tail -f logs/django.log logs/frontend.log 2>/dev/null

up:
	docker compose up --build

down:
	docker compose down