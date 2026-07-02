from django.core.management.base import BaseCommand
from transit.ingest import run_ingestion


class Command(BaseCommand):
    help = "Fetch live MBTA vehicles and save snapshots to the database."

    def handle(self, *args, **options):
        routes, saved, skipped = run_ingestion()
        self.stdout.write(
            self.style.SUCCESS(
                f"Ingestion complete: {routes} routes ensured, "
                f"{saved} snapshots saved, {skipped} skipped."
            )
        )