"""
Backend utilities package.

Exposes shared helpers like logging configuration.
"""
from .logging_config import configure_logging

__all__ = ["configure_logging"]
