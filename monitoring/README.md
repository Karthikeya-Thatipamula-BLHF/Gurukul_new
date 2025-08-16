# Gurukul Monitoring System

## Overview

This directory contains the configuration files for setting up a comprehensive monitoring system for the Gurukul application. The monitoring stack includes:

- **Prometheus**: For metrics collection and storage
- **Grafana**: For visualization and dashboarding
- **AlertManager**: For alert management and notifications
- **Node Exporter**: For host system metrics
- **cAdvisor**: For container metrics
- **MongoDB Exporter**: For MongoDB metrics
- **Redis Exporter**: For Redis metrics
- **Dependency Monitoring**: For tracking Python package dependencies

## Getting Started

### Prerequisites

- Docker and Docker Compose installed
- The main Gurukul application running (with the `gurukul-network` Docker network)

### Installation

#### Option 1: Using the Automated Deployment Script (Recommended)

From the root directory of the project, run the deployment script which will set up both the main application and the monitoring system:

```bash
# For Windows
deploy.bat

# For Linux/macOS
./deploy.sh
```

#### Option 2: Manual Installation

1. Start the monitoring stack:

   ```bash
   cd monitoring
   docker-compose up -d
   ```

2. Access the monitoring interfaces:

   - Prometheus: http://localhost:9090
   - Grafana: http://localhost:3001 (default credentials: admin/admin)
   - AlertManager: http://localhost:9093

## Configuration Files

- **prometheus.yml**: Prometheus configuration file that defines scrape targets and intervals
- **alertmanager.yml**: AlertManager configuration for notification channels and routing
- **grafana-dashboard.json**: Pre-configured Grafana dashboard for Gurukul services
- **docker-compose.yml**: Docker Compose file for the monitoring stack

## Metrics and Dashboards

### Main Dashboard

The main Grafana dashboard provides an overview of all Gurukul services, including:

- HTTP request rates and status codes
- Request duration percentiles
- Memory and CPU usage by service
- Service status (up/down)
- Database connection metrics

### Custom Dashboards

You can create additional dashboards in Grafana based on the metrics collected by Prometheus. Some useful metrics to monitor:

- **Service Health**: `up{job="<service-name>"}`
- **Request Rate**: `rate(http_requests_total[5m])`
- **Error Rate**: `rate(http_requests_total{status=~"5.."}[5m])`
- **Request Duration**: `histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, job))`
- **Memory Usage**: `process_resident_memory_bytes{job="<service-name>"}`
- **CPU Usage**: `rate(process_cpu_seconds_total{job="<service-name>"}[5m])`

## Alerting

### Default Alerts

The system comes with some default alerts configured:

- **ServiceDown**: Triggers when any service is down for more than 1 minute
- **HighErrorRate**: Triggers when the error rate exceeds 5% for more than 5 minutes
- **HighMemoryUsage**: Triggers when memory usage exceeds 80% for more than 5 minutes
- **HighCPUUsage**: Triggers when CPU usage exceeds 80% for more than 5 minutes

### Configuring Notifications

To configure notifications, edit the `alertmanager.yml` file:

1. Update the SMTP settings for email notifications
2. Update the Slack webhook URL for Slack notifications
3. Add additional notification channels as needed

## Extending the Monitoring System

### Adding New Services

To add a new service to the monitoring system:

1. Add a new job to the `scrape_configs` section in `prometheus.yml`:

   ```yaml
   - job_name: 'new-service'
     metrics_path: '/metrics'
     scrape_interval: 10s
     static_configs:
       - targets: ['new-service:port']
   ```

## Dependency Monitoring and Troubleshooting

### Monitoring Python Dependencies

The Gurukul application relies on several Python packages that need to be properly installed for all services to function correctly. To monitor and troubleshoot dependency issues:

1. **Automated Dependency Checking**:
   - Use the provided `check_and_install_dependencies.py` script in the root directory to automatically check and install missing dependencies.
   - This script can be scheduled to run periodically to ensure all dependencies are properly installed.

2. **Common Dependency Issues**:
   - Missing `python-dotenv`: Affects environment variable loading in multiple services
   - Missing `pymongo`: Affects database connections in Memory Management service
   - Missing `pyttsx3`: Affects the TTS Service
   - Missing `PyMuPDF` (imported as `fitz`): Affects PDF processing in Base Backend and API Data services

3. **Dependency Installation**:
   - For quick fixes, use the `fix_missing_dependencies.bat` script
   - For a complete installation, use the `install_dependencies.bat` (Windows) or `install_dependencies.sh` (Linux/Mac) scripts

### Monitoring Service Health

Each service exposes a health endpoint that can be used to monitor its status:

```
Base Backend:          http://localhost:8000/health
API Data Service:      http://localhost:8001/health
Financial Simulator:   http://localhost:8002/health
Memory Management API: http://localhost:8003/memory/health
Akash Service:         http://localhost:8004/health
Subject Generation:    http://localhost:8005/health
Wellness API:          http://localhost:8006/
TTS Service:           http://localhost:8007/api/health
```

These endpoints can be added to Prometheus for automated monitoring and alerting.

### Dependency Alerts

You can configure Prometheus to alert on dependency issues by monitoring the service health endpoints. Add the following to your Prometheus alert rules:

```yaml
groups:
- name: dependency-alerts
  rules:
  - alert: MissingDependency
    expr: up{job=~".*backend.*"} == 0
    for: 1m
    labels:
      severity: critical
    annotations:
      summary: "Service {{ $labels.job }} is down"
      description: "Service {{ $labels.job }} has been down for more than 1 minute. This may be due to missing dependencies."
```

For more detailed troubleshooting information, refer to the `TROUBLESHOOTING.md` file in the root directory.

2. Restart Prometheus:

   ```bash
   docker-compose restart prometheus
   ```

### Adding Custom Metrics

To add custom metrics to your services:

1. Use the Prometheus client library for your language (e.g., `prometheus_client` for Python)
2. Define and expose metrics in your application code
3. Make sure the metrics endpoint is accessible to Prometheus

Example for Python FastAPI:

```python
from prometheus_client import Counter, Histogram, generate_latest
from fastapi import FastAPI, Response

app = FastAPI()

# Define metrics
REQUEST_COUNT = Counter('http_requests_total', 'Total HTTP Requests', ['method', 'endpoint', 'status'])
REQUEST_LATENCY = Histogram('http_request_duration_seconds', 'HTTP Request Duration', ['method', 'endpoint'])

@app.get('/metrics')
async def metrics():
    return Response(content=generate_latest(), media_type="text/plain")
```

## Troubleshooting

### Common Issues

1. **Prometheus can't scrape targets**:
   - Check network connectivity between containers
   - Verify that the target service exposes metrics on the specified endpoint
   - Check for firewall or security group issues

2. **Grafana doesn't show data**:
   - Verify that Prometheus is configured as a data source in Grafana
   - Check Prometheus query in the dashboard panels
   - Verify that metrics are being collected in Prometheus

3. **Alerts not firing**:
   - Check alert rules in Prometheus
   - Verify that AlertManager is running and configured correctly
   - Check notification channel configuration

### Viewing Logs

```bash
# View Prometheus logs
docker-compose logs -f prometheus

# View Grafana logs
docker-compose logs -f grafana

# View AlertManager logs
docker-compose logs -f alertmanager
```

## Best Practices

1. **Regular Backups**: Regularly backup Prometheus and Grafana data volumes
2. **Version Control**: Keep all configuration files in version control
3. **Documentation**: Document custom metrics and dashboards
4. **Security**: Secure access to monitoring interfaces with proper authentication
5. **Resource Monitoring**: Monitor the monitoring system itself

## Additional Resources

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [AlertManager Documentation](https://prometheus.io/docs/alerting/latest/alertmanager/)