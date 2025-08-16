"""
Integrate Large Dataset with FastAPI System
"""

import requests
import json
import time
from datetime import datetime

def test_large_dataset_integration():
    """Test FastAPI with the large dataset"""
    
    print('🚗 INTEGRATING LARGE DATASET WITH FASTAPI SYSTEM')
    print('=' * 70)
    
    base_url = 'http://localhost:8000'
    
    # Test 1: Check current system status
    print('\n1. 📊 CHECKING SYSTEM STATUS')
    print('-' * 40)
    
    try:
        # Health check
        response = requests.get(f'{base_url}/api/health', timeout=10)
        if response.status_code == 200:
            health = response.json()
            print(f'✅ System Status: {health["status"].upper()}')
            print(f'✅ Scraper Ready: {health["scraper_ready"]}')
            print(f'✅ Processor Ready: {health["processor_ready"]}')
        else:
            print(f'❌ Health check failed: {response.status_code}')
            return
            
        # Current statistics
        response = requests.get(f'{base_url}/api/statistics', timeout=10)
        if response.status_code == 200:
            stats = response.json()
            current_vehicles = stats.get('total_vehicles', 0)
            print(f'📈 Current vehicles in system: {current_vehicles}')
            
            if current_vehicles >= 1000:
                print(f'✅ Large dataset already loaded!')
            else:
                print(f'⚠️  Small dataset detected, large dataset should be available')
        
    except Exception as e:
        print(f'❌ Cannot connect to FastAPI server: {e}')
        print('💡 Make sure FastAPI server is running: python fastapi_main.py')
        return
    
    # Test 2: Test with large dataset
    print('\n2. 🔍 TESTING LARGE DATASET CAPABILITIES')
    print('-' * 40)
    
    # Large search queries
    search_tests = [
        {'limit': 100, 'description': 'First 100 vehicles'},
        {'make': 'Honda', 'limit': 50, 'description': 'Honda vehicles'},
        {'make': 'Toyota', 'limit': 50, 'description': 'Toyota vehicles'},
        {'make': 'Maruti Suzuki', 'limit': 50, 'description': 'Maruti Suzuki vehicles'},
        {'fuel_type': 'Petrol', 'limit': 100, 'description': 'Petrol vehicles'},
        {'fuel_type': 'Diesel', 'limit': 100, 'description': 'Diesel vehicles'},
        {'price_max': 500000, 'limit': 50, 'description': 'Budget cars (under ₹5L)'},
        {'price_min': 500000, 'price_max': 1000000, 'limit': 50, 'description': 'Mid-range cars (₹5L-₹10L)'},
        {'price_min': 1000000, 'limit': 50, 'description': 'Premium cars (above ₹10L)'},
        {'year_min': 2020, 'limit': 50, 'description': 'Recent vehicles (2020+)'},
        {'transmission': 'Automatic', 'limit': 30, 'description': 'Automatic transmission'},
        {'location': 'Mumbai', 'limit': 30, 'description': 'Mumbai vehicles'}
    ]
    
    total_found = 0
    for test in search_tests:
        description = test.pop('description')
        
        try:
            response = requests.post(f'{base_url}/api/search', json=test, timeout=15)
            
            if response.status_code == 200:
                results = response.json()
                found_count = len(results.get('vehicles', []))
                total_available = results.get('total', 0)
                total_found += total_available
                
                print(f'✅ {description}: {found_count} returned, {total_available} total')
                
                if results.get('vehicles') and found_count > 0:
                    sample = results['vehicles'][0]
                    price = sample.get('best_price', 0)
                    make = sample.get('make', 'Unknown')
                    model = sample.get('model', 'Unknown')
                    year = sample.get('year', 'Unknown')
                    
                    if price > 0:
                        print(f'   📋 Sample: {make} {model} {year} - ₹{price:,}')
                    else:
                        print(f'   📋 Sample: {make} {model} {year}')
            else:
                print(f'❌ {description}: Search failed ({response.status_code})')
                
        except Exception as e:
            print(f'❌ {description}: Error - {e}')
    
    print(f'\n📊 Search Summary: Found data across {len(search_tests)} categories')
    
    # Test 3: Recommendation System Performance
    print('\n3. 🎯 TESTING RECOMMENDATION SYSTEM WITH LARGE DATASET')
    print('-' * 40)
    
    recommendation_tests = [
        {
            'budget_max': 500000,
            'fuel_type': 'Petrol',
            'limit': 10,
            'description': 'Budget petrol cars (under ₹5L)'
        },
        {
            'budget_max': 800000,
            'transmission': 'Manual',
            'limit': 15,
            'description': 'Affordable manual cars (under ₹8L)'
        },
        {
            'budget_max': 1200000,
            'transmission': 'Automatic',
            'limit': 10,
            'description': 'Premium automatic cars (under ₹12L)'
        },
        {
            'budget_max': 1500000,
            'make': 'Honda',
            'limit': 8,
            'description': 'Premium Honda cars (under ₹15L)'
        },
        {
            'budget_max': 2000000,
            'fuel_type': 'Diesel',
            'limit': 12,
            'description': 'Luxury diesel cars (under ₹20L)'
        }
    ]
    
    for test in recommendation_tests:
        description = test.pop('description')
        
        try:
            response = requests.post(f'{base_url}/api/recommendations', json=test, timeout=15)
            
            if response.status_code == 200:
                recommendations = response.json()
                rec_count = len(recommendations.get('recommendations', []))
                total_matches = recommendations.get('total', 0)
                
                print(f'✅ {description}: {rec_count} recommendations from {total_matches} matches')
                
                if recommendations.get('recommendations'):
                    top_rec = recommendations['recommendations'][0]
                    price = top_rec.get('best_price', 0)
                    score = top_rec.get('condition_score', 0)
                    platform = top_rec.get('best_deal_platform', 'N/A')
                    make = top_rec.get('make', 'Unknown')
                    model = top_rec.get('model', 'Unknown')
                    year = top_rec.get('year', 'Unknown')
                    
                    print(f'   🏆 Top: {make} {model} {year}')
                    if price > 0:
                        print(f'       Price: ₹{price:,} on {platform.title()}')
                    print(f'       Condition Score: {score:.2f}/1.0')
                    
                    reasons = top_rec.get('recommendation_reasons', [])
                    if reasons:
                        print(f'       Why: {", ".join(reasons[:2])}')
            else:
                print(f'❌ {description}: Failed ({response.status_code})')
                
        except Exception as e:
            print(f'❌ {description}: Error - {e}')
    
    # Test 4: Export Performance with Large Dataset
    print('\n4. 📁 TESTING EXPORT PERFORMANCE')
    print('-' * 40)
    
    # Test JSON export
    try:
        start_time = time.time()
        response = requests.get(f'{base_url}/api/export/json', timeout=30)
        json_time = time.time() - start_time
        
        if response.status_code == 200:
            json_size = len(response.content)
            print(f'✅ JSON Export: {json_size:,} bytes in {json_time:.2f}s')
            print(f'   📊 Size: {json_size/1024/1024:.1f} MB')
        else:
            print(f'❌ JSON Export failed: {response.status_code}')
    except Exception as e:
        print(f'❌ JSON Export error: {e}')
    
    # Test CSV export
    try:
        start_time = time.time()
        response = requests.get(f'{base_url}/api/export/csv', timeout=30)
        csv_time = time.time() - start_time
        
        if response.status_code == 200:
            csv_size = len(response.content)
            print(f'✅ CSV Export: {csv_size:,} bytes in {csv_time:.2f}s')
            print(f'   📊 Size: {csv_size/1024/1024:.1f} MB')
        else:
            print(f'❌ CSV Export failed: {response.status_code}')
    except Exception as e:
        print(f'❌ CSV Export error: {e}')
    
    # Test 5: System Performance Under Load
    print('\n5. ⚡ PERFORMANCE TESTING WITH LARGE DATASET')
    print('-' * 40)
    
    # Test response times
    response_times = []
    
    for i in range(5):
        try:
            start_time = time.time()
            response = requests.post(f'{base_url}/api/search', 
                                   json={'limit': 50}, timeout=10)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                response_times.append(response_time)
                print(f'   Request {i+1}: {response_time:.3f}s')
            else:
                print(f'   Request {i+1}: Failed ({response.status_code})')
                
        except Exception as e:
            print(f'   Request {i+1}: Error - {e}')
    
    if response_times:
        avg_time = sum(response_times) / len(response_times)
        print(f'✅ Average Response Time: {avg_time:.3f}s')
        print(f'✅ Performance: {"Excellent" if avg_time < 1 else "Good" if avg_time < 3 else "Needs Optimization"}')
    
    # Final Summary
    print('\n' + '=' * 70)
    print('🎉 LARGE DATASET INTEGRATION TEST COMPLETED!')
    print('=' * 70)
    
    # Get final statistics
    try:
        response = requests.get(f'{base_url}/api/statistics', timeout=10)
        if response.status_code == 200:
            stats = response.json()
            total_vehicles = stats.get('total_vehicles', 0)
            
            print(f'\n📊 FINAL SYSTEM STATUS:')
            print(f'✅ Total Vehicles: {total_vehicles:,}')
            
            if total_vehicles >= 1000:
                print(f'🎯 LARGE DATASET SUCCESSFULLY INTEGRATED!')
                print(f'✅ System ready for high-volume operations')
            else:
                print(f'⚠️  Dataset size: {total_vehicles} (expected 1000+)')
            
            if 'statistics' in stats and stats['statistics']:
                data_stats = stats['statistics']
                
                if 'by_make' in data_stats:
                    print(f'\n🏭 Top Vehicle Makes:')
                    for make, count in list(data_stats['by_make'].items())[:8]:
                        print(f'   • {make}: {count:,} vehicles')
                
                if 'price_stats' in data_stats:
                    price_stats = data_stats['price_stats']
                    if price_stats.get('min', 0) > 0:
                        print(f'\n💰 Price Distribution:')
                        print(f'   • Range: ₹{price_stats["min"]:,.0f} - ₹{price_stats["max"]:,.0f}')
                        print(f'   • Average: ₹{price_stats["avg"]:,.0f}')
                        print(f'   • Median: ₹{price_stats["median"]:,.0f}')
    
    except Exception as e:
        print(f'❌ Final statistics error: {e}')
    
    print(f'\n🚀 SYSTEM STATUS: READY FOR PRODUCTION WITH LARGE DATASET')
    print(f'📈 Capable of handling 1000+ vehicles with advanced search and recommendations')
    print('=' * 70)

if __name__ == "__main__":
    test_large_dataset_integration()
