import logging
import os


def configure_logging(service_name: str | None = None) -> logging.Logger:
    """
    Configure a consistent logging format across services.

    - Uses LOG_LEVEL env var (default INFO)
    - Includes service name in the log format if provided
    - Avoids printing secrets by design (business code should not log secrets)
    """
    level_str = os.getenv("LOG_LEVEL", "INFO").upper()
    level = getattr(logging, level_str, logging.INFO)

    base_fmt = (
        "%(asctime)s | %(levelname)s | %(name)s | %(message)s"
        if not service_name
        else f"%(asctime)s | %(levelname)s | {service_name} | %(name)s | %(message)s"
    )

    logging.basicConfig(level=level, format=base_fmt)
    logger = logging.getLogger(service_name or __name__)
    logger.setLevel(level)
    return logger

