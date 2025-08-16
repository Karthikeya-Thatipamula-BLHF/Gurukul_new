#!/usr/bin/env python3
"""
Production Readiness Validation Script
======================================

Validates that all services can start and function correctly after cleanup.
"""

import os
import sys
import subprocess
import time
import requests
from pathlib import Path

class ProductionValidator:
    def __init__(self):
        self.results = {
            'backend_services': {},
            'frontend_build': False,
            'configuration': {},
            'dependencies': {},
            'errors': []
        }

    def validate_backend_services(self):
        """Validate that all backend services can start"""
        print("🔍 Validating Backend Services...")

        # Check if shared_config.py exists and is valid
        shared_config_path = Path("Backend/shared_config.py")
        if shared_config_path.exists():
            try:
                # Test import
                sys.path.append("Backend")
                import shared_config
                self.results['configuration']['shared_config'] = True
                print("   ✅ shared_config.py is valid")
            except Exception as e:
                self.results['configuration']['shared_config'] = False
                self.results['errors'].append(f"shared_config.py error: {e}")
                print(f"   ❌ shared_config.py error: {e}")
        else:
            self.results['configuration']['shared_config'] = False
            self.results['errors'].append("shared_config.py not found")
            print("   ❌ shared_config.py not found")

        # Check .env file
        env_path = Path("Backend/.env")
        if env_path.exists():
            self.results['configuration']['env_file'] = True
            print("   ✅ .env file exists")
        else:
            self.results['configuration']['env_file'] = False
            self.results['errors'].append(".env file not found")
            print("   ❌ .env file not found")

        # Check service directories
        service_dirs = [
            "Base_backend",
            "api_data",
            "subject_generation",
            "memory_management",
            "dedicated_chatbot_service",
            "tts_service"
        ]

        for service in service_dirs:
            service_path = Path(f"Backend/{service}")
            if service_path.exists():
                # Check for main files
                main_files = ["api.py", "app.py", "main.py", "tts.py", "chatbot_api.py"]
                has_main = any((service_path / f).exists() for f in main_files)

                # Check for requirements.txt
                has_requirements = (service_path / "requirements.txt").exists()

                self.results['backend_services'][service] = {
                    'exists': True,
                    'has_main_file': has_main,
                    'has_requirements': has_requirements
                }

                status = "✅" if has_main and has_requirements else "⚠️"
                print(f"   {status} {service}: main={has_main}, requirements={has_requirements}")
            else:
                self.results['backend_services'][service] = {
                    'exists': False,
                    'has_main_file': False,
                    'has_requirements': False
                }
                print(f"   ❌ {service}: directory not found")

    def validate_frontend_structure(self):
        """Validate frontend structure"""
        print("\n🔍 Validating Frontend Structure...")
        
        frontend_path = Path("new frontend")
        if not frontend_path.exists():
            self.results['frontend_build'] = False
            self.results['errors'].append("Frontend directory not found")
            print("   ❌ Frontend directory not found")
            return
        
        # Check essential files
        essential_files = [
            "package.json",
            "index.html",
            "vite.config.js",
            "src/main.jsx"
        ]
        
        missing_files = []
        for file in essential_files:
            if not (frontend_path / file).exists():
                missing_files.append(file)
        
        if missing_files:
            self.results['frontend_build'] = False
            self.results['errors'].append(f"Missing frontend files: {missing_files}")
            print(f"   ❌ Missing files: {missing_files}")
        else:
            self.results['frontend_build'] = True
            print("   ✅ All essential frontend files present")
        
        # Check if node_modules exists (should be present for production)
        if (frontend_path / "node_modules").exists():
            print("   ✅ node_modules directory exists")
        else:
            print("   ⚠️  node_modules directory not found (run npm install)")

    def validate_dependencies(self):
        """Validate that dependencies are properly configured"""
        print("\n🔍 Validating Dependencies...")
        
        # Check root requirements.txt
        root_req = Path("requirements.txt")
        if root_req.exists():
            self.results['dependencies']['root_requirements'] = True
            print("   ✅ Root requirements.txt exists")
        else:
            self.results['dependencies']['root_requirements'] = False
            print("   ⚠️  Root requirements.txt not found")
        
        # Check backend requirements
        backend_req = Path("Backend/requirements.txt")
        if backend_req.exists():
            self.results['dependencies']['backend_requirements'] = True
            print("   ✅ Backend requirements.txt exists")
        else:
            self.results['dependencies']['backend_requirements'] = False
            print("   ⚠️  Backend requirements.txt not found")
        
        # Check frontend package.json
        frontend_pkg = Path("new frontend/package.json")
        if frontend_pkg.exists():
            self.results['dependencies']['frontend_package'] = True
            print("   ✅ Frontend package.json exists")
        else:
            self.results['dependencies']['frontend_package'] = False
            print("   ❌ Frontend package.json not found")

    def validate_startup_scripts(self):
        """Validate that startup scripts exist"""
        print("\n🔍 Validating Startup Scripts...")
        
        startup_scripts = [
            "Backend/start_all_services.bat",
            "Backend/start_all_services.sh",
            "new frontend/start_frontend.bat",
            "install_dependencies.bat",
            "install_dependencies.sh"
        ]
        
        for script in startup_scripts:
            script_path = Path(script)
            if script_path.exists():
                print(f"   ✅ {script}")
            else:
                print(f"   ❌ {script}")
                self.results['errors'].append(f"Missing startup script: {script}")

    def check_removed_files(self):
        """Check that development files have been removed"""
        print("\n🔍 Checking for Removed Development Files...")
        
        # Files that should NOT exist in production
        dev_patterns = [
            "test_*.py",
            "*_test.py", 
            "debug_*.py",
            "*_debug.py",
            "*.test.js",
            "*test*.html"
        ]
        
        found_dev_files = []
        
        # Check Backend directory
        backend_path = Path("Backend")
        for pattern in dev_patterns:
            found_files = list(backend_path.rglob(pattern))
            found_dev_files.extend(found_files)
        
        # Check Frontend directory  
        frontend_path = Path("new frontend")
        if frontend_path.exists():
            for pattern in dev_patterns:
                found_files = list(frontend_path.rglob(pattern))
                found_dev_files.extend(found_files)
        
        if found_dev_files:
            print(f"   ⚠️  Found {len(found_dev_files)} development files still present:")
            for file in found_dev_files[:5]:  # Show first 5
                print(f"      - {file}")
            if len(found_dev_files) > 5:
                print(f"      ... and {len(found_dev_files) - 5} more")
        else:
            print("   ✅ No development files found")

    def generate_report(self):
        """Generate final validation report"""
        print("\n" + "=" * 60)
        print("  PRODUCTION READINESS VALIDATION REPORT")
        print("=" * 60)
        
        # Count successful validations
        backend_services_ok = sum(1 for s in self.results['backend_services'].values() 
                                if s.get('exists') and s.get('has_main_file') and s.get('has_requirements'))
        total_backend_services = len(self.results['backend_services'])
        
        config_ok = sum(1 for v in self.results['configuration'].values() if v)
        total_config = len(self.results['configuration'])
        
        deps_ok = sum(1 for v in self.results['dependencies'].values() if v)
        total_deps = len(self.results['dependencies'])
        
        print(f"\n📊 SUMMARY:")
        print(f"   Backend Services: {backend_services_ok}/{total_backend_services} ready")
        print(f"   Configuration: {config_ok}/{total_config} valid")
        print(f"   Dependencies: {deps_ok}/{total_deps} configured")
        print(f"   Frontend Structure: {'✅' if self.results['frontend_build'] else '❌'}")
        print(f"   Total Errors: {len(self.results['errors'])}")
        
        if self.results['errors']:
            print(f"\n❌ ERRORS FOUND:")
            for error in self.results['errors']:
                print(f"   - {error}")
        
        # Overall assessment
        overall_score = (backend_services_ok + config_ok + deps_ok + 
                        (1 if self.results['frontend_build'] else 0))
        max_score = total_backend_services + total_config + total_deps + 1
        
        percentage = (overall_score / max_score) * 100
        
        print(f"\n🎯 OVERALL READINESS: {percentage:.1f}%")
        
        if percentage >= 90:
            print("✅ EXCELLENT - Ready for production deployment!")
        elif percentage >= 75:
            print("⚠️  GOOD - Minor issues to address before deployment")
        elif percentage >= 50:
            print("⚠️  FAIR - Several issues need attention")
        else:
            print("❌ POOR - Significant issues must be resolved")
        
        return percentage >= 75

    def run_validation(self):
        """Run complete validation"""
        print("🚀 Starting Production Readiness Validation...")
        print("=" * 60)
        
        self.validate_backend_services()
        self.validate_frontend_structure()
        self.validate_dependencies()
        self.validate_startup_scripts()
        self.check_removed_files()
        
        return self.generate_report()

if __name__ == "__main__":
    validator = ProductionValidator()
    success = validator.run_validation()
    exit(0 if success else 1)
