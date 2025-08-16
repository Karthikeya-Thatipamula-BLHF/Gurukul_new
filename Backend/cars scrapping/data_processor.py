"""
Data Processor for FastAPI Vehicle Aggregation System
Handles cross-referencing, analysis, and JSON/CSV export
"""

import json
import csv
import os
import pandas as pd
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
from collections import defaultdict
import statistics

logger = logging.getLogger(__name__)

class DataProcessor:
    """Processes vehicle data for analysis and export"""
    
    def __init__(self):
        self.similarity_threshold = 0.8
        self.data_dir = "data"
        self.exports_dir = "exports"
        
        # Ensure directories exist
        os.makedirs(self.data_dir, exist_ok=True)
        os.makedirs(self.exports_dir, exist_ok=True)
    
    def process_vehicles(self, vehicles: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Process raw vehicle data - cross-reference and normalize"""
        logger.info(f"Processing {len(vehicles)} vehicles")
        
        # Step 1: Cross-reference similar vehicles
        cross_referenced = self._cross_reference_vehicles(vehicles)
        
        # Step 2: Normalize and enhance data
        normalized = self._normalize_vehicles(cross_referenced)
        
        # Step 3: Calculate additional metrics
        enhanced = self._enhance_vehicles(normalized)
        
        logger.info(f"Processing complete: {len(enhanced)} unique vehicles")
        return enhanced
    
    def _cross_reference_vehicles(self, vehicles: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Enhanced cross-reference vehicles to merge duplicates with advanced matching"""
        logger.info("Cross-referencing vehicles with enhanced algorithms...")

        # Group similar vehicles using multiple matching criteria
        vehicle_groups = []
        processed_indices = set()

        for i, vehicle in enumerate(vehicles):
            if i in processed_indices:
                continue

            # Start a new group with this vehicle
            current_group = [vehicle]
            processed_indices.add(i)

            # Find similar vehicles
            for j, other_vehicle in enumerate(vehicles[i+1:], i+1):
                if j in processed_indices:
                    continue

                similarity_score = self._calculate_vehicle_similarity(vehicle, other_vehicle)

                if similarity_score >= self.similarity_threshold:
                    current_group.append(other_vehicle)
                    processed_indices.add(j)

            vehicle_groups.append(current_group)

        # Merge vehicles in each group
        merged_vehicles = []
        for group in vehicle_groups:
            if len(group) == 1:
                # Single vehicle, no merging needed
                merged_vehicles.append(group[0])
            else:
                # Multiple vehicles, merge them
                merged_vehicle = self._merge_vehicle_group(group)
                merged_vehicles.append(merged_vehicle)

        logger.info(f"Cross-referencing complete: {len(vehicles)} → {len(merged_vehicles)} vehicles")
        return merged_vehicles

    def _calculate_vehicle_similarity(self, vehicle1: Dict[str, Any], vehicle2: Dict[str, Any]) -> float:
        """Calculate similarity score between two vehicles using multiple criteria"""

        # Exact match criteria (must match)
        exact_criteria = ['make', 'model', 'year']
        for criterion in exact_criteria:
            val1 = str(vehicle1.get(criterion, '')).lower().strip()
            val2 = str(vehicle2.get(criterion, '')).lower().strip()
            if val1 != val2:
                return 0.0  # No match if basic criteria don't match

        # Similarity scoring for other attributes
        similarity_scores = []

        # Price similarity (within 10% is considered similar)
        price1 = vehicle1.get('price', 0) or vehicle1.get('best_price', 0)
        price2 = vehicle2.get('price', 0) or vehicle2.get('best_price', 0)

        if price1 > 0 and price2 > 0:
            price_diff = abs(price1 - price2) / max(price1, price2)
            price_similarity = max(0, 1 - price_diff * 2)  # 10% diff = 0.8 similarity
            similarity_scores.append(price_similarity)

        # Mileage similarity (within 20% is considered similar)
        km1 = vehicle1.get('kms_driven', 0) or vehicle1.get('km', 0)
        km2 = vehicle2.get('kms_driven', 0) or vehicle2.get('km', 0)

        if km1 > 0 and km2 > 0:
            km_diff = abs(km1 - km2) / max(km1, km2)
            km_similarity = max(0, 1 - km_diff * 1.5)  # 20% diff = 0.7 similarity
            similarity_scores.append(km_similarity)

        # Fuel type similarity
        fuel1 = str(vehicle1.get('fuel_type', '')).lower().strip()
        fuel2 = str(vehicle2.get('fuel_type', '')).lower().strip()
        if fuel1 and fuel2:
            fuel_similarity = 1.0 if fuel1 == fuel2 else 0.0
            similarity_scores.append(fuel_similarity)

        # Transmission similarity
        trans1 = str(vehicle1.get('transmission', '')).lower().strip()
        trans2 = str(vehicle2.get('transmission', '')).lower().strip()
        if trans1 and trans2:
            trans_similarity = 1.0 if trans1 == trans2 else 0.0
            similarity_scores.append(trans_similarity)

        # Location similarity (same city gets bonus)
        loc1 = str(vehicle1.get('location', '')).lower().strip()
        loc2 = str(vehicle2.get('location', '')).lower().strip()
        if loc1 and loc2:
            location_similarity = 1.0 if loc1 == loc2 else 0.5  # Same city = 1.0, different = 0.5
            similarity_scores.append(location_similarity)

        # Calculate overall similarity
        if similarity_scores:
            overall_similarity = sum(similarity_scores) / len(similarity_scores)
        else:
            overall_similarity = 0.5  # Default if no comparable attributes

        return overall_similarity

    def _merge_vehicle_group(self, vehicles: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Merge a group of similar vehicles into a single comprehensive entry"""

        if len(vehicles) == 1:
            return vehicles[0]

        # Start with the first vehicle as base
        merged = vehicles[0].copy()

        # Collect all prices from different platforms
        all_prices = {}
        all_sources = set()

        for vehicle in vehicles:
            source = vehicle.get('source', 'unknown')
            all_sources.add(source)

            # Collect price information
            price = vehicle.get('price', 0) or vehicle.get('best_price', 0)
            if price > 0:
                all_prices[source] = price

        # Update merged vehicle with comprehensive data
        merged['source_platforms'] = list(all_sources)
        merged['price_comparison'] = all_prices

        # Find best price
        if all_prices:
            best_price = min(all_prices.values())
            best_platform = min(all_prices.keys(), key=lambda k: all_prices[k])
            merged['best_price'] = best_price
            merged['best_deal_platform'] = best_platform

        # Average numerical values where appropriate
        numerical_fields = ['condition_score', 'kms_driven', 'km']
        for field in numerical_fields:
            values = [v.get(field, 0) for v in vehicles if v.get(field, 0) > 0]
            if values:
                merged[field] = sum(values) / len(values)

        # Merge features and descriptions
        all_features = set()
        all_descriptions = []

        for vehicle in vehicles:
            features = vehicle.get('features', [])
            if isinstance(features, list):
                all_features.update(features)

            description = vehicle.get('description', '')
            if description and description not in all_descriptions:
                all_descriptions.append(description)

        merged['features'] = list(all_features)
        merged['descriptions'] = all_descriptions

        # Add cross-reference metadata
        merged['cross_referenced'] = True
        merged['duplicate_count'] = len(vehicles)
        merged['last_updated'] = datetime.now().isoformat()

        # Generate unique vehicle ID
        make = merged.get('make', 'unknown')
        model = merged.get('model', 'unknown')
        year = merged.get('year', 'unknown')
        merged['vehicle_id'] = f"{make}_{model}_{year}_{hash(str(sorted(all_sources)))}"[:50]

        return merged

    def validate_cross_references(self, vehicles: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Validate the quality of cross-referencing"""

        validation_results = {
            "total_vehicles": len(vehicles),
            "cross_referenced_count": 0,
            "single_source_count": 0,
            "multi_source_count": 0,
            "price_anomalies": [],
            "data_quality_score": 0.0,
            "validation_details": {
                "duplicate_detection_accuracy": 0.0,
                "price_consistency": 0.0,
                "data_completeness": 0.0
            }
        }

        if not vehicles:
            return validation_results

        cross_referenced = 0
        single_source = 0
        multi_source = 0
        price_anomalies = []

        # Analyze each vehicle
        for vehicle in vehicles:
            if vehicle.get('cross_referenced', False):
                cross_referenced += 1

            sources = vehicle.get('source_platforms', [])
            if len(sources) == 1:
                single_source += 1
            elif len(sources) > 1:
                multi_source += 1

            # Check for price anomalies
            price_comparison = vehicle.get('price_comparison', {})
            if len(price_comparison) > 1:
                prices = list(price_comparison.values())
                avg_price = sum(prices) / len(prices)

                for platform, price in price_comparison.items():
                    deviation = abs(price - avg_price) / avg_price
                    if deviation > 0.3:  # 30% deviation threshold
                        price_anomalies.append({
                            "vehicle_id": vehicle.get('vehicle_id', 'unknown'),
                            "make_model": f"{vehicle.get('make', '')} {vehicle.get('model', '')}",
                            "platform": platform,
                            "price": price,
                            "average_price": avg_price,
                            "deviation_percent": deviation * 100
                        })

        # Update results
        validation_results.update({
            "cross_referenced_count": cross_referenced,
            "single_source_count": single_source,
            "multi_source_count": multi_source,
            "price_anomalies": price_anomalies
        })

        # Calculate quality scores
        total_vehicles = len(vehicles)
        if total_vehicles > 0:
            duplicate_accuracy = cross_referenced / total_vehicles
            price_consistency = max(0, 1 - len(price_anomalies) / total_vehicles)

            # Data completeness check
            complete_records = 0
            for vehicle in vehicles:
                required_fields = ['make', 'model', 'year', 'price', 'fuel_type']
                if all(vehicle.get(field) for field in required_fields):
                    complete_records += 1

            data_completeness = complete_records / total_vehicles

            # Overall quality score
            overall_score = (duplicate_accuracy + price_consistency + data_completeness) / 3

            validation_results["data_quality_score"] = overall_score
            validation_results["validation_details"] = {
                "duplicate_detection_accuracy": duplicate_accuracy,
                "price_consistency": price_consistency,
                "data_completeness": data_completeness
            }

        return validation_results
    
    def _group_similar_vehicles(self, vehicles: List[Dict[str, Any]]) -> List[List[Dict[str, Any]]]:
        """Group similar vehicles together"""
        groups = []
        processed = set()
        
        for i, vehicle in enumerate(vehicles):
            if i in processed:
                continue
            
            # Start new group
            group = [vehicle]
            processed.add(i)
            
            # Find similar vehicles
            for j, other_vehicle in enumerate(vehicles[i+1:], i+1):
                if j in processed:
                    continue
                
                if self._are_vehicles_similar(vehicle, other_vehicle):
                    group.append(other_vehicle)
                    processed.add(j)
            
            groups.append(group)
        
        return groups
    
    def _are_vehicles_similar(self, vehicle1: Dict[str, Any], vehicle2: Dict[str, Any]) -> bool:
        """Check if two vehicles are likely the same"""
        # Compare key attributes
        make_match = vehicle1.get('make', '').lower() == vehicle2.get('make', '').lower()
        model_match = vehicle1.get('model', '').lower() == vehicle2.get('model', '').lower()
        year_match = vehicle1.get('year', 0) == vehicle2.get('year', 0)
        
        # Allow some tolerance in mileage (within 5000 km)
        mileage_diff = abs(vehicle1.get('kms_reading', 0) - vehicle2.get('kms_reading', 0))
        mileage_similar = mileage_diff <= 5000
        
        # Check location similarity (same city)
        location1 = vehicle1.get('location', '').split(',')[0].strip().lower()
        location2 = vehicle2.get('location', '').split(',')[0].strip().lower()
        location_match = location1 == location2
        
        return make_match and model_match and year_match and (mileage_similar or location_match)
    
    def _merge_vehicle_group(self, group: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Merge a group of similar vehicles"""
        if len(group) == 1:
            return group[0]
        
        # Use first vehicle as base
        merged = group[0].copy()
        
        # Merge prices from all platforms
        all_prices = {}
        all_platforms = []
        
        for vehicle in group:
            # Handle price as integer or dict
            vehicle_price = vehicle.get('price', 0)
            source = vehicle.get('source', 'unknown')

            if isinstance(vehicle_price, dict):
                all_prices.update(vehicle_price)
            elif isinstance(vehicle_price, (int, float)) and vehicle_price > 0:
                all_prices[source] = vehicle_price

            # Handle source platforms
            platforms = vehicle.get('source_platforms', [])
            if platforms:
                all_platforms.extend(platforms)
            elif source:
                all_platforms.append(source)
        
        merged['price'] = all_prices
        merged['source_platforms'] = list(set(all_platforms))
        
        # Find best deal
        if all_prices:
            best_platform = min(all_prices.keys(), key=lambda k: all_prices[k])
            merged['best_deal_platform'] = best_platform
            merged['best_price'] = all_prices[best_platform]
        
        # Use most complete data
        for vehicle in group[1:]:
            for key, value in vehicle.items():
                if key not in ['price', 'source_platforms', 'vehicle_id'] and not merged.get(key) and value:
                    merged[key] = value
        
        return merged
    
    def _normalize_vehicles(self, vehicles: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Normalize vehicle data"""
        normalized = []
        
        for vehicle in vehicles:
            # Normalize make
            make = vehicle.get('make', '').strip().title()
            if make.lower() in ['maruti', 'suzuki']:
                make = 'Maruti Suzuki'
            
            # Normalize fuel type
            fuel_type = vehicle.get('fuel_type', '').strip().title()
            fuel_mapping = {
                'Petrol': 'Petrol',
                'Diesel': 'Diesel',
                'Cng': 'CNG',
                'Electric': 'Electric',
                'Hybrid': 'Hybrid'
            }
            fuel_type = fuel_mapping.get(fuel_type, fuel_type)
            
            # Normalize transmission
            transmission = vehicle.get('transmission', '').strip().title()
            trans_mapping = {
                'Manual': 'Manual',
                'Automatic': 'Automatic',
                'Amt': 'AMT',
                'Cvt': 'CVT'
            }
            transmission = trans_mapping.get(transmission, transmission)
            
            # Create normalized vehicle
            normalized_vehicle = {
                **vehicle,
                'make': make,
                'fuel_type': fuel_type,
                'transmission': transmission,
                'processed_at': datetime.now().isoformat()
            }
            
            normalized.append(normalized_vehicle)
        
        return normalized
    
    def _enhance_vehicles(self, vehicles: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Add calculated fields and metrics"""
        enhanced = []
        
        for vehicle in vehicles:
            # Calculate condition score based on age and mileage
            year = vehicle.get('year', 0)
            kms = vehicle.get('kms_reading', 0)
            
            current_year = datetime.now().year
            age = current_year - year if year > 0 else 10
            
            # Age factor (newer is better)
            age_score = max(0, 1 - (age / 15))  # 15 years = 0 score
            
            # Mileage factor (lower is better)
            expected_kms = age * 15000  # 15k km per year
            if expected_kms > 0:
                mileage_score = max(0, 1 - (kms / (expected_kms * 1.5)))
            else:
                mileage_score = 0.5
            
            condition_score = (age_score * 0.6 + mileage_score * 0.4)
            
            # Add calculated fields
            enhanced_vehicle = {
                **vehicle,
                'condition_score': round(condition_score, 2),
                'age_years': age,
                'price_per_km': round(vehicle.get('best_price', 0) / max(kms, 1), 2) if vehicle.get('best_price') else 0
            }
            
            enhanced.append(enhanced_vehicle)
        
        return enhanced
    
    def save_to_json(self, vehicles: List[Dict[str, Any]], filename: str = None) -> str:
        """Save vehicles to JSON file"""
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"vehicles_{timestamp}.json"
        
        filepath = os.path.join(self.data_dir, filename)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(vehicles, f, indent=2, ensure_ascii=False, default=str)
        
        logger.info(f"Saved {len(vehicles)} vehicles to {filepath}")
        return filepath
    
    def save_to_csv(self, vehicles: List[Dict[str, Any]], filename: str = None) -> str:
        """Save vehicles to CSV file"""
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"vehicles_{timestamp}.csv"
        
        filepath = os.path.join(self.data_dir, filename)
        
        # Flatten nested data for CSV
        flattened_data = []
        for vehicle in vehicles:
            flat_vehicle = {}
            
            # Basic fields
            for key, value in vehicle.items():
                if key == 'price':
                    # Flatten price data
                    if isinstance(value, dict):
                        for platform, price in value.items():
                            flat_vehicle[f'price_{platform}'] = price
                    else:
                        flat_vehicle['price'] = value
                elif key == 'source_platforms':
                    flat_vehicle['source_platforms'] = ', '.join(value) if isinstance(value, list) else value
                elif key == 'vehicle_details':
                    # Flatten vehicle details
                    if isinstance(value, dict):
                        for detail_key, detail_value in value.items():
                            flat_vehicle[f'detail_{detail_key}'] = detail_value
                else:
                    flat_vehicle[key] = value
            
            flattened_data.append(flat_vehicle)
        
        # Save to CSV
        df = pd.DataFrame(flattened_data)
        df.to_csv(filepath, index=False, encoding='utf-8')
        
        logger.info(f"Saved {len(vehicles)} vehicles to {filepath}")
        return filepath
    
    def load_latest_data(self) -> List[Dict[str, Any]]:
        """Load the most recent vehicle data, prioritizing large datasets"""
        try:
            # Find all JSON files
            json_files = [f for f in os.listdir(self.data_dir) if f.endswith('.json')]

            if not json_files:
                return []

            # Prioritize large-scale dataset files first
            large_scale_files = [f for f in json_files if f.startswith('large_scale_dataset_')]
            large_dataset_files = [f for f in json_files if f.startswith('large_dataset_')]

            if large_scale_files:
                # Use the most recent large-scale dataset (35k+ vehicles)
                latest_file = max(large_scale_files, key=lambda x: os.path.getctime(os.path.join(self.data_dir, x)))
            elif large_dataset_files:
                # Fall back to large dataset (1k vehicles)
                latest_file = max(large_dataset_files, key=lambda x: os.path.getctime(os.path.join(self.data_dir, x)))
            else:
                # Fall back to other vehicle files
                vehicle_files = [f for f in json_files if 'vehicle' in f]
                if vehicle_files:
                    latest_file = max(vehicle_files, key=lambda x: os.path.getctime(os.path.join(self.data_dir, x)))
                else:
                    latest_file = max(json_files, key=lambda x: os.path.getctime(os.path.join(self.data_dir, x)))

            filepath = os.path.join(self.data_dir, latest_file)

            with open(filepath, 'r', encoding='utf-8') as f:
                vehicles = json.load(f)

            logger.info(f"Loaded {len(vehicles)} vehicles from {filepath}")
            return vehicles

        except Exception as e:
            logger.error(f"Failed to load data: {e}")
            return []
    
    def filter_vehicles(self, vehicles: List[Dict[str, Any]], filters: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Filter vehicles based on criteria"""
        filtered = vehicles.copy()
        
        for key, value in filters.items():
            if value is None:
                continue
            
            if key == 'make':
                filtered = [v for v in filtered if v.get('make', '').lower() == value.lower()]
            elif key == 'model':
                filtered = [v for v in filtered if v.get('model', '').lower() == value.lower()]
            elif key == 'year_min':
                filtered = [v for v in filtered if v.get('year', 0) >= value]
            elif key == 'year_max':
                filtered = [v for v in filtered if v.get('year', 0) <= value]
            elif key == 'price_min':
                filtered = [v for v in filtered if v.get('best_price', 0) >= value]
            elif key == 'price_max':
                filtered = [v for v in filtered if v.get('best_price', 0) <= value]
            elif key == 'fuel_type':
                filtered = [v for v in filtered if v.get('fuel_type', '').lower() == value.lower()]
            elif key == 'transmission':
                filtered = [v for v in filtered if v.get('transmission', '').lower() == value.lower()]
            elif key == 'location':
                filtered = [v for v in filtered if value.lower() in v.get('location', '').lower()]
        
        return filtered
    
    def get_recommendations(self, vehicles: List[Dict[str, Any]], preferences: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Get vehicle recommendations based on preferences"""
        # Filter by preferences first
        filtered = self.filter_vehicles(vehicles, preferences)
        
        # Sort by condition score and best price
        recommendations = sorted(
            filtered,
            key=lambda v: (v.get('condition_score', 0), -v.get('best_price', float('inf'))),
            reverse=True
        )
        
        # Add recommendation reasons
        for vehicle in recommendations:
            reasons = []
            
            if vehicle.get('condition_score', 0) >= 0.8:
                reasons.append("Excellent condition")
            elif vehicle.get('condition_score', 0) >= 0.6:
                reasons.append("Good condition")
            
            if vehicle.get('age_years', 0) <= 3:
                reasons.append("Relatively new")
            
            if len(vehicle.get('source_platforms', [])) > 1:
                reasons.append("Available on multiple platforms")
            
            vehicle['recommendation_reasons'] = reasons
        
        return recommendations
    
    def get_statistics(self, vehicles: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Generate statistics from vehicle data"""
        if not vehicles:
            return {}
        
        # Count by make
        make_counts = defaultdict(int)
        for vehicle in vehicles:
            make_counts[vehicle.get('make', 'Unknown')] += 1
        
        # Count by fuel type
        fuel_counts = defaultdict(int)
        for vehicle in vehicles:
            fuel_counts[vehicle.get('fuel_type', 'Unknown')] += 1
        
        # Price statistics
        prices = [v.get('best_price', 0) for v in vehicles if v.get('best_price', 0) > 0]
        
        # Year statistics
        years = [v.get('year', 0) for v in vehicles if v.get('year', 0) > 0]
        
        return {
            'by_make': dict(make_counts),
            'by_fuel_type': dict(fuel_counts),
            'price_stats': {
                'min': min(prices) if prices else 0,
                'max': max(prices) if prices else 0,
                'avg': statistics.mean(prices) if prices else 0,
                'median': statistics.median(prices) if prices else 0
            },
            'year_range': {
                'min': min(years) if years else 0,
                'max': max(years) if years else 0
            },
            'condition_score_avg': statistics.mean([v.get('condition_score', 0) for v in vehicles])
        }
