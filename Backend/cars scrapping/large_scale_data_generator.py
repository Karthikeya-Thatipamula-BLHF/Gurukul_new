"""
Large Scale Vehicle Data Generator
Creates 30,000-40,000 realistic vehicle records for AI analysis
"""

import asyncio
import json
import random
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any
import pandas as pd
from concurrent.futures import ThreadPoolExecutor
import os

logger = logging.getLogger(__name__)

class LargeScaleVehicleGenerator:
    """Generate large-scale realistic vehicle data"""
    
    def __init__(self):
        # Comprehensive Indian car data
        self.car_brands = {
            'Maruti Suzuki': {
                'models': ['Swift', 'Baleno', 'Alto', 'WagonR', 'Ertiga', 'Vitara Brezza', 'Dzire', 'Ciaz', 'S-Cross', 'XL6', 'Ignis', 'Celerio'],
                'price_range': (300000, 1500000),
                'reliability': 'High',
                'market_share': 0.35
            },
            'Hyundai': {
                'models': ['i20', 'Creta', 'Verna', 'Grand i10', 'Venue', 'Tucson', 'Elantra', 'Santro', 'Aura', 'Alcazar'],
                'price_range': (400000, 2500000),
                'reliability': 'High',
                'market_share': 0.18
            },
            'Honda': {
                'models': ['City', 'Amaze', 'Jazz', 'WR-V', 'CR-V', 'Civic', 'Accord', 'BR-V'],
                'price_range': (600000, 3500000),
                'reliability': 'Very High',
                'market_share': 0.08
            },
            'Toyota': {
                'models': ['Innova Crysta', 'Fortuner', 'Yaris', 'Glanza', 'Urban Cruiser', 'Camry', 'Land Cruiser'],
                'price_range': (700000, 8000000),
                'reliability': 'Very High',
                'market_share': 0.06
            },
            'Tata': {
                'models': ['Nexon', 'Harrier', 'Safari', 'Altroz', 'Tigor', 'Tiago', 'Punch', 'Hexa'],
                'price_range': (400000, 2500000),
                'reliability': 'Good',
                'market_share': 0.12
            },
            'Mahindra': {
                'models': ['XUV500', 'Scorpio', 'Bolero', 'XUV300', 'Thar', 'KUV100', 'Marazzo', 'XUV700'],
                'price_range': (500000, 3000000),
                'reliability': 'Good',
                'market_share': 0.08
            },
            'BMW': {
                'models': ['3 Series', '5 Series', 'X1', 'X3', 'X5', '7 Series', 'Z4', 'i3', 'i8'],
                'price_range': (3000000, 15000000),
                'reliability': 'Good',
                'market_share': 0.02
            },
            'Mercedes-Benz': {
                'models': ['C-Class', 'E-Class', 'S-Class', 'GLA', 'GLC', 'GLE', 'A-Class', 'CLA'],
                'price_range': (3500000, 20000000),
                'reliability': 'Good',
                'market_share': 0.015
            },
            'Audi': {
                'models': ['A3', 'A4', 'A6', 'Q3', 'Q5', 'Q7', 'A8', 'TT'],
                'price_range': (3200000, 18000000),
                'reliability': 'Good',
                'market_share': 0.01
            },
            'Ford': {
                'models': ['EcoSport', 'Figo', 'Aspire', 'Endeavour', 'Mustang', 'Freestyle'],
                'price_range': (500000, 4000000),
                'reliability': 'Good',
                'market_share': 0.04
            },
            'Nissan': {
                'models': ['Magnite', 'Kicks', 'Terrano', 'Sunny', 'Micra', 'GT-R'],
                'price_range': (500000, 8000000),
                'reliability': 'Good',
                'market_share': 0.03
            },
            'Volkswagen': {
                'models': ['Polo', 'Vento', 'Tiguan', 'T-Roc', 'Passat'],
                'price_range': (600000, 4000000),
                'reliability': 'Good',
                'market_share': 0.02
            },
            'Skoda': {
                'models': ['Rapid', 'Octavia', 'Superb', 'Kodiaq', 'Kushaq', 'Slavia'],
                'price_range': (700000, 5000000),
                'reliability': 'Good',
                'market_share': 0.02
            },
            'Kia': {
                'models': ['Seltos', 'Sonet', 'Carnival', 'Carens'],
                'price_range': (700000, 3500000),
                'reliability': 'Good',
                'market_share': 0.05
            },
            'MG': {
                'models': ['Hector', 'ZS EV', 'Astor', 'Gloster'],
                'price_range': (1200000, 4000000),
                'reliability': 'Good',
                'market_share': 0.02
            }
        }
        
        self.fuel_types = ['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid']
        self.transmissions = ['Manual', 'Automatic', 'CVT', 'AMT']
        self.colors = ['White', 'Silver', 'Black', 'Red', 'Blue', 'Grey', 'Brown', 'Green']
        
        # Indian cities with car markets
        self.locations = [
            'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune', 'Ahmedabad',
            'Surat', 'Jaipur', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Thane', 'Bhopal',
            'Visakhapatnam', 'Pimpri-Chinchwad', 'Patna', 'Vadodara', 'Ghaziabad', 'Ludhiana',
            'Agra', 'Nashik', 'Faridabad', 'Meerut', 'Rajkot', 'Kalyan-Dombivali', 'Vasai-Virar',
            'Varanasi', 'Srinagar', 'Aurangabad', 'Dhanbad', 'Amritsar', 'Navi Mumbai', 'Allahabad',
            'Ranchi', 'Howrah', 'Coimbatore', 'Jabalpur', 'Gwalior', 'Vijayawada', 'Jodhpur',
            'Madurai', 'Raipur', 'Kota', 'Guwahati', 'Chandigarh', 'Solapur', 'Hubli-Dharwad'
        ]
        
        # Automotive platforms
        self.platforms = ['Cars24', 'CarWale', 'CarDekho', 'OLX', 'CarTrade', 'Spinny', 'CARS24', 'Droom']
        
    def generate_single_vehicle(self, index: int) -> Dict[str, Any]:
        """Generate a single realistic vehicle record"""
        
        # Select brand based on market share
        brand_weights = [data['market_share'] for data in self.car_brands.values()]
        brand = random.choices(list(self.car_brands.keys()), weights=brand_weights)[0]
        brand_data = self.car_brands[brand]
        
        # Select model
        model = random.choice(brand_data['models'])
        
        # Generate year (2010-2024)
        year = random.randint(2010, 2024)
        
        # Generate price based on brand, model, and year
        base_min, base_max = brand_data['price_range']
        
        # Depreciation factor
        current_year = 2024
        age = current_year - year
        depreciation = 1 - (age * 0.12)  # 12% per year
        depreciation = max(0.3, depreciation)  # Minimum 30% of original value
        
        # Add randomness
        price_factor = random.uniform(0.8, 1.2)
        price = int((random.randint(base_min, base_max) * depreciation * price_factor))
        
        # Ensure minimum price
        price = max(price, 100000)
        
        # Generate kilometers based on age
        base_km_per_year = random.randint(8000, 15000)
        km_driven = age * base_km_per_year + random.randint(-5000, 5000)
        km_driven = max(0, km_driven)
        
        # Fuel type based on year and brand
        if year >= 2020 and random.random() < 0.15:
            fuel_type = random.choice(['Electric', 'Hybrid'])
        elif brand in ['BMW', 'Mercedes-Benz', 'Audi'] and random.random() < 0.7:
            fuel_type = random.choice(['Petrol', 'Diesel'])
        else:
            fuel_type = random.choices(
                ['Petrol', 'Diesel', 'CNG'],
                weights=[0.6, 0.35, 0.05]
            )[0]
        
        # Transmission based on year and brand
        if year >= 2018 and brand in ['BMW', 'Mercedes-Benz', 'Audi', 'Honda', 'Hyundai']:
            transmission = random.choices(
                ['Automatic', 'Manual', 'CVT'],
                weights=[0.6, 0.3, 0.1]
            )[0]
        else:
            transmission = random.choices(
                ['Manual', 'Automatic', 'AMT'],
                weights=[0.7, 0.2, 0.1]
            )[0]
        
        # Calculate condition score
        condition_score = self.calculate_condition_score(year, km_driven, price, brand_data['reliability'])
        
        # Generate features
        features = self.generate_features(brand, model, year, fuel_type)
        
        # Select platform and location
        platform = random.choice(self.platforms)
        location = random.choice(self.locations)
        
        # Generate vehicle record
        vehicle = {
            'id': f"vehicle_{index:06d}",
            'title': f"{brand} {model} {year}",
            'make': brand,
            'model': model,
            'year': year,
            'price': price,
            'best_price': price,
            'best_deal_platform': platform,
            'km_driven': km_driven,
            'fuel_type': fuel_type,
            'transmission': transmission,
            'color': random.choice(self.colors),
            'location': location,
            'source': platform.lower().replace(' ', ''),
            'condition_score': condition_score,
            'features': features,
            'seller_type': random.choices(['Dealer', 'Individual'], weights=[0.6, 0.4])[0],
            'verification_status': random.choices(['Verified', 'Pending'], weights=[0.8, 0.2])[0],
            'insurance_validity': self.generate_insurance_date(),
            'registration_year': year,
            'owners': random.randint(1, 4),
            'scraped_at': datetime.now().isoformat(),
            'url': f"https://{platform.lower().replace(' ', '')}.com/car-details/{index}",
            'images': [f"image_{i}.jpg" for i in range(random.randint(3, 8))],
            'description': f"{brand} {model} {year} in excellent condition. {km_driven:,} km driven.",
            'engine_capacity': self.generate_engine_capacity(brand, model),
            'mileage': self.generate_mileage(fuel_type, brand),
            'seating_capacity': random.choice([4, 5, 7, 8]),
            'body_type': self.generate_body_type(model),
            'rto_location': location,
            'loan_available': random.choice([True, False]),
            'exchange_available': random.choice([True, False])
        }
        
        return vehicle
    
    def calculate_condition_score(self, year: int, km_driven: int, price: int, reliability: str) -> float:
        """Calculate realistic condition score"""
        current_year = 2024
        age = current_year - year
        
        # Age factor
        age_score = max(0, 1 - (age / 15))
        
        # Mileage factor
        expected_km = age * 12000
        if km_driven <= expected_km:
            km_score = 1.0
        else:
            excess_km = km_driven - expected_km
            km_score = max(0.3, 1 - (excess_km / 100000))
        
        # Reliability factor
        reliability_scores = {
            'Very High': 0.95,
            'High': 0.85,
            'Good': 0.75
        }
        reliability_score = reliability_scores.get(reliability, 0.7)
        
        # Random condition factor
        random_factor = random.uniform(0.8, 1.0)
        
        # Combined score
        condition = (age_score * 0.3 + km_score * 0.4 + reliability_score * 0.2 + random_factor * 0.1)
        return round(min(1.0, condition), 2)
    
    def generate_features(self, brand: str, model: str, year: int, fuel_type: str) -> List[str]:
        """Generate realistic features"""
        base_features = ['Power Steering', 'Power Windows', 'Air Conditioning']
        
        if year >= 2015:
            base_features.extend(['Music System', 'Central Locking'])
        
        if year >= 2018:
            base_features.extend(['Bluetooth Connectivity', 'USB Charging', 'ABS', 'Airbags'])
        
        if year >= 2020:
            base_features.extend(['Touchscreen Infotainment', 'Reverse Camera', 'Keyless Entry'])
        
        if year >= 2022:
            base_features.extend(['Android Auto', 'Apple CarPlay', 'Wireless Charging'])
        
        # Premium brand features
        if brand in ['BMW', 'Mercedes-Benz', 'Audi']:
            base_features.extend(['Leather Seats', 'Sunroof', 'Alloy Wheels', 'Climate Control', 'Navigation System'])
        
        # Electric/Hybrid features
        if fuel_type in ['Electric', 'Hybrid']:
            base_features.extend(['Regenerative Braking', 'Electric Motor', 'Battery Management System'])
        
        return list(set(base_features))  # Remove duplicates
    
    def generate_insurance_date(self) -> str:
        """Generate insurance validity date"""
        base_date = datetime.now()
        days_offset = random.randint(-365, 730)  # -1 year to +2 years
        insurance_date = base_date + timedelta(days=days_offset)
        return insurance_date.strftime('%Y-%m-%d')
    
    def generate_engine_capacity(self, brand: str, model: str) -> str:
        """Generate engine capacity"""
        if brand in ['BMW', 'Mercedes-Benz', 'Audi']:
            return random.choice(['1.5L', '2.0L', '2.5L', '3.0L', '4.0L'])
        else:
            return random.choice(['1.0L', '1.2L', '1.4L', '1.5L', '1.6L', '2.0L'])
    
    def generate_mileage(self, fuel_type: str, brand: str) -> str:
        """Generate realistic mileage"""
        if fuel_type == 'Electric':
            return f"{random.randint(200, 400)} km/charge"
        elif fuel_type == 'CNG':
            return f"{random.randint(20, 30)} km/kg"
        elif fuel_type == 'Diesel':
            return f"{random.randint(15, 25)} kmpl"
        else:  # Petrol
            return f"{random.randint(12, 20)} kmpl"
    
    def generate_body_type(self, model: str) -> str:
        """Generate body type based on model"""
        suv_keywords = ['suv', 'creta', 'brezza', 'nexon', 'venue', 'xuv', 'scorpio', 'fortuner']
        sedan_keywords = ['city', 'verna', 'ciaz', 'dzire', 'amaze']
        hatchback_keywords = ['swift', 'i20', 'alto', 'baleno', 'polo']
        
        model_lower = model.lower()
        
        if any(keyword in model_lower for keyword in suv_keywords):
            return 'SUV'
        elif any(keyword in model_lower for keyword in sedan_keywords):
            return 'Sedan'
        elif any(keyword in model_lower for keyword in hatchback_keywords):
            return 'Hatchback'
        else:
            return random.choice(['Sedan', 'Hatchback', 'SUV', 'MPV'])
    
    async def generate_large_dataset(self, target_count: int = 35000) -> List[Dict[str, Any]]:
        """Generate large dataset of vehicles"""
        logger.info(f"Starting generation of {target_count:,} vehicles...")
        
        vehicles = []
        batch_size = 1000
        
        for batch_start in range(0, target_count, batch_size):
            batch_end = min(batch_start + batch_size, target_count)
            batch_vehicles = []
            
            # Generate batch
            for i in range(batch_start, batch_end):
                vehicle = self.generate_single_vehicle(i)
                batch_vehicles.append(vehicle)
            
            vehicles.extend(batch_vehicles)
            
            # Progress update
            progress = len(vehicles) / target_count * 100
            logger.info(f"Generated {len(vehicles):,}/{target_count:,} vehicles ({progress:.1f}%)")
            
            # Small delay to prevent overwhelming
            await asyncio.sleep(0.1)
        
        logger.info(f"Successfully generated {len(vehicles):,} vehicles")
        return vehicles
    
    def save_large_dataset(self, vehicles: List[Dict[str, Any]], format_type: str = 'both') -> Dict[str, str]:
        """Save large dataset to files"""
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        files_created = {}
        
        # Ensure data directory exists
        os.makedirs('data', exist_ok=True)
        
        if format_type in ['json', 'both']:
            json_filename = f"data/large_scale_dataset_{timestamp}.json"
            
            # Save in chunks for large files
            logger.info(f"Saving {len(vehicles):,} vehicles to JSON...")
            with open(json_filename, 'w', encoding='utf-8') as f:
                json.dump(vehicles, f, indent=2, ensure_ascii=False)
            
            files_created['json'] = json_filename
            file_size = os.path.getsize(json_filename) / (1024 * 1024)  # MB
            logger.info(f"JSON saved: {json_filename} ({file_size:.1f} MB)")
        
        if format_type in ['csv', 'both']:
            csv_filename = f"data/large_scale_dataset_{timestamp}.csv"
            
            logger.info(f"Converting {len(vehicles):,} vehicles to CSV...")
            df = pd.DataFrame(vehicles)
            
            # Convert lists to strings for CSV
            for col in df.columns:
                if df[col].dtype == 'object':
                    df[col] = df[col].astype(str)
            
            df.to_csv(csv_filename, index=False, encoding='utf-8')
            files_created['csv'] = csv_filename
            
            file_size = os.path.getsize(csv_filename) / (1024 * 1024)  # MB
            logger.info(f"CSV saved: {csv_filename} ({file_size:.1f} MB)")
        
        return files_created

# Async function for easy usage
async def create_large_scale_dataset(vehicle_count: int = 35000) -> List[Dict[str, Any]]:
    """Create large-scale vehicle dataset"""
    generator = LargeScaleVehicleGenerator()
    vehicles = await generator.generate_large_dataset(vehicle_count)
    return vehicles
