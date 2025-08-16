import React, { useState, useEffect } from 'react';
import { checkAllServices, logHealthResults } from '../utils/healthCheck';

/**
 * HealthCheck Component
 * 
 * Displays the health status of all backend services
 * Can be used in admin panels or status pages
 */
const HealthCheck = ({ showDetailed = false }) => {
  const [healthStatus, setHealthStatus] = useState({
    loading: true,
    allHealthy: false,
    services: {}
  });

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const results = await checkAllServices();
        setHealthStatus({
          loading: false,
          allHealthy: results.allHealthy,
          services: results.services
        });
        
        // Log results to console for debugging
        logHealthResults(results);
      } catch (error) {
        console.error('Error checking service health:', error);
        setHealthStatus({
          loading: false,
          allHealthy: false,
          error: error.message
        });
      }
    };

    checkHealth();
    
    // Set up periodic health checks every 60 seconds
    const intervalId = setInterval(checkHealth, 60000);
    
    return () => clearInterval(intervalId);
  }, []);

  if (healthStatus.loading) {
    return (
      <div className="health-check health-check-loading">
        <div className="health-check-status">
          <span className="health-check-icon">⏳</span>
          <span className="health-check-message">Checking system status...</span>
        </div>
      </div>
    );
  }

  if (healthStatus.error) {
    return (
      <div className="health-check health-check-error">
        <div className="health-check-status">
          <span className="health-check-icon">❌</span>
          <span className="health-check-message">Error checking status: {healthStatus.error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`health-check ${healthStatus.allHealthy ? 'health-check-healthy' : 'health-check-unhealthy'}`}>
      <div className="health-check-status">
        <span className="health-check-icon">
          {healthStatus.allHealthy ? '✅' : '⚠️'}
        </span>
        <span className="health-check-message">
          {healthStatus.allHealthy 
            ? 'All systems operational' 
            : 'Some services are experiencing issues'}
        </span>
      </div>

      {showDetailed && (
        <div className="health-check-details">
          <h4>Service Status</h4>
          <ul>
            {Object.entries(healthStatus.services).map(([key, service]) => (
              <li key={key} className={service.healthy ? 'service-healthy' : 'service-unhealthy'}>
                <span className="service-icon">{service.healthy ? '✅' : '❌'}</span>
                <span className="service-name">{service.name}</span>
                {!service.healthy && (
                  <span className="service-message">: {service.message}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default HealthCheck;