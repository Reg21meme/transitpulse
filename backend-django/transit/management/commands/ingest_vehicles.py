import time
from django.core.management.base import BaseCommand
from transit.ingest import run_ingestion

POLL_INTERVAL_SECONDS = 60


class Command(BaseCommand):
    help = "Fetch live MBTA vehicles and save snapshots. Use --loop to poll continuously."

    def add_arguments(self, parser):
        parser.add_argument(
            "--loop",
            action="store_true",
            help="Poll every 60 seconds until stopped with Ctrl+C.",
        )

    def handle(self, *args, **options):
        if options["loop"]:
            self.run_loop()
        else:
            self.run_once()

    def run_once(self):
        routes, saved, skipped = run_ingestion()
        self.stdout.write(
            self.style.SUCCESS(
                f"Ingestion complete: {routes} routes ensured, "
                f"{saved} snapshots saved, {skipped} skipped."
            )
        )

    def run_loop(self):
        self.stdout.write(
            self.style.WARNING(
                f"Starting continuous ingestion every {POLL_INTERVAL_SECONDS}s. "
                "Press Ctrl+C to stop."
            )
        )
        try:
            while True:
                try:
                    routes, saved, skipped = run_ingestion()
                    timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
                    self.stdout.write(
                        f"[{timestamp}] {saved} saved, {skipped} skipped."
                    )
                except Exception as e:
                    timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
                    self.stderr.write(
                        self.style.ERROR(f"[{timestamp}] Poll failed: {e}")
                    )
                time.sleep(POLL_INTERVAL_SECONDS)
        except KeyboardInterrupt:
            self.stdout.write(self.style.SUCCESS("\nIngestion stopped."))