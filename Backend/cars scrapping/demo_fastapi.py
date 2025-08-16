"""
Demo script for FastAPI Vehicle Data Aggregation System
Creates sample data and demonstrates functionality
"""

import asyncio
import json
import os
from datetime import datetime
from data_processor import DataProcessor

async def create_sample_data():
    """Create sample vehicle data for demonstration"""
    sample_vehicles = [
        {
            "vehicle_id": "spinny_001",
            "make": "Maruti Suzuki",
            "model": "Swift",
            "year": 2020,
            "variant": "VXI",
            "price": {"spinny": 650000},
            "kms_reading": 25000,
            "location": "Mumbai, Maharashtra",
            "fuel_type": "Petrol",
            "transmission": "Manual",
            "source_platforms": ["spinny"],
            "vehicle_details": {
                "original_title": "Maruti Suzuki Swift VXI 2020",
                "price_text": "6.5 Lakh",
                "mileage_text": "25,000 km",
                "source_url": "https://www.spinny.com"
            },
            "scraped_at": datetime.now().isoformat()
        },
        {
            "vehicle_id": "carwale_001",
            "make": "Maruti Suzuki", 
            "model": "Swift",
            "year": 2020,
            "variant": "VXI",
            "price": {"carwale": 645000},
            "kms_reading": 26000,
            "location": "Mumbai, Maharashtra",
            "fuel_type": "Petrol",
            "transmission": "Manual",
            "source_platforms": ["carwale"],
            "vehicle_details": {
                "original_title": "Maruti Swift VXI 2020",
                "price_text": "6.45 Lakh",
                "mileage_text": "26,000 km",
                "source_url": "https://www.carwale.com"
            },
            "scraped_at": datetime.now().isoformat()
        },
        {
            "vehicle_id": "cardekho_001",
            "make": "Hyundai",
            "model": "i20",
            "year": 2019,
            "variant": "Sportz",
            "price": {"cardekho": 750000},
            "kms_reading": 30000,
            "location": "Delhi, Delhi",
            "fuel_type": "Petrol",
            "transmission": "Manual",
            "source_platforms": ["cardekho"],
            "vehicle_details": {
                "original_title": "Hyundai i20 Sportz 2019",
                "price_text": "7.5 Lakh",
                "mileage_text": "30,000 km",
                "source_url": "https://www.cardekho.com"
            },
            "scraped_at": datetime.now().isoformat()
        },
        {
            "vehicle_id": "olx_001",
            "make": "Honda",
            "model": "City",
            "year": 2021,
            "variant": "ZX CVT",
            "price": {"olx": 1250000},
            "kms_reading": 15000,
            "location": "Bangalore, Karnataka",
            "fuel_type": "Petrol",
            "transmission": "Automatic",
            "source_platforms": ["olx"],
            "vehicle_details": {
                "original_title": "Honda City ZX CVT 2021",
                "price_text": "12.5 Lakh",
                "mileage_text": "15,000 km",
                "source_url": "https://www.olx.in"
            },
            "scraped_at": datetime.now().isoformat()
        },
        {
            "vehicle_id": "cartrade_001",
            "make": "Tata",
            "model": "Nexon",
            "year": 2020,
            "variant": "XZ Plus",
            "price": {"cartrade": 950000},
            "kms_reading": 22000,
            "location": "Pune, Maharashtra",
            "fuel_type": "Diesel",
            "transmission": "Manual",
            "source_platforms": ["cartrade"],
            "vehicle_details": {
                "original_title": "Tata Nexon XZ Plus 2020",
                "price_text": "9.5 Lakh",
                "mileage_text": "22,000 km",
                "source_url": "https://www.cartrade.com"
            },
            "scraped_at": datetime.now().isoformat()
        },
        {
            "vehicle_id": "sahivalue_001",
            "make": "Toyota",
            "model": "Innova",
            "year": 2018,
            "variant": "Crysta GX",
            "price": {"sahivalue": 1800000},
            "kms_reading": 45000,
            "location": "Chennai, Tamil Nadu",
            "fuel_type": "Diesel",
            "transmission": "Manual",
            "source_platforms": ["sahivalue"],
            "vehicle_details": {
                "original_title": "Toyota Innova Crysta GX 2018",
                "price_text": "18 Lakh",
                "mileage_text": "45,000 km",
                "source_url": "https://www.sahivalue.com"
            },
            "scraped_at": datetime.now().isoformat()
        }
    ]
    
    return sample_vehicles

async def run_demo():
    """Run the FastAPI system demo"""
    print("🚗 FastAPI Vehicle Data Aggregation System - DEMO")
    print("=" * 60)
    print("Sources: Spinny, CarWale, SAHIvalue, CarDekho, OLX, CarTrade")
    print("=" * 60)
    
    # Step 1: Create sample data
    print("\n1. Creating sample vehicle data...")
    vehicles = await create_sample_data()
    print(f"   ✓ Created {len(vehicles)} sample vehicles from different sources")
    
    # Step 2: Process data
    print("\n2. Processing vehicle data...")
    processor = DataProcessor()
    processed_vehicles = processor.process_vehicles(vehicles)
    print(f"   ✓ Processed {len(processed_vehicles)} vehicles")
    print(f"   ✓ Cross-referencing: {len(vehicles)} -> {len(processed_vehicles)} vehicles")
    
    # Step 3: Save to JSON and CSV
    print("\n3. Saving data to JSON and CSV...")
    json_file = processor.save_to_json(processed_vehicles)
    csv_file = processor.save_to_csv(processed_vehicles)
    print(f"   ✓ JSON saved: {json_file}")
    print(f"   ✓ CSV saved: {csv_file}")
    
    # Step 4: Demonstrate filtering
    print("\n4. Demonstrating search and filtering...")
    
    # Search by make
    maruti_cars = processor.filter_vehicles(processed_vehicles, {"make": "Maruti Suzuki"})
    print(f"   ✓ Maruti Suzuki vehicles: {len(maruti_cars)}")
    
    # Search by fuel type
    petrol_cars = processor.filter_vehicles(processed_vehicles, {"fuel_type": "Petrol"})
    print(f"   ✓ Petrol vehicles: {len(petrol_cars)}")
    
    # Search by price range
    budget_cars = processor.filter_vehicles(processed_vehicles, {"price_max": 1000000})
    print(f"   ✓ Vehicles under ₹10 Lakh: {len(budget_cars)}")
    
    # Step 5: Get recommendations
    print("\n5. Getting personalized recommendations...")
    preferences = {
        "budget_max": 1000000,
        "fuel_type": "Petrol",
        "location": "Mumbai"
    }
    
    recommendations = processor.get_recommendations(processed_vehicles, preferences)
    print(f"   ✓ Found {len(recommendations)} recommendations for:")
    print(f"     - Budget: ₹{preferences['budget_max']:,}")
    print(f"     - Fuel: {preferences['fuel_type']}")
    print(f"     - Location: {preferences['location']}")
    
    # Step 6: Display sample results
    print("\n6. Sample Results:")
    print("-" * 40)
    
    print("\n📊 Top Recommendations:")
    for i, vehicle in enumerate(recommendations[:3], 1):
        price = vehicle.get('best_price', 0)
        reasons = vehicle.get('recommendation_reasons', [])
        
        print(f"   {i}. {vehicle.get('make', '')} {vehicle.get('model', '')} {vehicle.get('year', '')}")
        print(f"      Price: ₹{price:,} (from {vehicle.get('best_deal_platform', 'N/A')})")
        print(f"      Mileage: {vehicle.get('kms_reading', 0):,} km")
        print(f"      Condition Score: {vehicle.get('condition_score', 0):.2f}/1.0")
        print(f"      Location: {vehicle.get('location', 'N/A')}")
        if reasons:
            print(f"      Why: {', '.join(reasons[:2])}")
        print()
    
    # Step 7: Statistics
    print("\n📈 System Statistics:")
    stats = processor.get_statistics(processed_vehicles)
    
    print(f"   Total vehicles: {len(processed_vehicles)}")
    print(f"   Average condition score: {stats.get('condition_score_avg', 0):.2f}")
    
    if 'by_make' in stats:
        print("\n   Vehicles by make:")
        for make, count in list(stats['by_make'].items())[:3]:
            print(f"     • {make}: {count} vehicles")
    
    if 'price_stats' in stats:
        price_stats = stats['price_stats']
        print(f"\n   Price range: ₹{price_stats.get('min', 0):,.0f} - ₹{price_stats.get('max', 0):,.0f}")
        print(f"   Average price: ₹{price_stats.get('avg', 0):,.0f}")
    
    # Step 8: File information
    print("\n📁 Generated Files:")
    print(f"   • JSON: {json_file}")
    print(f"   • CSV: {csv_file}")
    
    # Check file sizes
    if os.path.exists(json_file):
        json_size = os.path.getsize(json_file)
        print(f"   • JSON size: {json_size:,} bytes")
    
    if os.path.exists(csv_file):
        csv_size = os.path.getsize(csv_file)
        print(f"   • CSV size: {csv_size:,} bytes")
    
    print("\n" + "=" * 60)
    print("✅ DEMO COMPLETED SUCCESSFULLY!")
    print("\nNext steps:")
    print("1. Install FastAPI dependencies: pip install -r requirements_fastapi.txt")
    print("2. Start FastAPI server: python fastapi_main.py")
    print("3. Access API at: http://localhost:8000")
    print("4. View API docs at: http://localhost:8000/docs")
    print("5. Start real scraping: POST /api/scrape")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(run_demo())
