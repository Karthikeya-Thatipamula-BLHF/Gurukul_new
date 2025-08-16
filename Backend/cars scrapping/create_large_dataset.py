"""
Create Large Scale Dataset (30,000-40,000 vehicles)
For AI-powered vehicle analysis system
"""

import asyncio
import logging
from datetime import datetime
from large_scale_data_generator import LargeScaleVehicleGenerator, create_large_scale_dataset

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

async def main():
    """Create large-scale vehicle dataset"""
    
    print('🚗 LARGE SCALE VEHICLE DATASET GENERATOR')
    print('=' * 70)
    print('Target: 35,000 vehicles for AI analysis')
    print('Sources: Simulated data from Cars24, CarWale, CarDekho, etc.')
    print('=' * 70)
    
    # Get user input for dataset size
    try:
        size_input = input('\n📊 Enter dataset size (default 35000, max 50000): ').strip()
        if size_input:
            dataset_size = int(size_input)
            dataset_size = min(dataset_size, 50000)  # Cap at 50k
        else:
            dataset_size = 35000
    except ValueError:
        dataset_size = 35000
    
    print(f'\n🎯 Creating dataset with {dataset_size:,} vehicles...')
    
    start_time = datetime.now()
    
    try:
        # Create the generator
        generator = LargeScaleVehicleGenerator()
        
        # Generate the large dataset
        print('\n🔄 Starting vehicle generation...')
        vehicles = await generator.generate_large_dataset(dataset_size)
        
        if not vehicles:
            print('❌ Failed to generate vehicles')
            return
        
        print(f'\n✅ Generated {len(vehicles):,} vehicles successfully!')
        
        # Save the dataset
        print('\n💾 Saving dataset to files...')
        files = generator.save_large_dataset(vehicles, 'both')
        
        # Calculate generation time
        end_time = datetime.now()
        duration = end_time - start_time
        
        # Display summary
        print('\n' + '=' * 70)
        print('🎉 LARGE DATASET CREATION COMPLETED!')
        print('=' * 70)
        
        print(f'\n📊 Dataset Summary:')
        print(f'✅ Total Vehicles: {len(vehicles):,}')
        print(f'⏱️  Generation Time: {duration.total_seconds():.1f} seconds')
        print(f'🚀 Generation Rate: {len(vehicles)/duration.total_seconds():.0f} vehicles/second')
        
        # File information
        print(f'\n📁 Files Created:')
        for format_type, filename in files.items():
            import os
            file_size = os.path.getsize(filename) / (1024 * 1024)  # MB
            print(f'   • {format_type.upper()}: {filename} ({file_size:.1f} MB)')
        
        # Data analysis
        print(f'\n🔍 Data Analysis:')
        
        # Brand distribution
        brands = {}
        for vehicle in vehicles:
            brand = vehicle.get('make', 'Unknown')
            brands[brand] = brands.get(brand, 0) + 1
        
        top_brands = sorted(brands.items(), key=lambda x: x[1], reverse=True)[:10]
        print(f'🏭 Top 10 Brands:')
        for brand, count in top_brands:
            percentage = (count / len(vehicles)) * 100
            print(f'   • {brand}: {count:,} vehicles ({percentage:.1f}%)')
        
        # Price analysis
        prices = [v.get('price', 0) for v in vehicles if v.get('price', 0) > 0]
        if prices:
            avg_price = sum(prices) / len(prices)
            min_price = min(prices)
            max_price = max(prices)
            
            print(f'\n💰 Price Analysis:')
            print(f'   • Average Price: ₹{avg_price:,.0f}')
            print(f'   • Price Range: ₹{min_price:,} - ₹{max_price:,}')
            
            # Price segments
            budget_cars = len([p for p in prices if p <= 800000])
            mid_range = len([p for p in prices if 800000 < p <= 1500000])
            premium = len([p for p in prices if 1500000 < p <= 3000000])
            luxury = len([p for p in prices if p > 3000000])
            
            print(f'   • Budget (≤₹8L): {budget_cars:,} ({budget_cars/len(vehicles)*100:.1f}%)')
            print(f'   • Mid-range (₹8L-₹15L): {mid_range:,} ({mid_range/len(vehicles)*100:.1f}%)')
            print(f'   • Premium (₹15L-₹30L): {premium:,} ({premium/len(vehicles)*100:.1f}%)')
            print(f'   • Luxury (>₹30L): {luxury:,} ({luxury/len(vehicles)*100:.1f}%)')
        
        # Year distribution
        years = {}
        for vehicle in vehicles:
            year = vehicle.get('year', 2020)
            years[year] = years.get(year, 0) + 1
        
        print(f'\n📅 Year Distribution:')
        for year in sorted(years.keys(), reverse=True)[:5]:
            count = years[year]
            percentage = (count / len(vehicles)) * 100
            print(f'   • {year}: {count:,} vehicles ({percentage:.1f}%)')
        
        # Fuel type distribution
        fuel_types = {}
        for vehicle in vehicles:
            fuel = vehicle.get('fuel_type', 'Unknown')
            fuel_types[fuel] = fuel_types.get(fuel, 0) + 1
        
        print(f'\n⛽ Fuel Type Distribution:')
        for fuel, count in sorted(fuel_types.items(), key=lambda x: x[1], reverse=True):
            percentage = (count / len(vehicles)) * 100
            print(f'   • {fuel}: {count:,} vehicles ({percentage:.1f}%)')
        
        # Location distribution
        locations = {}
        for vehicle in vehicles:
            location = vehicle.get('location', 'Unknown')
            locations[location] = locations.get(location, 0) + 1
        
        top_locations = sorted(locations.items(), key=lambda x: x[1], reverse=True)[:10]
        print(f'\n🌍 Top 10 Locations:')
        for location, count in top_locations:
            percentage = (count / len(vehicles)) * 100
            print(f'   • {location}: {count:,} vehicles ({percentage:.1f}%)')
        
        # Platform distribution
        platforms = {}
        for vehicle in vehicles:
            platform = vehicle.get('source', 'Unknown')
            platforms[platform] = platforms.get(platform, 0) + 1
        
        print(f'\n📱 Platform Distribution:')
        for platform, count in sorted(platforms.items(), key=lambda x: x[1], reverse=True):
            percentage = (count / len(vehicles)) * 100
            print(f'   • {platform.title()}: {count:,} vehicles ({percentage:.1f}%)')
        
        # Quality metrics
        condition_scores = [v.get('condition_score', 0) for v in vehicles if v.get('condition_score', 0) > 0]
        if condition_scores:
            avg_condition = sum(condition_scores) / len(condition_scores)
            excellent = len([c for c in condition_scores if c >= 0.8])
            good = len([c for c in condition_scores if 0.6 <= c < 0.8])
            fair = len([c for c in condition_scores if c < 0.6])
            
            print(f'\n⭐ Quality Metrics:')
            print(f'   • Average Condition Score: {avg_condition:.2f}/1.0')
            print(f'   • Excellent (≥0.8): {excellent:,} vehicles ({excellent/len(vehicles)*100:.1f}%)')
            print(f'   • Good (0.6-0.8): {good:,} vehicles ({good/len(vehicles)*100:.1f}%)')
            print(f'   • Fair (<0.6): {fair:,} vehicles ({fair/len(vehicles)*100:.1f}%)')
        
        print(f'\n🚀 Next Steps:')
        print(f'1. Restart FastAPI server: python fastapi_main.py')
        print(f'2. Test with large dataset: python test_realtime_ai_assistant.py')
        print(f'3. Access API at: http://192.168.0.89:8000')
        print(f'4. View docs at: http://192.168.0.89:8000/docs')
        
        print(f'\n🎯 Large-scale AI assistant ready with {len(vehicles):,} vehicles!')
        print('=' * 70)
        
    except Exception as e:
        print(f'\n❌ Error creating dataset: {e}')
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
