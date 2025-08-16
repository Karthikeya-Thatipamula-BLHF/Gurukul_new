"""
AI Car Assistant powered by Ollama
Provides intelligent car recommendations, deal analysis, and user interaction
"""

import requests
import json
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
import re
import asyncio
import aiohttp

logger = logging.getLogger(__name__)

class OllamaCarAssistant:
    """AI Assistant for car recommendations and analysis using Ollama"""
    
    def __init__(self, ollama_url: str = "http://localhost:11434", model: str = "llama3:latest"):
        self.ollama_url = ollama_url
        self.model = model
        self.conversation_history = []
        self.realtime_data_cache = []
        self.last_data_fetch = None

        # Available models in order of preference
        self.available_models = [
            "llama3:latest",
            "llama2:latest",
            "mistral:latest",
            "qwen2.5:7b",
            "deepseek-r1:7b"
        ]
        
        # Car knowledge base
        self.car_knowledge = {
            "indian_brands": {
                "Maruti Suzuki": {"reliability": "High", "maintenance": "Low", "resale": "Excellent"},
                "Hyundai": {"reliability": "High", "maintenance": "Medium", "resale": "Good"},
                "Honda": {"reliability": "Very High", "maintenance": "Medium", "resale": "Excellent"},
                "Toyota": {"reliability": "Very High", "maintenance": "Low", "resale": "Excellent"},
                "Tata": {"reliability": "Good", "maintenance": "Low", "resale": "Good"},
                "Mahindra": {"reliability": "Good", "maintenance": "Medium", "resale": "Good"},
                "BMW": {"reliability": "Good", "maintenance": "High", "resale": "Good"},
                "Mercedes-Benz": {"reliability": "Good", "maintenance": "Very High", "resale": "Good"},
                "Audi": {"reliability": "Good", "maintenance": "High", "resale": "Good"}
            },
            "fuel_efficiency": {
                "Petrol": {"city": "12-16 kmpl", "highway": "16-20 kmpl"},
                "Diesel": {"city": "16-20 kmpl", "highway": "20-25 kmpl"},
                "CNG": {"city": "20-25 km/kg", "highway": "25-30 km/kg"},
                "Electric": {"range": "200-400 km", "efficiency": "3-5 km/kWh"}
            },
            "depreciation_rates": {
                "Luxury": "20-25% per year",
                "Premium": "15-20% per year",
                "Mass Market": "10-15% per year"
            }
        }
    
    async def check_ollama_connection(self) -> bool:
        """Check if Ollama is running and accessible"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{self.ollama_url}/api/tags", timeout=5) as response:
                    if response.status == 200:
                        models = await response.json()
                        available_models = [model['name'] for model in models.get('models', [])]
                        logger.info(f"Ollama connected. Available models: {available_models}")

                        # Auto-select best available model
                        selected_model = self._select_best_model(available_models)
                        if selected_model:
                            if selected_model != self.model:
                                logger.info(f"Switching from {self.model} to {selected_model}")
                                self.model = selected_model
                            return True
                        else:
                            logger.warning(f"No compatible models found. Available: {available_models}")
                            return False
                    return False
        except Exception as e:
            logger.error(f"Ollama connection failed: {e}")
            return False

    def _select_best_model(self, available_models: List[str]) -> Optional[str]:
        """Select the best available model from our preference list"""
        for preferred_model in self.available_models:
            for available_model in available_models:
                if preferred_model in available_model:
                    return available_model
        return None
    
    async def generate_response(self, prompt: str, context: Dict[str, Any] = None) -> str:
        """Generate AI response using Ollama"""
        try:
            # Enhance prompt with car context
            enhanced_prompt = self._enhance_prompt_with_context(prompt, context)
            
            async with aiohttp.ClientSession() as session:
                payload = {
                    "model": self.model,
                    "prompt": enhanced_prompt,
                    "stream": False,
                    "options": {
                        "temperature": 0.7,
                        "top_p": 0.9,
                        "max_tokens": 500
                    }
                }
                
                async with session.post(
                    f"{self.ollama_url}/api/generate",
                    json=payload,
                    timeout=30
                ) as response:
                    if response.status == 200:
                        result = await response.json()
                        ai_response = result.get('response', 'Sorry, I could not generate a response.')
                        
                        # Store conversation
                        self.conversation_history.append({
                            "user": prompt,
                            "assistant": ai_response,
                            "timestamp": datetime.now().isoformat(),
                            "context": context
                        })
                        
                        return ai_response
                    else:
                        logger.error(f"Ollama API error: {response.status}")
                        return self._fallback_response(prompt, context)
                        
        except Exception as e:
            logger.error(f"AI generation failed: {e}")
            return self._fallback_response(prompt, context)
    
    def _enhance_prompt_with_context(self, prompt: str, context: Dict[str, Any] = None) -> str:
        """Enhance user prompt with real-time car data context"""

        system_prompt = """You are an expert Indian automotive consultant and car advisor with access to REAL-TIME vehicle data. You have deep knowledge of:

- Indian car market trends and current pricing from live data
- Vehicle reliability, maintenance costs, and resale values
- Best deals and value-for-money recommendations from actual listings
- Cross-platform price comparisons from multiple automotive websites
- Technical specifications and performance analysis
- Real-time market conditions and availability

Your role is to help users make informed car buying decisions by analyzing LIVE DATA from automotive websites including Cars24, CarWale, CarDekho, and others.

IMPORTANT: You are working with REAL-TIME scraped data from actual automotive websites. Provide specific, accurate recommendations based on the current market data available.

Current Indian Car Market Context (Real-time):
- Popular brands: Maruti Suzuki, Hyundai, Honda, Toyota, Tata, Mahindra, BMW, Mercedes-Benz, Audi
- Fuel types: Petrol, Diesel, CNG, Electric (growing rapidly)
- Price segments: Entry (₹3-8L), Mid (₹8-15L), Premium (₹15-30L), Luxury (₹30L+)
- Key factors: Fuel efficiency, maintenance cost, resale value, reliability, current availability

"""
        
        if context:
            context_info = "\n\nCurrent Data Context:\n"
            
            if 'vehicles' in context:
                vehicles = context['vehicles']
                context_info += f"- Available vehicles: {len(vehicles)}\n"
                
                # Add price range info
                prices = [v.get('best_price', 0) for v in vehicles if v.get('best_price', 0) > 0]
                if prices:
                    context_info += f"- Price range: ₹{min(prices):,} - ₹{max(prices):,}\n"
                
                # Add popular makes
                makes = {}
                for v in vehicles:
                    make = v.get('make', 'Unknown')
                    makes[make] = makes.get(make, 0) + 1
                
                top_makes = sorted(makes.items(), key=lambda x: x[1], reverse=True)[:5]
                context_info += f"- Top brands available: {', '.join([f'{make} ({count})' for make, count in top_makes])}\n"
            
            if 'search_criteria' in context:
                criteria = context['search_criteria']
                context_info += f"- User preferences: {criteria}\n"
            
            if 'recommendations' in context:
                recs = context['recommendations']
                context_info += f"- AI recommendations: {len(recs)} vehicles suggested\n"
        else:
            context_info = ""
        
        enhanced_prompt = f"{system_prompt}{context_info}\nUser Question: {prompt}\n\nProvide a helpful, detailed response with specific recommendations and reasoning:"
        
        return enhanced_prompt
    
    def _fallback_response(self, prompt: str, context: Dict[str, Any] = None) -> str:
        """Provide fallback response when AI is unavailable"""
        
        # Analyze prompt for intent
        prompt_lower = prompt.lower()
        
        if any(word in prompt_lower for word in ['recommend', 'suggest', 'best', 'good']):
            return self._generate_recommendation_fallback(context)
        elif any(word in prompt_lower for word in ['price', 'cost', 'deal', 'cheap']):
            return self._generate_price_analysis_fallback(context)
        elif any(word in prompt_lower for word in ['compare', 'vs', 'difference']):
            return self._generate_comparison_fallback(context)
        else:
            return """I'm here to help you with car recommendations and analysis! 

I can assist you with:
🚗 Finding the best car deals based on your budget
💰 Comparing prices across different platforms
🔍 Analyzing vehicle specifications and features
📊 Providing market insights and trends
🎯 Personalized recommendations based on your needs

Please ask me about specific cars, price ranges, or your requirements, and I'll provide detailed analysis and recommendations!"""
    
    def _generate_recommendation_fallback(self, context: Dict[str, Any] = None) -> str:
        """Generate recommendation using rule-based logic"""
        if not context or 'vehicles' not in context:
            return "I'd be happy to recommend cars! Please provide your budget, fuel preference, and intended use (city/highway) for personalized suggestions."
        
        vehicles = context['vehicles']
        if not vehicles:
            return "No vehicles found matching your criteria. Try adjusting your filters for better results."
        
        # Sort by condition score and price
        sorted_vehicles = sorted(vehicles, 
                               key=lambda x: (x.get('condition_score', 0), -x.get('best_price', float('inf'))), 
                               reverse=True)
        
        top_picks = sorted_vehicles[:3]
        
        response = "🎯 **Top Recommendations Based on Your Criteria:**\n\n"
        
        for i, vehicle in enumerate(top_picks, 1):
            make = vehicle.get('make', 'Unknown')
            model = vehicle.get('model', 'Unknown')
            year = vehicle.get('year', 'Unknown')
            price = vehicle.get('best_price', 0)
            platform = vehicle.get('best_deal_platform', 'Unknown')
            score = vehicle.get('condition_score', 0)
            
            response += f"**{i}. {make} {model} {year}**\n"
            response += f"   💰 Price: ₹{price:,} (Best deal on {platform.title()})\n"
            response += f"   ⭐ Condition Score: {score:.2f}/1.0\n"
            
            # Add brand insights
            brand_info = self.car_knowledge['indian_brands'].get(make, {})
            if brand_info:
                response += f"   🔧 Reliability: {brand_info.get('reliability', 'Good')}\n"
                response += f"   💸 Maintenance: {brand_info.get('maintenance', 'Medium')} cost\n"
            
            response += "\n"
        
        response += "💡 **Why these recommendations:**\n"
        response += "- High condition scores indicate well-maintained vehicles\n"
        response += "- Best prices found across multiple platforms\n"
        response += "- Reliable brands with good resale value\n"
        
        return response
    
    def _generate_price_analysis_fallback(self, context: Dict[str, Any] = None) -> str:
        """Generate price analysis using available data"""
        if not context or 'vehicles' not in context:
            return "For price analysis, please search for specific vehicles or provide your budget range."
        
        vehicles = context['vehicles']
        if not vehicles:
            return "No vehicles found for price analysis."
        
        prices = [v.get('best_price', 0) for v in vehicles if v.get('best_price', 0) > 0]
        if not prices:
            return "Price information not available for the selected vehicles."
        
        min_price = min(prices)
        max_price = max(prices)
        avg_price = sum(prices) / len(prices)
        
        # Find best deals
        sorted_by_price = sorted(vehicles, key=lambda x: x.get('best_price', float('inf')))
        best_deals = sorted_by_price[:3]
        
        response = "💰 **Price Analysis:**\n\n"
        response += f"📊 **Price Range:** ₹{min_price:,} - ₹{max_price:,}\n"
        response += f"📈 **Average Price:** ₹{avg_price:,.0f}\n\n"
        
        response += "🏆 **Best Deals Found:**\n\n"
        
        for i, vehicle in enumerate(best_deals, 1):
            make = vehicle.get('make', 'Unknown')
            model = vehicle.get('model', 'Unknown')
            year = vehicle.get('year', 'Unknown')
            price = vehicle.get('best_price', 0)
            platform = vehicle.get('best_deal_platform', 'Unknown')
            
            response += f"**{i}. {make} {model} {year}**\n"
            response += f"   💰 ₹{price:,} on {platform.title()}\n"
            
            # Calculate value score
            if avg_price > 0:
                value_score = ((avg_price - price) / avg_price) * 100
                if value_score > 0:
                    response += f"   📉 {value_score:.1f}% below average price\n"
            
            response += "\n"
        
        return response
    
    def _generate_comparison_fallback(self, context: Dict[str, Any] = None) -> str:
        """Generate vehicle comparison"""
        if not context or 'vehicles' not in context:
            return "For vehicle comparison, please search for specific models you want to compare."
        
        vehicles = context['vehicles']
        if len(vehicles) < 2:
            return "Need at least 2 vehicles for comparison. Please search for more vehicles."
        
        # Compare top 2 vehicles
        top_vehicles = sorted(vehicles, 
                            key=lambda x: x.get('condition_score', 0), 
                            reverse=True)[:2]
        
        v1, v2 = top_vehicles[0], top_vehicles[1]
        
        response = "🔍 **Vehicle Comparison:**\n\n"
        
        # Basic comparison
        response += f"**{v1.get('make', '')} {v1.get('model', '')} {v1.get('year', '')}** vs **{v2.get('make', '')} {v2.get('model', '')} {v2.get('year', '')}**\n\n"
        
        # Price comparison
        p1, p2 = v1.get('best_price', 0), v2.get('best_price', 0)
        if p1 and p2:
            cheaper = "Vehicle 1" if p1 < p2 else "Vehicle 2"
            savings = abs(p1 - p2)
            response += f"💰 **Price:** ₹{p1:,} vs ₹{p2:,}\n"
            response += f"   {cheaper} is ₹{savings:,} cheaper\n\n"
        
        # Condition comparison
        s1, s2 = v1.get('condition_score', 0), v2.get('condition_score', 0)
        better_condition = "Vehicle 1" if s1 > s2 else "Vehicle 2"
        response += f"⭐ **Condition:** {s1:.2f} vs {s2:.2f}\n"
        response += f"   {better_condition} has better condition score\n\n"
        
        # Age comparison
        y1, y2 = v1.get('year', 0), v2.get('year', 0)
        if y1 and y2:
            newer = "Vehicle 1" if y1 > y2 else "Vehicle 2"
            response += f"📅 **Year:** {y1} vs {y2}\n"
            response += f"   {newer} is newer\n\n"
        
        response += "💡 **Recommendation:** Choose based on your priorities - price, condition, or age."
        
        return response
    
    async def analyze_user_query(self, query: str, vehicle_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze user query and provide comprehensive response"""
        
        # Extract intent and entities from query
        intent = self._extract_intent(query)
        entities = self._extract_entities(query)
        
        # Prepare context
        context = {
            "vehicles": vehicle_data,
            "query": query,
            "intent": intent,
            "entities": entities,
            "timestamp": datetime.now().isoformat()
        }
        
        # Generate AI response
        ai_response = await self.generate_response(query, context)
        
        # Add structured recommendations
        recommendations = self._generate_structured_recommendations(vehicle_data, entities)
        
        return {
            "ai_response": ai_response,
            "intent": intent,
            "entities": entities,
            "recommendations": recommendations,
            "context": context
        }
    
    def _extract_intent(self, query: str) -> str:
        """Extract user intent from query"""
        query_lower = query.lower()
        
        if any(word in query_lower for word in ['recommend', 'suggest', 'best', 'good', 'should i buy']):
            return "recommendation"
        elif any(word in query_lower for word in ['price', 'cost', 'deal', 'cheap', 'expensive']):
            return "price_analysis"
        elif any(word in query_lower for word in ['compare', 'vs', 'difference', 'better']):
            return "comparison"
        elif any(word in query_lower for word in ['fuel', 'mileage', 'efficiency']):
            return "fuel_analysis"
        elif any(word in query_lower for word in ['maintenance', 'service', 'repair']):
            return "maintenance_info"
        elif any(word in query_lower for word in ['resale', 'value', 'depreciation']):
            return "resale_analysis"
        else:
            return "general_inquiry"
    
    def _extract_entities(self, query: str) -> Dict[str, Any]:
        """Extract entities like budget, brand, fuel type from query"""
        entities = {}
        
        # Extract budget
        budget_patterns = [
            r'₹\s*(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:lakh|crore)?',
            r'(\d+(?:\.\d+)?)\s*(?:lakh|crore)',
            r'budget.*?(\d+(?:\.\d+)?)',
            r'under.*?(\d+(?:\.\d+)?)'
        ]
        
        for pattern in budget_patterns:
            match = re.search(pattern, query.lower())
            if match:
                amount = float(match.group(1).replace(',', ''))
                if 'lakh' in query.lower():
                    entities['budget'] = amount * 100000
                elif 'crore' in query.lower():
                    entities['budget'] = amount * 10000000
                else:
                    entities['budget'] = amount
                break
        
        # Extract brands
        brands = ['maruti', 'suzuki', 'hyundai', 'honda', 'toyota', 'tata', 'mahindra', 'bmw', 'mercedes', 'audi']
        for brand in brands:
            if brand in query.lower():
                entities['brand'] = brand.title()
                break
        
        # Extract fuel type
        fuel_types = ['petrol', 'diesel', 'cng', 'electric', 'hybrid']
        for fuel in fuel_types:
            if fuel in query.lower():
                entities['fuel_type'] = fuel.title()
                break
        
        # Extract transmission
        if 'automatic' in query.lower():
            entities['transmission'] = 'Automatic'
        elif 'manual' in query.lower():
            entities['transmission'] = 'Manual'
        
        return entities
    
    def _generate_structured_recommendations(self, vehicles: List[Dict[str, Any]], entities: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate structured recommendations based on entities"""
        if not vehicles:
            return []
        
        # Filter vehicles based on entities
        filtered_vehicles = vehicles.copy()
        
        if 'budget' in entities:
            budget = entities['budget']
            filtered_vehicles = [v for v in filtered_vehicles if v.get('best_price', 0) <= budget]
        
        if 'brand' in entities:
            brand = entities['brand']
            filtered_vehicles = [v for v in filtered_vehicles if brand.lower() in v.get('make', '').lower()]
        
        if 'fuel_type' in entities:
            fuel = entities['fuel_type']
            filtered_vehicles = [v for v in filtered_vehicles if fuel.lower() in v.get('fuel_type', '').lower()]
        
        if 'transmission' in entities:
            trans = entities['transmission']
            filtered_vehicles = [v for v in filtered_vehicles if trans.lower() in v.get('transmission', '').lower()]
        
        # Sort by condition score and return top recommendations
        sorted_vehicles = sorted(filtered_vehicles, 
                               key=lambda x: (x.get('condition_score', 0), -x.get('best_price', float('inf'))), 
                               reverse=True)
        
        return sorted_vehicles[:5]  # Top 5 recommendations

    async def fetch_realtime_data(self, force_refresh: bool = False) -> List[Dict[str, Any]]:
        """Fetch real-time data from automotive websites"""
        from datetime import datetime, timedelta

        # Check if we need to refresh data (every 30 minutes)
        if (not force_refresh and self.last_data_fetch and
            datetime.now() - self.last_data_fetch < timedelta(minutes=30) and
            self.realtime_data_cache):
            logger.info("Using cached real-time data")
            return self.realtime_data_cache

        try:
            from realtime_car_scraper import fetch_realtime_car_data

            logger.info("Fetching fresh real-time car data...")
            fresh_data = await fetch_realtime_car_data(max_cars=100)

            if fresh_data:
                self.realtime_data_cache = fresh_data
                self.last_data_fetch = datetime.now()
                logger.info(f"Fetched {len(fresh_data)} real-time vehicles")
                return fresh_data
            else:
                logger.warning("No real-time data fetched, using cache")
                return self.realtime_data_cache

        except Exception as e:
            logger.error(f"Failed to fetch real-time data: {e}")
            return self.realtime_data_cache

    async def analyze_realtime_query(self, query: str, force_refresh: bool = False) -> Dict[str, Any]:
        """Analyze user query with real-time data"""

        # Fetch real-time data
        realtime_vehicles = await self.fetch_realtime_data(force_refresh)

        if not realtime_vehicles:
            logger.warning("No real-time data available")
            return await self.analyze_user_query(query, [])

        # Extract intent and entities
        intent = self._extract_intent(query)
        entities = self._extract_entities(query)

        # Filter real-time data based on entities
        filtered_vehicles = self._filter_realtime_vehicles(realtime_vehicles, entities)

        # Prepare enhanced context with real-time info
        context = {
            "vehicles": filtered_vehicles,
            "query": query,
            "intent": intent,
            "entities": entities,
            "data_source": "real-time",
            "total_available": len(realtime_vehicles),
            "filtered_count": len(filtered_vehicles),
            "last_updated": self.last_data_fetch.isoformat() if self.last_data_fetch else None,
            "sources": list(set([v.get('source', 'unknown') for v in realtime_vehicles])),
            "timestamp": datetime.now().isoformat()
        }

        # Generate AI response with real-time context
        ai_response = await self.generate_response(query, context)

        # Add structured recommendations
        recommendations = self._generate_structured_recommendations(filtered_vehicles, entities)

        # Add real-time market insights
        market_insights = self._generate_market_insights(realtime_vehicles, filtered_vehicles)

        return {
            "ai_response": ai_response,
            "intent": intent,
            "entities": entities,
            "recommendations": recommendations,
            "market_insights": market_insights,
            "data_source": "real-time",
            "total_vehicles_available": len(realtime_vehicles),
            "filtered_vehicles": len(filtered_vehicles),
            "sources_scraped": context["sources"],
            "last_data_update": context["last_updated"],
            "context": context
        }

    def _filter_realtime_vehicles(self, vehicles: List[Dict[str, Any]], entities: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Filter real-time vehicles based on user entities"""
        filtered = vehicles.copy()

        # Budget filter
        if 'budget' in entities:
            budget = entities['budget']
            filtered = [v for v in filtered if v.get('price', 0) <= budget]

        # Brand filter
        if 'brand' in entities:
            brand = entities['brand'].lower()
            filtered = [v for v in filtered if brand in v.get('make', '').lower()]

        # Fuel type filter
        if 'fuel_type' in entities:
            fuel = entities['fuel_type'].lower()
            filtered = [v for v in filtered if fuel in v.get('fuel_type', '').lower()]

        # Transmission filter
        if 'transmission' in entities:
            trans = entities['transmission'].lower()
            filtered = [v for v in filtered if trans in v.get('transmission', '').lower()]

        return filtered

    def _generate_market_insights(self, all_vehicles: List[Dict[str, Any]], filtered_vehicles: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Generate real-time market insights"""
        if not all_vehicles:
            return {}

        insights = {
            "total_listings": len(all_vehicles),
            "average_price": 0,
            "price_range": {"min": 0, "max": 0},
            "popular_brands": {},
            "fuel_distribution": {},
            "year_distribution": {},
            "location_distribution": {},
            "source_distribution": {},
            "condition_analysis": {}
        }

        # Price analysis
        prices = [v.get('price', 0) for v in all_vehicles if v.get('price', 0) > 0]
        if prices:
            insights["average_price"] = sum(prices) / len(prices)
            insights["price_range"] = {"min": min(prices), "max": max(prices)}

        # Brand distribution
        for vehicle in all_vehicles:
            make = vehicle.get('make', 'Unknown')
            insights["popular_brands"][make] = insights["popular_brands"].get(make, 0) + 1

        # Fuel type distribution
        for vehicle in all_vehicles:
            fuel = vehicle.get('fuel_type', 'Unknown')
            insights["fuel_distribution"][fuel] = insights["fuel_distribution"].get(fuel, 0) + 1

        # Year distribution
        for vehicle in all_vehicles:
            year = vehicle.get('year', 2020)
            year_range = f"{(year//5)*5}-{(year//5)*5+4}"
            insights["year_distribution"][year_range] = insights["year_distribution"].get(year_range, 0) + 1

        # Source distribution
        for vehicle in all_vehicles:
            source = vehicle.get('source', 'Unknown')
            insights["source_distribution"][source] = insights["source_distribution"].get(source, 0) + 1

        # Condition analysis
        conditions = [v.get('condition_score', 0) for v in all_vehicles if v.get('condition_score', 0) > 0]
        if conditions:
            insights["condition_analysis"] = {
                "average_condition": sum(conditions) / len(conditions),
                "excellent_count": len([c for c in conditions if c >= 0.8]),
                "good_count": len([c for c in conditions if 0.6 <= c < 0.8]),
                "fair_count": len([c for c in conditions if c < 0.6])
            }

        return insights

    def generate_advanced_recommendations(self, vehicles: List[Dict[str, Any]], user_preferences: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate advanced AI-powered recommendations with scoring algorithms"""

        if not vehicles:
            return []

        # Extract user preferences
        budget = user_preferences.get('budget', float('inf'))
        fuel_preference = user_preferences.get('fuel_type', '').lower()
        transmission_preference = user_preferences.get('transmission', '').lower()
        location_preference = user_preferences.get('location', '').lower()
        brand_preference = user_preferences.get('brand', '').lower()
        usage_type = user_preferences.get('usage', 'mixed').lower()  # city, highway, mixed
        priority = user_preferences.get('priority', 'balanced').lower()  # price, features, reliability, fuel_efficiency

        # Filter vehicles by budget
        affordable_vehicles = [v for v in vehicles if v.get('best_price', 0) <= budget]

        if not affordable_vehicles:
            return []

        # Score each vehicle
        scored_vehicles = []
        for vehicle in affordable_vehicles:
            score = self._calculate_recommendation_score(vehicle, user_preferences)
            if score > 0:
                vehicle_copy = vehicle.copy()
                vehicle_copy['recommendation_score'] = score
                vehicle_copy['recommendation_reasons'] = self._generate_recommendation_reasons(vehicle, user_preferences)
                scored_vehicles.append(vehicle_copy)

        # Sort by score and return top recommendations
        scored_vehicles.sort(key=lambda x: x['recommendation_score'], reverse=True)
        return scored_vehicles[:10]

    def _calculate_recommendation_score(self, vehicle: Dict[str, Any], preferences: Dict[str, Any]) -> float:
        """Calculate comprehensive recommendation score for a vehicle"""

        score = 0.0
        max_score = 0.0

        # Price score (30% weight)
        budget = preferences.get('budget', float('inf'))
        price = vehicle.get('best_price', 0)
        if price > 0 and budget > 0:
            price_ratio = price / budget
            if price_ratio <= 0.7:  # Well under budget
                price_score = 1.0
            elif price_ratio <= 0.9:  # Reasonable
                price_score = 0.8
            elif price_ratio <= 1.0:  # At budget
                price_score = 0.6
            else:
                price_score = 0.0

            score += price_score * 0.3
            max_score += 0.3

        # Condition score (25% weight)
        condition = vehicle.get('condition_score', 0)
        if condition > 0:
            score += condition * 0.25
            max_score += 0.25

        # Brand reliability score (15% weight)
        make = vehicle.get('make', '').lower()
        brand_info = self.car_knowledge['indian_brands'].get(make, {})
        if brand_info:
            reliability = brand_info.get('reliability', 'Good')
            reliability_scores = {
                'very high': 1.0, 'high': 0.8, 'good': 0.6, 'fair': 0.4, 'poor': 0.2
            }
            reliability_score = reliability_scores.get(reliability.lower(), 0.6)
            score += reliability_score * 0.15
            max_score += 0.15

        # Fuel preference match (10% weight)
        fuel_preference = preferences.get('fuel_type', '').lower()
        vehicle_fuel = vehicle.get('fuel_type', '').lower()
        if fuel_preference and vehicle_fuel:
            if fuel_preference in vehicle_fuel:
                score += 1.0 * 0.1
            max_score += 0.1

        # Transmission preference match (10% weight)
        trans_preference = preferences.get('transmission', '').lower()
        vehicle_trans = vehicle.get('transmission', '').lower()
        if trans_preference and vehicle_trans:
            if trans_preference in vehicle_trans:
                score += 1.0 * 0.1
            max_score += 0.1

        # Location proximity (5% weight)
        location_preference = preferences.get('location', '').lower()
        vehicle_location = vehicle.get('location', '').lower()
        if location_preference and vehicle_location:
            if location_preference in vehicle_location:
                score += 1.0 * 0.05
            max_score += 0.05

        # Brand preference (5% weight)
        brand_preference = preferences.get('brand', '').lower()
        vehicle_make = vehicle.get('make', '').lower()
        if brand_preference and vehicle_make:
            if brand_preference in vehicle_make:
                score += 1.0 * 0.05
            max_score += 0.05

        # Normalize score
        if max_score > 0:
            normalized_score = score / max_score
        else:
            normalized_score = 0.0

        return normalized_score

    def _generate_recommendation_reasons(self, vehicle: Dict[str, Any], preferences: Dict[str, Any]) -> List[str]:
        """Generate human-readable reasons for recommendation"""

        reasons = []

        # Price reasons
        budget = preferences.get('budget', float('inf'))
        price = vehicle.get('best_price', 0)
        if price > 0 and budget > 0:
            price_ratio = price / budget
            if price_ratio <= 0.7:
                reasons.append(f"Excellent value - {(1-price_ratio)*100:.0f}% under your budget")
            elif price_ratio <= 0.9:
                reasons.append("Good value within your budget")

        # Condition reasons
        condition = vehicle.get('condition_score', 0)
        if condition >= 0.8:
            reasons.append("Excellent condition")
        elif condition >= 0.6:
            reasons.append("Good condition")

        # Brand reasons
        make = vehicle.get('make', '').lower()
        brand_info = self.car_knowledge['indian_brands'].get(make, {})
        if brand_info:
            reliability = brand_info.get('reliability', '')
            maintenance = brand_info.get('maintenance', '')
            if reliability in ['Very High', 'High']:
                reasons.append(f"Highly reliable {make} brand")
            if maintenance in ['Low']:
                reasons.append("Low maintenance costs")

        # Multi-platform availability
        sources = vehicle.get('source_platforms', [])
        if len(sources) > 1:
            reasons.append(f"Available on {len(sources)} platforms for comparison")

        # Best deal
        if vehicle.get('best_deal_platform'):
            reasons.append(f"Best price found on {vehicle.get('best_deal_platform', '').title()}")

        # Fuel efficiency
        fuel_type = vehicle.get('fuel_type', '').lower()
        if fuel_type in ['cng', 'electric']:
            reasons.append("Eco-friendly and fuel-efficient")
        elif fuel_type == 'diesel':
            reasons.append("Good for long-distance driving")

        return reasons[:5]  # Limit to top 5 reasons

    def generate_market_comparison(self, vehicle: Dict[str, Any], similar_vehicles: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Generate market comparison for a specific vehicle"""

        if not similar_vehicles:
            return {}

        # Find similar vehicles (same make/model, similar year)
        make = vehicle.get('make', '').lower()
        model = vehicle.get('model', '').lower()
        year = vehicle.get('year', 0)

        comparable_vehicles = []
        for v in similar_vehicles:
            if (v.get('make', '').lower() == make and
                v.get('model', '').lower() == model and
                abs(v.get('year', 0) - year) <= 2):
                comparable_vehicles.append(v)

        if not comparable_vehicles:
            return {}

        # Calculate market statistics
        prices = [v.get('best_price', 0) for v in comparable_vehicles if v.get('best_price', 0) > 0]
        conditions = [v.get('condition_score', 0) for v in comparable_vehicles if v.get('condition_score', 0) > 0]

        vehicle_price = vehicle.get('best_price', 0)
        vehicle_condition = vehicle.get('condition_score', 0)

        comparison = {
            "market_size": len(comparable_vehicles),
            "price_analysis": {},
            "condition_analysis": {},
            "market_position": "",
            "value_assessment": ""
        }

        if prices:
            avg_price = sum(prices) / len(prices)
            min_price = min(prices)
            max_price = max(prices)

            comparison["price_analysis"] = {
                "market_average": avg_price,
                "market_range": {"min": min_price, "max": max_price},
                "vehicle_price": vehicle_price,
                "price_percentile": len([p for p in prices if p <= vehicle_price]) / len(prices) * 100
            }

            # Price position
            if vehicle_price <= avg_price * 0.9:
                comparison["market_position"] = "Below market average - Good deal"
            elif vehicle_price <= avg_price * 1.1:
                comparison["market_position"] = "Around market average"
            else:
                comparison["market_position"] = "Above market average"

        if conditions:
            avg_condition = sum(conditions) / len(conditions)

            comparison["condition_analysis"] = {
                "market_average_condition": avg_condition,
                "vehicle_condition": vehicle_condition,
                "condition_percentile": len([c for c in conditions if c <= vehicle_condition]) / len(conditions) * 100
            }

        # Overall value assessment
        if vehicle_price > 0 and vehicle_condition > 0 and prices and conditions:
            price_ratio = vehicle_price / avg_price
            condition_ratio = vehicle_condition / avg_condition

            if price_ratio <= 0.9 and condition_ratio >= 1.0:
                comparison["value_assessment"] = "Excellent value - Below average price with above average condition"
            elif price_ratio <= 1.0 and condition_ratio >= 0.9:
                comparison["value_assessment"] = "Good value - Fair price with good condition"
            elif price_ratio >= 1.1 and condition_ratio <= 0.9:
                comparison["value_assessment"] = "Poor value - High price with below average condition"
            else:
                comparison["value_assessment"] = "Average value proposition"

        return comparison
