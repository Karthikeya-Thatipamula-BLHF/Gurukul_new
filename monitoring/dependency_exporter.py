#!/usr/bin/env python
"""
Gurukul Dependency Exporter for Prometheus

This script exports Python package dependency metrics for Prometheus to scrape.
It checks for critical dependencies and exports their status as metrics.

Usage:
    python dependency_exporter.py

The exporter runs on port 9101 by default.
"""

import importlib.util
import os
import sys
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import parse_qs, urlparse
import time
import json

# Define critical dependencies for each service
SERVICE_DEPENDENCIES = {
    'base_backend': ['fitz', 'fastapi', 'uvicorn', 'pydantic', 'requests', 'easyocr'],
    'api_data': ['fitz', 'fastapi', 'uvicorn', 'pydantic', 'requests', 'easyocr'],
    'financial_simulator': ['dotenv', 'langchain', 'fastapi', 'uvicorn', 'agentops'],
    'memory_management': ['pymongo', 'motor', 'fastapi', 'uvicorn'],
    'akash_service': ['dotenv', 'fastapi', 'uvicorn'],
    'subject_generation': ['dotenv', 'fastapi', 'uvicorn'],
    'wellness_api': ['dotenv', 'fastapi', 'uvicorn', 'prophet', 'statsmodels'],
    'tts_service': ['pyttsx3', 'fastapi', 'uvicorn', 'config'],
    'orchestration': ['dotenv', 'fastapi', 'uvicorn', 'google'],
}

# Map package names to import names
PACKAGE_TO_IMPORT = {
    'python-dotenv': 'dotenv',
    'PyMuPDF': 'fitz',
    'langchain-groq': 'langchain_groq',
    'langchain-community': 'langchain_community',
    'langchain-openai': 'langchain_openai',
    'langchain-google-genai': 'langchain_google_genai',
    'google-generativeai': 'google.generativeai',
    'config': 'config.settings',
}

class DependencyMetricsHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        url_parts = urlparse(self.path)
        if url_parts.path == '/metrics':
            self.send_response(200)
            self.send_header('Content-type', 'text/plain')
            self.end_headers()
            self.wfile.write(self.get_metrics().encode('utf-8'))
        elif url_parts.path == '/health':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'status': 'healthy'}).encode('utf-8'))
        else:
            self.send_response(404)
            self.end_headers()

    def is_package_installed(self, package_name):
        """Check if a package is installed by attempting to import it."""
        try:
            # Use the mapped import name if available, otherwise use the package name
            import_name = PACKAGE_TO_IMPORT.get(package_name, package_name)
            # Replace hyphens with underscores for import
            import_name = import_name.replace('-', '_')
            spec = importlib.util.find_spec(import_name)
            return spec is not None
        except (ImportError, AttributeError):
            return False

    def get_metrics(self):
        """Generate Prometheus metrics for dependency status."""
        metrics = []
        
        # Add metadata
        metrics.append('# HELP gurukul_dependency_status Status of Python dependencies (1=installed, 0=missing)')
        metrics.append('# TYPE gurukul_dependency_status gauge')
        
        # Check each service's dependencies
        for service, dependencies in SERVICE_DEPENDENCIES.items():
            for dependency in dependencies:
                status = 1 if self.is_package_installed(dependency) else 0
                metrics.append(f'gurukul_dependency_status{{service="{service}", dependency="{dependency}"}} {status}')
        
        # Add service health metrics based on dependencies
        metrics.append('# HELP gurukul_service_dependency_health Overall dependency health of services (1=healthy, 0=unhealthy)')
        metrics.append('# TYPE gurukul_service_dependency_health gauge')
        
        for service, dependencies in SERVICE_DEPENDENCIES.items():
            all_deps_installed = all(self.is_package_installed(dep) for dep in dependencies)
            health_status = 1 if all_deps_installed else 0
            metrics.append(f'gurukul_service_dependency_health{{service="{service}"}} {health_status}')
        
        return '\n'.join(metrics)

def run_server(port=9101):
    """Run the HTTP server."""
    server_address = ('', port)
    httpd = HTTPServer(server_address, DependencyMetricsHandler)
    print(f"Dependency exporter running on port {port}...")
    httpd.serve_forever()

def main():
    """Main function."""
    # Get port from environment variable or use default
    port = int(os.environ.get('DEPENDENCY_EXPORTER_PORT', 9101))
    run_server(port)

if __name__ == "__main__":
    main()