"""
FastAPI Enhanced Vehicle Data Aggregation System
Scrapes data from Spinny, CarWale, SAHIvalue, CarDekho, OLX, CarTrade
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks, Query
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import json
import csv
import os
import logging
import asyncio
from datetime import datetime
import pandas as pd
from enhanced_scraper_fastapi import EnhancedCarScraperFastAPI
from data_processor import DataProcessor
from ai_car_assistant import OllamaCarAssistant

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI app
app = FastAPI(
    title="Enhanced Vehicle Data Aggregation System",
    description="AI-powered system for scraping and analyzing vehicle data from multiple Indian automotive platforms",
    version="2.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables
scraper = None
data_processor = None
ai_assistant = None
scraping_status = {
    "in_progress": False,
    "last_scrape": None,
    "total_scraped": 0,
    "current_source": None,
    "progress": 0
}

# Pydantic models
class ScrapeRequest(BaseModel):
    sources: Optional[List[str]] = ["spinny", "carwale", "sahivalue", "cardekho", "olx", "cartrade"]
    max_pages_per_source: Optional[int] = 3
    location_filter: Optional[str] = None
    price_range: Optional[Dict[str, int]] = None

class SearchRequest(BaseModel):
    make: Optional[str] = None
    model: Optional[str] = None
    year_min: Optional[int] = None
    year_max: Optional[int] = None
    price_min: Optional[int] = None
    price_max: Optional[int] = None
    fuel_type: Optional[str] = None
    transmission: Optional[str] = None
    location: Optional[str] = None
    limit: Optional[int] = 50

class RecommendationRequest(BaseModel):
    budget_max: Optional[int] = None
    fuel_type: Optional[str] = None
    transmission: Optional[str] = None
    location: Optional[str] = None
    limit: Optional[int] = 10

class AIAssistantRequest(BaseModel):
    query: str
    context: Optional[Dict[str, Any]] = None
    include_recommendations: Optional[bool] = True
    max_vehicles: Optional[int] = 100
    use_realtime_data: Optional[bool] = True
    force_refresh: Optional[bool] = False

@app.on_event("startup")
async def startup_event():
    """Initialize components on startup"""
    global scraper, data_processor, ai_assistant

    try:
        scraper = EnhancedCarScraperFastAPI()
        data_processor = DataProcessor()
        ai_assistant = OllamaCarAssistant()

        # Create required directories
        os.makedirs("data", exist_ok=True)
        os.makedirs("exports", exist_ok=True)
        os.makedirs("logs", exist_ok=True)

        # Check AI assistant connection
        ai_connected = await ai_assistant.check_ollama_connection()
        if ai_connected:
            logger.info("AI Assistant (Ollama) connected successfully")
        else:
            logger.warning("AI Assistant (Ollama) not available - using fallback responses")

        logger.info("FastAPI Vehicle Data Aggregation System with AI Assistant initialized successfully")

    except Exception as e:
        logger.error(f"Failed to initialize system: {e}")

@app.get("/")
async def root():
    """Root endpoint with system information"""
    return {
        "message": "Enhanced Vehicle Data Aggregation System - FastAPI",
        "version": "2.0.0",
        "features": [
            "Multi-source web scraping (Spinny, CarWale, SAHIvalue, CarDekho, OLX, CarTrade)",
            "Cross-platform vehicle matching",
            "Intelligent data analysis",
            "JSON and CSV export",
            "Real-time scraping status",
            "Advanced search and filtering"
        ],
        "endpoints": {
            "scraping": "/api/scrape",
            "status": "/api/status",
            "search": "/api/search",
            "export": "/api/export/{format}",
            "statistics": "/api/statistics"
        }
    }

@app.post("/api/scrape")
async def start_scraping(request: ScrapeRequest, background_tasks: BackgroundTasks):
    """Start scraping process in background"""
    global scraping_status
    
    if scraping_status["in_progress"]:
        raise HTTPException(status_code=400, detail="Scraping already in progress")
    
    # Start background scraping
    background_tasks.add_task(run_scraping_task, request)
    
    return {
        "message": "Scraping started successfully",
        "sources": request.sources,
        "max_pages_per_source": request.max_pages_per_source,
        "status": "started"
    }

async def run_scraping_task(request: ScrapeRequest):
    """Background task for scraping"""
    global scraping_status, scraper, data_processor
    
    scraping_status["in_progress"] = True
    scraping_status["total_scraped"] = 0
    scraping_status["progress"] = 0
    
    try:
        logger.info(f"Starting scraping from sources: {request.sources}")
        
        all_vehicles = []
        total_sources = len(request.sources)
        
        for i, source in enumerate(request.sources):
            scraping_status["current_source"] = source
            scraping_status["progress"] = int((i / total_sources) * 100)
            
            logger.info(f"Scraping {source}...")
            vehicles = await scraper.scrape_source(source, request.max_pages_per_source)
            all_vehicles.extend(vehicles)
            
            scraping_status["total_scraped"] = len(all_vehicles)
            
            # Small delay between sources
            await asyncio.sleep(2)
        
        # Process and save data
        if all_vehicles:
            logger.info(f"Processing {len(all_vehicles)} vehicles...")
            
            # Cross-reference and normalize data
            processed_vehicles = data_processor.process_vehicles(all_vehicles)
            
            # Save to JSON and CSV
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            
            # Save JSON
            json_file = f"data/vehicles_{timestamp}.json"
            with open(json_file, 'w', encoding='utf-8') as f:
                json.dump(processed_vehicles, f, indent=2, ensure_ascii=False, default=str)
            
            # Save CSV
            csv_file = f"data/vehicles_{timestamp}.csv"
            df = pd.DataFrame(processed_vehicles)
            df.to_csv(csv_file, index=False, encoding='utf-8')
            
            logger.info(f"Data saved to {json_file} and {csv_file}")
            
            scraping_status["last_scrape"] = datetime.now().isoformat()
            scraping_status["total_scraped"] = len(processed_vehicles)
        
        scraping_status["progress"] = 100
        
    except Exception as e:
        logger.error(f"Scraping failed: {e}")
        scraping_status["error"] = str(e)
    
    finally:
        scraping_status["in_progress"] = False
        scraping_status["current_source"] = None

@app.get("/api/status")
async def get_scraping_status():
    """Get current scraping status"""
    return scraping_status

@app.post("/api/search")
async def search_vehicles(request: SearchRequest):
    """Search vehicles with filters"""
    try:
        # Load latest data
        vehicles = data_processor.load_latest_data()
        
        # Apply filters
        filtered_vehicles = data_processor.filter_vehicles(vehicles, request.dict())
        
        # Limit results
        if request.limit:
            filtered_vehicles = filtered_vehicles[:request.limit]
        
        return {
            "vehicles": filtered_vehicles,
            "total": len(filtered_vehicles),
            "filters_applied": {k: v for k, v in request.dict().items() if v is not None}
        }
        
    except Exception as e:
        logger.error(f"Search failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/recommendations")
async def get_recommendations(request: RecommendationRequest):
    """Get personalized vehicle recommendations"""
    try:
        vehicles = data_processor.load_latest_data()
        recommendations = data_processor.get_recommendations(vehicles, request.dict())
        
        if request.limit:
            recommendations = recommendations[:request.limit]
        
        return {
            "recommendations": recommendations,
            "total": len(recommendations),
            "criteria": {k: v for k, v in request.dict().items() if v is not None}
        }
        
    except Exception as e:
        logger.error(f"Recommendations failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/statistics")
async def get_statistics():
    """Get system statistics"""
    try:
        vehicles = data_processor.load_latest_data()
        stats = data_processor.get_statistics(vehicles)
        
        return {
            "total_vehicles": len(vehicles),
            "last_update": scraping_status.get("last_scrape"),
            "sources_configured": 6,
            "statistics": stats,
            "scraping_status": {
                "in_progress": scraping_status["in_progress"],
                "total_scraped": scraping_status["total_scraped"]
            }
        }
        
    except Exception as e:
        logger.error(f"Statistics failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/export/{format}")
async def export_data(format: str):
    """Export data in specified format"""
    if format not in ["json", "csv"]:
        raise HTTPException(status_code=400, detail="Format must be 'json' or 'csv'")
    
    try:
        # Get latest file
        data_dir = "data"
        files = [f for f in os.listdir(data_dir) if f.startswith(f"vehicles_") and f.endswith(f".{format}")]
        
        if not files:
            raise HTTPException(status_code=404, detail=f"No {format} files found")
        
        # Get most recent file
        latest_file = max(files, key=lambda x: os.path.getctime(os.path.join(data_dir, x)))
        file_path = os.path.join(data_dir, latest_file)
        
        return FileResponse(
            path=file_path,
            filename=latest_file,
            media_type='application/octet-stream'
        )
        
    except Exception as e:
        logger.error(f"Export failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/sources")
async def get_available_sources():
    """Get list of available scraping sources"""
    return {
        "sources": [
            {
                "name": "spinny",
                "display_name": "Spinny",
                "url": "https://www.spinny.com",
                "status": "active"
            },
            {
                "name": "carwale",
                "display_name": "CarWale", 
                "url": "https://www.carwale.com",
                "status": "active"
            },
            {
                "name": "sahivalue",
                "display_name": "SAHIvalue",
                "url": "https://www.sahivalue.com",
                "status": "active"
            },
            {
                "name": "cardekho",
                "display_name": "CarDekho",
                "url": "https://www.cardekho.com",
                "status": "active"
            },
            {
                "name": "olx",
                "display_name": "OLX",
                "url": "https://www.olx.in",
                "status": "active"
            },
            {
                "name": "cartrade",
                "display_name": "CarTrade",
                "url": "https://www.cartrade.com",
                "status": "active"
            }
        ]
    }

@app.post("/api/ai-assistant")
async def ai_assistant_chat(request: AIAssistantRequest):
    """AI Assistant for car recommendations and analysis with real-time data"""
    global ai_assistant, data_processor

    try:
        if not ai_assistant:
            raise HTTPException(status_code=503, detail="AI Assistant not available")

        # Use real-time data if requested
        if request.use_realtime_data:
            logger.info("Using real-time data for AI analysis")
            analysis = await ai_assistant.analyze_realtime_query(request.query, request.force_refresh)
        else:
            # Fallback to stored data
            logger.info("Using stored data for AI analysis")
            vehicles = data_processor.load_latest_data()

            # Limit vehicles for performance
            if len(vehicles) > request.max_vehicles:
                vehicles = vehicles[:request.max_vehicles]

            analysis = await ai_assistant.analyze_user_query(request.query, vehicles)

        # Prepare response
        response_data = {
            "ai_response": analysis["ai_response"],
            "intent": analysis["intent"],
            "entities": analysis["entities"],
            "query": request.query,
            "data_source": analysis.get("data_source", "stored"),
            "timestamp": datetime.now().isoformat()
        }

        # Add real-time specific data
        if request.use_realtime_data and "market_insights" in analysis:
            response_data["market_insights"] = analysis["market_insights"]
            response_data["total_vehicles_available"] = analysis.get("total_vehicles_available", 0)
            response_data["sources_scraped"] = analysis.get("sources_scraped", [])
            response_data["last_data_update"] = analysis.get("last_data_update")

        # Add recommendations
        if request.include_recommendations and analysis.get("recommendations"):
            response_data["recommendations"] = analysis["recommendations"][:10]  # Top 10
            response_data["recommendation_count"] = len(analysis["recommendations"])

        return response_data

    except Exception as e:
        logger.error(f"AI Assistant failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ai-best-deals")
async def ai_find_best_deals(request: AIAssistantRequest):
    """AI-powered best deal finder"""
    global ai_assistant, data_processor

    try:
        if not ai_assistant:
            raise HTTPException(status_code=503, detail="AI Assistant not available")

        # Get all vehicle data
        vehicles = data_processor.load_latest_data()

        # Enhanced query for deal finding
        deal_query = f"Find the best deals and value-for-money cars. User query: {request.query}"

        # Analyze for best deals
        analysis = await ai_assistant.analyze_user_query(deal_query, vehicles)

        # Find best deals using AI logic
        best_deals = []
        if vehicles:
            # Sort by value score (condition score / price ratio)
            for vehicle in vehicles:
                price = vehicle.get('best_price', 0)
                condition = vehicle.get('condition_score', 0)
                if price > 0:
                    value_score = condition / (price / 100000)  # Normalize price
                    vehicle['value_score'] = value_score

            # Sort by value score
            sorted_vehicles = sorted(vehicles, key=lambda x: x.get('value_score', 0), reverse=True)
            best_deals = sorted_vehicles[:15]  # Top 15 deals

        return {
            "ai_analysis": analysis["ai_response"],
            "best_deals": best_deals,
            "deal_count": len(best_deals),
            "analysis_method": "AI-powered value scoring",
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        logger.error(f"Best deals analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ai-cross-validation")
async def ai_cross_validation(request: AIAssistantRequest):
    """AI-powered cross-validation of vehicle data"""
    global ai_assistant, data_processor

    try:
        if not ai_assistant:
            raise HTTPException(status_code=503, detail="AI Assistant not available")

        vehicles = data_processor.load_latest_data()

        # Cross-validation analysis
        validation_results = {
            "total_vehicles": len(vehicles),
            "price_validation": {},
            "data_quality": {},
            "market_analysis": {},
            "anomalies": []
        }

        if vehicles:
            # Price validation across platforms
            price_data = {}
            for vehicle in vehicles:
                make_model = f"{vehicle.get('make', '')} {vehicle.get('model', '')}"
                year = vehicle.get('year', 0)
                price = vehicle.get('best_price', 0)

                key = f"{make_model} {year}"
                if key not in price_data:
                    price_data[key] = []
                if price > 0:
                    price_data[key].append(price)

            # Find price anomalies
            for key, prices in price_data.items():
                if len(prices) > 1:
                    avg_price = sum(prices) / len(prices)
                    for price in prices:
                        deviation = abs(price - avg_price) / avg_price
                        if deviation > 0.3:  # 30% deviation
                            validation_results["anomalies"].append({
                                "vehicle": key,
                                "price": price,
                                "average": avg_price,
                                "deviation": f"{deviation*100:.1f}%"
                            })

            validation_results["price_validation"] = {
                "unique_models": len(price_data),
                "price_anomalies": len(validation_results["anomalies"]),
                "validation_score": max(0, 1 - len(validation_results["anomalies"]) / len(vehicles))
            }

        # Generate AI analysis
        validation_query = f"Analyze the cross-validation results and data quality. User query: {request.query}"
        analysis = await ai_assistant.analyze_user_query(validation_query, vehicles)

        validation_results["ai_analysis"] = analysis["ai_response"]
        validation_results["timestamp"] = datetime.now().isoformat()

        return validation_results

    except Exception as e:
        logger.error(f"Cross-validation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/scrape-realtime")
async def scrape_realtime_data():
    """Scrape real-time data from automotive websites"""
    global ai_assistant

    try:
        if not ai_assistant:
            raise HTTPException(status_code=503, detail="AI Assistant not available")

        logger.info("Starting real-time data scraping...")

        # Force refresh real-time data
        realtime_data = await ai_assistant.fetch_realtime_data(force_refresh=True)

        if realtime_data:
            # Save the data
            from realtime_car_scraper import RealTimeCarScraper
            scraper = RealTimeCarScraper()
            files = scraper.save_realtime_data(realtime_data, 'both')

            # Generate summary
            summary = {
                "total_vehicles": len(realtime_data),
                "sources": list(set([v.get('source', 'unknown') for v in realtime_data])),
                "brands": list(set([v.get('make', 'unknown') for v in realtime_data])),
                "price_range": {
                    "min": min([v.get('price', 0) for v in realtime_data if v.get('price', 0) > 0], default=0),
                    "max": max([v.get('price', 0) for v in realtime_data if v.get('price', 0) > 0], default=0)
                },
                "files_created": files,
                "scraped_at": datetime.now().isoformat()
            }

            return {
                "status": "success",
                "message": "Real-time data scraped successfully",
                "summary": summary
            }
        else:
            return {
                "status": "warning",
                "message": "No real-time data could be scraped",
                "summary": {"total_vehicles": 0}
            }

    except Exception as e:
        logger.error(f"Real-time scraping failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/realtime-status")
async def realtime_status():
    """Get status of real-time data"""
    global ai_assistant

    try:
        if not ai_assistant:
            return {"status": "AI Assistant not available"}

        cache_size = len(ai_assistant.realtime_data_cache)
        last_fetch = ai_assistant.last_data_fetch

        return {
            "cached_vehicles": cache_size,
            "last_data_fetch": last_fetch.isoformat() if last_fetch else None,
            "cache_age_minutes": (datetime.now() - last_fetch).total_seconds() / 60 if last_fetch else None,
            "sources_available": ["cars24", "carwale", "cardekho"],
            "status": "ready" if cache_size > 0 else "no_data"
        }

    except Exception as e:
        logger.error(f"Realtime status check failed: {e}")
        return {"status": "error", "message": str(e)}

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    ai_status = False
    if ai_assistant:
        ai_status = await ai_assistant.check_ollama_connection()

    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "scraper_ready": scraper is not None,
        "processor_ready": data_processor is not None,
        "ai_assistant_ready": ai_assistant is not None,
        "ollama_connected": ai_status,
        "ollama_model": ai_assistant.model if ai_assistant else None,
        "realtime_scraping": True,
        "realtime_cache_size": len(ai_assistant.realtime_data_cache) if ai_assistant else 0,
        "system_version": "2.1.0",
        "features": {
            "real_time_scraping": True,
            "ai_assistant": ai_status,
            "cross_referencing": True,
            "export_formats": ["json", "csv"],
            "supported_sources": 6
        }
    }

@app.post("/api/ai-chat")
async def ai_chat_endpoint(request: AIAssistantRequest):
    """Enhanced AI chat endpoint with conversation context"""
    global ai_assistant

    try:
        if not ai_assistant:
            raise HTTPException(status_code=503, detail="AI Assistant not available")

        # Enhanced query processing
        if request.use_realtime_data:
            analysis = await ai_assistant.analyze_realtime_query(request.query, request.force_refresh)
        else:
            vehicles = data_processor.load_latest_data()
            if len(vehicles) > request.max_vehicles:
                vehicles = vehicles[:request.max_vehicles]
            analysis = await ai_assistant.analyze_user_query(request.query, vehicles)

        # Enhanced response with conversation context
        response = {
            "response": analysis["ai_response"],
            "intent": analysis["intent"],
            "entities": analysis["entities"],
            "conversation_id": f"conv_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            "query": request.query,
            "timestamp": datetime.now().isoformat(),
            "data_source": analysis.get("data_source", "stored"),
            "processing_time_ms": 0  # Could add timing
        }

        # Add context-specific data
        if request.use_realtime_data:
            response.update({
                "market_insights": analysis.get("market_insights", {}),
                "total_vehicles_analyzed": analysis.get("total_vehicles_available", 0),
                "sources_checked": analysis.get("sources_scraped", []),
                "data_freshness": analysis.get("last_data_update")
            })

        if request.include_recommendations:
            response["recommendations"] = analysis.get("recommendations", [])[:10]
            response["recommendation_count"] = len(analysis.get("recommendations", []))

        return response

    except Exception as e:
        logger.error(f"AI chat failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/market-trends")
async def get_market_trends():
    """Get current market trends and insights"""
    try:
        vehicles = data_processor.load_latest_data()

        if not vehicles:
            return {"message": "No data available for trend analysis"}

        # Calculate trends
        trends = {
            "total_listings": len(vehicles),
            "price_trends": {},
            "popular_brands": {},
            "fuel_preferences": {},
            "transmission_trends": {},
            "location_hotspots": {},
            "age_distribution": {},
            "condition_analysis": {}
        }

        # Price analysis
        prices = [v.get('best_price', 0) for v in vehicles if v.get('best_price', 0) > 0]
        if prices:
            trends["price_trends"] = {
                "average": sum(prices) / len(prices),
                "median": sorted(prices)[len(prices)//2],
                "min": min(prices),
                "max": max(prices),
                "under_5_lakh": len([p for p in prices if p < 500000]),
                "5_to_10_lakh": len([p for p in prices if 500000 <= p < 1000000]),
                "10_to_20_lakh": len([p for p in prices if 1000000 <= p < 2000000]),
                "above_20_lakh": len([p for p in prices if p >= 2000000])
            }

        # Brand popularity
        for vehicle in vehicles:
            make = vehicle.get('make', 'Unknown')
            trends["popular_brands"][make] = trends["popular_brands"].get(make, 0) + 1

        # Fuel preferences
        for vehicle in vehicles:
            fuel = vehicle.get('fuel_type', 'Unknown')
            trends["fuel_preferences"][fuel] = trends["fuel_preferences"].get(fuel, 0) + 1

        # Transmission trends
        for vehicle in vehicles:
            trans = vehicle.get('transmission', 'Unknown')
            trends["transmission_trends"][trans] = trends["transmission_trends"].get(trans, 0) + 1

        # Location analysis
        for vehicle in vehicles:
            location = vehicle.get('location', 'Unknown')
            trends["location_hotspots"][location] = trends["location_hotspots"].get(location, 0) + 1

        # Age distribution
        current_year = datetime.now().year
        for vehicle in vehicles:
            year = vehicle.get('year', current_year)
            age = current_year - year
            age_group = f"{(age//2)*2}-{(age//2)*2+1} years"
            trends["age_distribution"][age_group] = trends["age_distribution"].get(age_group, 0) + 1

        # Condition analysis
        conditions = [v.get('condition_score', 0) for v in vehicles if v.get('condition_score', 0) > 0]
        if conditions:
            trends["condition_analysis"] = {
                "average_condition": sum(conditions) / len(conditions),
                "excellent_count": len([c for c in conditions if c >= 0.8]),
                "good_count": len([c for c in conditions if 0.6 <= c < 0.8]),
                "fair_count": len([c for c in conditions if c < 0.6])
            }

        return {
            "market_trends": trends,
            "analysis_date": datetime.now().isoformat(),
            "data_points": len(vehicles)
        }

    except Exception as e:
        logger.error(f"Market trends analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/dashboard")
async def get_dashboard_data():
    """Get comprehensive dashboard data"""
    try:
        vehicles = data_processor.load_latest_data()

        # System status
        ai_status = False
        if ai_assistant:
            ai_status = await ai_assistant.check_ollama_connection()

        dashboard = {
            "system_status": {
                "total_vehicles": len(vehicles),
                "ai_assistant": "✅ Online" if ai_status else "❌ Offline",
                "ollama_model": ai_assistant.model if ai_assistant else None,
                "last_scrape": scraping_status.get("last_scrape"),
                "scraping_active": scraping_status.get("in_progress", False),
                "realtime_cache": len(ai_assistant.realtime_data_cache) if ai_assistant else 0
            },
            "quick_stats": {},
            "recent_listings": [],
            "top_deals": [],
            "popular_searches": {
                "brands": {},
                "price_ranges": {},
                "fuel_types": {}
            }
        }

        if vehicles:
            # Quick stats
            prices = [v.get('best_price', 0) for v in vehicles if v.get('best_price', 0) > 0]
            dashboard["quick_stats"] = {
                "total_listings": len(vehicles),
                "average_price": int(sum(prices) / len(prices)) if prices else 0,
                "price_range": {
                    "min": min(prices) if prices else 0,
                    "max": max(prices) if prices else 0
                },
                "unique_brands": len(set([v.get('make', '') for v in vehicles])),
                "locations_covered": len(set([v.get('location', '') for v in vehicles]))
            }

            # Recent listings (last 10)
            sorted_vehicles = sorted(vehicles,
                                   key=lambda x: x.get('scraped_at', ''),
                                   reverse=True)
            dashboard["recent_listings"] = sorted_vehicles[:10]

            # Top deals (best value for money)
            deals = []
            for vehicle in vehicles:
                price = vehicle.get('best_price', 0)
                condition = vehicle.get('condition_score', 0)
                if price > 0 and condition > 0:
                    value_score = condition / (price / 100000)  # Normalize
                    vehicle_copy = vehicle.copy()
                    vehicle_copy['value_score'] = value_score
                    deals.append(vehicle_copy)

            dashboard["top_deals"] = sorted(deals,
                                          key=lambda x: x.get('value_score', 0),
                                          reverse=True)[:10]

            # Popular searches simulation
            for vehicle in vehicles:
                make = vehicle.get('make', 'Unknown')
                dashboard["popular_searches"]["brands"][make] = \
                    dashboard["popular_searches"]["brands"].get(make, 0) + 1

                fuel = vehicle.get('fuel_type', 'Unknown')
                dashboard["popular_searches"]["fuel_types"][fuel] = \
                    dashboard["popular_searches"]["fuel_types"].get(fuel, 0) + 1

                price = vehicle.get('best_price', 0)
                if price > 0:
                    if price < 500000:
                        range_key = "Under 5L"
                    elif price < 1000000:
                        range_key = "5L-10L"
                    elif price < 2000000:
                        range_key = "10L-20L"
                    else:
                        range_key = "Above 20L"

                    dashboard["popular_searches"]["price_ranges"][range_key] = \
                        dashboard["popular_searches"]["price_ranges"].get(range_key, 0) + 1

        return {
            "dashboard": dashboard,
            "generated_at": datetime.now().isoformat(),
            "refresh_interval": "30 seconds"
        }

    except Exception as e:
        logger.error(f"Dashboard data generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/bulk-search")
async def bulk_search_vehicles(
    queries: List[str] = Query(..., description="List of search queries"),
    max_results_per_query: int = Query(10, description="Max results per query")
):
    """Perform bulk search across multiple queries"""
    try:
        vehicles = data_processor.load_latest_data()
        results = {}

        for query in queries:
            # Simple keyword matching for bulk search
            query_lower = query.lower()
            matching_vehicles = []

            for vehicle in vehicles:
                # Check if query matches make, model, or fuel type
                make = vehicle.get('make', '').lower()
                model = vehicle.get('model', '').lower()
                fuel = vehicle.get('fuel_type', '').lower()

                if (query_lower in make or
                    query_lower in model or
                    query_lower in fuel or
                    query_lower in f"{make} {model}"):
                    matching_vehicles.append(vehicle)

            # Limit results
            results[query] = matching_vehicles[:max_results_per_query]

        return {
            "bulk_search_results": results,
            "total_queries": len(queries),
            "total_matches": sum(len(matches) for matches in results.values()),
            "processed_at": datetime.now().isoformat()
        }

    except Exception as e:
        logger.error(f"Bulk search failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    
    print("🚗 Enhanced Vehicle Data Aggregation System - FastAPI")
    print("=" * 60)
    print("Sources: Spinny, CarWale, SAHIvalue, CarDekho, OLX, CarTrade")
    print("Features: JSON/CSV export, Real-time scraping, Advanced search")
    print("=" * 60)
    
    uvicorn.run(
        "fastapi_main:app",
        host="192.168.0.89",  # Your IPv4 address for network access
        port=8000,
        reload=True,
        log_level="info"
    )
