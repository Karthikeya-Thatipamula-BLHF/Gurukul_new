#!/usr/bin/env python3
"""
Production Health Check Script
=============================

Comprehensive health check for all Gurukul services running in Docker.
"""

import requests
import time
import sys
from typing import Dict, List, Tuple
import json

class HealthChecker:
    def __init__(self):
        self.services = {
            'Frontend': 'http://localhost:3000',
            'Base Backend': 'http://localhost:8000/health',
            'Chatbot API': 'http://localhost:8001/health',
            'Financial API': 'http://localhost:8002/health',
            'Memory API': 'http://localhost:8003/health',
            'Akash API': 'http://localhost:8004/health',
            'Subject API': 'http://localhost:8005/health',
            'Karthikeya API': 'http://localhost:8006/health',
            'TTS API': 'http://localhost:8007/health',
            'Nginx Proxy': 'http://localhost:80/health'
        }
        
        self.database_services = {
            'MongoDB': ('localhost', 27017),
            'Redis': ('localhost', 6379)
        }
        
        self.results = {}

    def check_http_service(self, name: str, url: str) -> Tuple[bool, str, float]:
        """Check HTTP service health"""
        try:
            start_time = time.time()
            response = requests.get(url, timeout=10)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                return True, f"OK ({response.status_code})", response_time
            else:
                return False, f"HTTP {response.status_code}", response_time
                
        except requests.exceptions.ConnectionError:
            return False, "Connection refused", 0
        except requests.exceptions.Timeout:
            return False, "Timeout", 0
        except Exception as e:
            return False, f"Error: {str(e)}", 0

    def check_mongodb(self) -> Tuple[bool, str]:
        """Check MongoDB connection"""
        try:
            import pymongo
            client = pymongo.MongoClient('mongodb://localhost:27017/', serverSelectionTimeoutMS=5000)
            client.server_info()
            return True, "Connected"
        except ImportError:
            return False, "pymongo not installed"
        except Exception as e:
            return False, f"Connection failed: {str(e)}"

    def check_redis(self) -> Tuple[bool, str]:
        """Check Redis connection"""
        try:
            import redis
            r = redis.Redis(host='localhost', port=6379, socket_timeout=5)
            r.ping()
            return True, "Connected"
        except ImportError:
            return False, "redis not installed"
        except Exception as e:
            return False, f"Connection failed: {str(e)}"

    def run_health_checks(self) -> Dict:
        """Run all health checks"""
        print("🏥 Running Health Checks...")
        print("=" * 50)
        
        # Check HTTP services
        for name, url in self.services.items():
            print(f"Checking {name}...", end=" ")
            is_healthy, status, response_time = self.check_http_service(name, url)
            
            self.results[name] = {
                'healthy': is_healthy,
                'status': status,
                'response_time': response_time,
                'type': 'http'
            }
            
            if is_healthy:
                print(f"✅ {status} ({response_time:.0f}ms)")
            else:
                print(f"❌ {status}")
        
        print()
        
        # Check database services
        print("Checking Database Services...")
        print("-" * 30)
        
        # MongoDB
        print("Checking MongoDB...", end=" ")
        is_healthy, status = self.check_mongodb()
        self.results['MongoDB'] = {
            'healthy': is_healthy,
            'status': status,
            'type': 'database'
        }
        print(f"✅ {status}" if is_healthy else f"❌ {status}")
        
        # Redis
        print("Checking Redis...", end=" ")
        is_healthy, status = self.check_redis()
        self.results['Redis'] = {
            'healthy': is_healthy,
            'status': status,
            'type': 'database'
        }
        print(f"✅ {status}" if is_healthy else f"❌ {status}")
        
        return self.results

    def generate_report(self) -> None:
        """Generate health check report"""
        print("\n" + "=" * 60)
        print("  HEALTH CHECK REPORT")
        print("=" * 60)
        
        healthy_services = sum(1 for result in self.results.values() if result['healthy'])
        total_services = len(self.results)
        
        print(f"\n📊 SUMMARY: {healthy_services}/{total_services} services healthy")
        
        # HTTP Services
        http_services = {k: v for k, v in self.results.items() if v['type'] == 'http'}
        if http_services:
            print(f"\n🌐 HTTP SERVICES ({len([s for s in http_services.values() if s['healthy']])}/{len(http_services)} healthy):")
            for name, result in http_services.items():
                status_icon = "✅" if result['healthy'] else "❌"
                response_time = f" ({result['response_time']:.0f}ms)" if result.get('response_time', 0) > 0 else ""
                print(f"   {status_icon} {name:<20} {result['status']}{response_time}")
        
        # Database Services
        db_services = {k: v for k, v in self.results.items() if v['type'] == 'database'}
        if db_services:
            print(f"\n🗄️  DATABASE SERVICES ({len([s for s in db_services.values() if s['healthy']])}/{len(db_services)} healthy):")
            for name, result in db_services.items():
                status_icon = "✅" if result['healthy'] else "❌"
                print(f"   {status_icon} {name:<20} {result['status']}")
        
        # Overall Status
        if healthy_services == total_services:
            print(f"\n🎉 ALL SYSTEMS OPERATIONAL")
            print("   Your Gurukul platform is ready for use!")
        elif healthy_services >= total_services * 0.8:
            print(f"\n⚠️  MOSTLY OPERATIONAL")
            print("   Some services need attention but core functionality is available.")
        else:
            print(f"\n🚨 SYSTEM ISSUES DETECTED")
            print("   Multiple services are down. Please check the logs.")
        
        # Quick Access URLs
        print(f"\n🔗 QUICK ACCESS:")
        print(f"   Frontend:     http://localhost:3000")
        print(f"   API Docs:     http://localhost:8000/docs")
        print(f"   Health:       http://localhost:80/health")
        
        return healthy_services == total_services

    def save_report(self, filename: str = "health_report.json") -> None:
        """Save health check results to JSON file"""
        report_data = {
            'timestamp': time.strftime('%Y-%m-%d %H:%M:%S'),
            'services': self.results,
            'summary': {
                'total_services': len(self.results),
                'healthy_services': sum(1 for r in self.results.values() if r['healthy']),
                'overall_health': sum(1 for r in self.results.values() if r['healthy']) == len(self.results)
            }
        }
        
        with open(filename, 'w') as f:
            json.dump(report_data, f, indent=2)
        
        print(f"\n💾 Report saved to: {filename}")

def main():
    """Main function"""
    print("🏥 Gurukul Production Health Check")
    print("=" * 40)
    
    checker = HealthChecker()
    
    # Run health checks
    results = checker.run_health_checks()
    
    # Generate report
    all_healthy = checker.generate_report()
    
    # Save report
    checker.save_report()
    
    # Exit with appropriate code
    sys.exit(0 if all_healthy else 1)

if __name__ == "__main__":
    main()
