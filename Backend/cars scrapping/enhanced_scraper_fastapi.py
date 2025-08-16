"""
Enhanced Car Scraper for FastAPI
Supports: Spinny, CarWale, SAHIvalue, CarDekho, OLX, CarTrade
"""

import aiohttp
import asyncio
from bs4 import BeautifulSoup
import json
import logging
import random
import re
from typing import List, Dict, Any
from datetime import datetime
import hashlib
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from webdriver_manager.chrome import ChromeDriverManager
import time

logger = logging.getLogger(__name__)

class EnhancedCarScraperFastAPI:
    """Enhanced async scraper for Indian automotive websites"""
    
    def __init__(self):
        self.session = None
        self.user_agents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        ]
        
        # Website configurations with updated selectors
        self.sources = {
            'spinny': {
                'base_url': 'https://www.spinny.com',
                'search_url': 'https://www.spinny.com/used-cars/',
                'use_selenium': True,
                'selectors': {
                    'car_cards': '[class*="car"], [data-testid*="car"], .listing-card, .vehicle-card',
                    'title': 'h1, h2, h3, h4, [class*="title"], [class*="name"]',
                    'price': '[class*="price"], [class*="amount"], [class*="cost"]',
                    'location': '[class*="location"], [class*="city"], [class*="place"]',
                    'year': '[class*="year"], [class*="model"]',
                    'mileage': '[class*="km"], [class*="mileage"], [class*="distance"]',
                    'fuel_type': '[class*="fuel"], [class*="petrol"], [class*="diesel"]',
                    'transmission': '[class*="transmission"], [class*="manual"], [class*="automatic"]'
                }
            },
            'carwale': {
                'base_url': 'https://www.carwale.com',
                'search_url': 'https://www.carwale.com/used-cars-in-mumbai/',
                'use_selenium': True,
                'selectors': {
                    'car_cards': '[class*="car"], [class*="vehicle"], [class*="listing"], .item, .card',
                    'title': 'h1, h2, h3, h4, [class*="title"], [class*="name"]',
                    'price': '[class*="price"], [class*="amount"], [class*="cost"]',
                    'location': '[class*="location"], [class*="city"], [class*="place"]',
                    'year': '[class*="year"], [class*="model"]',
                    'mileage': '[class*="km"], [class*="mileage"], [class*="distance"]',
                    'fuel_type': '[class*="fuel"], [class*="petrol"], [class*="diesel"]',
                    'transmission': '[class*="transmission"], [class*="manual"], [class*="automatic"]'
                }
            },
            'sahivalue': {
                'base_url': 'https://www.sahivalue.com',
                'search_url': 'https://www.sahivalue.com/used-cars/',
                'selectors': {
                    'car_cards': '.car-listing, .vehicle-item, .listing-card',
                    'title': '.car-name, .vehicle-title, h3',
                    'price': '.car-price, .price-display, .amount',
                    'location': '.car-location, .location-info, .city',
                    'year': '.car-year, .year-info, .year',
                    'mileage': '.car-mileage, .mileage-info, .km',
                    'fuel_type': '.fuel-info, .fuel-type, .fuel',
                    'transmission': '.transmission-info, .transmission'
                }
            },
            'cardekho': {
                'base_url': 'https://www.cardekho.com',
                'search_url': 'https://www.cardekho.com/used-cars-in-mumbai',
                'use_selenium': True,
                'selectors': {
                    'car_cards': '[class*="car"], [class*="vehicle"], [class*="listing"], .gsc_col-12, .item',
                    'title': 'h1, h2, h3, h4, [class*="title"], [class*="name"]',
                    'price': '[class*="price"], [class*="amount"], [class*="cost"]',
                    'location': '[class*="location"], [class*="city"], [class*="place"]',
                    'year': '[class*="year"], [class*="model"]',
                    'mileage': '[class*="km"], [class*="mileage"], [class*="distance"]',
                    'fuel_type': '[class*="fuel"], [class*="petrol"], [class*="diesel"]',
                    'transmission': '[class*="transmission"], [class*="manual"], [class*="automatic"]'
                }
            },
            'olx': {
                'base_url': 'https://www.olx.in',
                'search_url': 'https://www.olx.in/cars_c84',
                'selectors': {
                    'car_cards': '._1DNjI, .EIR5N, ._2Gr10',
                    'title': '._2tW1I, .fnQZA, h3',
                    'price': '._1zgtX, .notranslate, ._2Ks63',
                    'location': '._1RkZP, ._2YgOr, .zLvFQ',
                    'year': '.year, .model-year, ._2Ks63',
                    'mileage': '.mileage, .km, ._2Ks63',
                    'fuel_type': '.fuel, .fuel-type, ._2Ks63',
                    'transmission': '.transmission, ._2Ks63'
                }
            },
            'cartrade': {
                'base_url': 'https://www.cartrade.com',
                'search_url': 'https://www.cartrade.com/buy-used-cars/',
                'selectors': {
                    'car_cards': '.car-card, .vehicle-card, .listing-item',
                    'title': '.car-title, .vehicle-name, h3',
                    'price': '.price-value, .car-price, .amount',
                    'location': '.car-location, .location, .city',
                    'year': '.car-year, .year, .model-year',
                    'mileage': '.car-mileage, .mileage, .km',
                    'fuel_type': '.fuel-type, .fuel, .engine-type',
                    'transmission': '.transmission-type, .transmission'
                }
            }
        }
    
    async def get_session(self):
        """Get or create aiohttp session"""
        if self.session is None:
            timeout = aiohttp.ClientTimeout(total=30)
            self.session = aiohttp.ClientSession(timeout=timeout)
        return self.session
    
    def get_headers(self):
        """Get random headers"""
        return {
            'User-Agent': random.choice(self.user_agents),
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        }
    
    async def make_request(self, url: str, retries: int = 3) -> str:
        """Make async HTTP request"""
        session = await self.get_session()

        for attempt in range(retries):
            try:
                headers = self.get_headers()

                async with session.get(url, headers=headers) as response:
                    if response.status == 200:
                        content = await response.text()
                        return content
                    elif response.status == 429:
                        # Rate limited
                        wait_time = random.uniform(10, 30)
                        logger.warning(f"Rate limited. Waiting {wait_time:.1f} seconds...")
                        await asyncio.sleep(wait_time)
                    else:
                        logger.warning(f"HTTP {response.status} for {url}")

            except Exception as e:
                logger.error(f"Request failed (attempt {attempt + 1}): {e}")
                if attempt < retries - 1:
                    await asyncio.sleep(random.uniform(2, 5))

        return None

    def get_selenium_driver(self):
        """Get Selenium WebDriver with optimized settings"""
        try:
            chrome_options = Options()
            chrome_options.add_argument('--headless')
            chrome_options.add_argument('--no-sandbox')
            chrome_options.add_argument('--disable-dev-shm-usage')
            chrome_options.add_argument('--disable-gpu')
            chrome_options.add_argument('--window-size=1920,1080')
            chrome_options.add_argument(f'--user-agent={random.choice(self.user_agents)}')
            chrome_options.add_argument('--disable-blink-features=AutomationControlled')
            chrome_options.add_argument('--disable-web-security')
            chrome_options.add_argument('--allow-running-insecure-content')
            chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
            chrome_options.add_experimental_option('useAutomationExtension', False)

            # Try multiple methods to get ChromeDriver
            driver = None

            # Method 1: Try webdriver-manager
            try:
                service = Service(ChromeDriverManager().install())
                driver = webdriver.Chrome(service=service, options=chrome_options)
            except Exception as e1:
                logger.warning(f"WebDriver manager failed: {e1}")

                # Method 2: Try system Chrome
                try:
                    driver = webdriver.Chrome(options=chrome_options)
                except Exception as e2:
                    logger.warning(f"System Chrome failed: {e2}")
                    raise Exception(f"All Chrome methods failed: {e1}, {e2}")

            if driver:
                driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
                return driver
            else:
                raise Exception("No driver created")

        except Exception as e:
            logger.error(f"Failed to create Selenium driver: {e}")
            return None

    async def make_selenium_request(self, url: str, wait_for_selector: str = None) -> str:
        """Make request using Selenium for JavaScript-heavy sites"""
        driver = None
        try:
            driver = self.get_selenium_driver()
            if not driver:
                return None

            logger.info(f"Loading page with Selenium: {url}")
            driver.get(url)

            # Wait for page to load
            time.sleep(3)

            # Wait for specific selector if provided
            if wait_for_selector:
                try:
                    WebDriverWait(driver, 10).until(
                        EC.presence_of_element_located((By.CSS_SELECTOR, wait_for_selector))
                    )
                except TimeoutException:
                    logger.warning(f"Timeout waiting for selector: {wait_for_selector}")

            # Scroll to load more content
            driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
            time.sleep(2)

            # Get page source
            content = driver.page_source
            return content

        except Exception as e:
            logger.error(f"Selenium request failed: {e}")
            return None
        finally:
            if driver:
                driver.quit()
    
    async def scrape_source(self, source: str, max_pages: int = 3) -> List[Dict[str, Any]]:
        """Scrape a specific source"""
        logger.info(f"Starting scrape for {source}")
        
        if source not in self.sources:
            logger.error(f"Unknown source: {source}")
            return []
        
        config = self.sources[source]
        all_vehicles = []
        
        for page in range(1, max_pages + 1):
            try:
                # Construct page URL
                if page == 1:
                    page_url = config['search_url']
                else:
                    separator = '&' if '?' in config['search_url'] else '?'
                    page_url = f"{config['search_url']}{separator}page={page}"
                
                logger.info(f"Scraping {source} page {page}: {page_url}")

                # Choose request method based on site configuration
                if config.get('use_selenium', False):
                    # Use Selenium for JavaScript-heavy sites
                    car_cards_selector = config.get('selectors', {}).get('car_cards', '')
                    first_selector = car_cards_selector.split(',')[0].strip() if car_cards_selector else None
                    html_content = await self.make_selenium_request(page_url, first_selector)
                else:
                    # Use regular HTTP request
                    html_content = await self.make_request(page_url)

                if not html_content:
                    logger.warning(f"Failed to get content for {source} page {page}")
                    continue
                
                # Parse HTML
                soup = BeautifulSoup(html_content, 'html.parser')
                
                # Extract vehicle data
                vehicles = self.extract_vehicle_data(soup, source, config)
                all_vehicles.extend(vehicles)
                
                logger.info(f"Extracted {len(vehicles)} vehicles from {source} page {page}")
                
                # Rate limiting between pages
                await asyncio.sleep(random.uniform(3, 7))
                
            except Exception as e:
                logger.error(f"Error scraping {source} page {page}: {e}")
                continue
        
        logger.info(f"Completed scraping {source}: {len(all_vehicles)} total vehicles")
        return all_vehicles
    
    def extract_vehicle_data(self, soup: BeautifulSoup, source: str, config: Dict) -> List[Dict[str, Any]]:
        """Extract vehicle data from HTML soup"""
        vehicles = []
        selectors = config.get('selectors', {})

        # Find car cards using multiple selectors
        car_cards = []
        car_cards_selectors = selectors.get('car_cards', '').split(', ')

        for selector in car_cards_selectors:
            selector = selector.strip()
            if selector:
                try:
                    cards = soup.select(selector)
                    if cards:
                        logger.info(f"Found {len(cards)} elements with selector '{selector}' on {source}")
                        car_cards.extend(cards)
                except Exception as e:
                    logger.warning(f"Error with selector '{selector}': {e}")
                    continue

        # Remove duplicates while preserving order
        seen = set()
        unique_cards = []
        for card in car_cards:
            card_html = str(card)[:100]  # Use first 100 chars as identifier
            if card_html not in seen:
                seen.add(card_html)
                unique_cards.append(card)

        logger.info(f"Processing {len(unique_cards)} unique car cards on {source}")

        for i, card in enumerate(unique_cards):
            try:
                vehicle_data = self._extract_single_vehicle(card, selectors, source, i)
                if vehicle_data:
                    vehicles.append(vehicle_data)
            except Exception as e:
                logger.error(f"Error extracting vehicle data from card {i}: {e}")
                continue

        return vehicles
    
    def _extract_single_vehicle(self, card, selectors: Dict[str, str], source: str, index: int = 0) -> Dict[str, Any]:
        """Extract data for a single vehicle"""
        try:
            # Get all text from the card for analysis
            card_text = card.get_text(strip=True)

            # Skip if card doesn't contain car-related keywords
            car_keywords = ['car', 'vehicle', 'price', 'lakh', 'km', 'year', 'model', 'maruti', 'honda', 'hyundai', 'toyota', 'tata']
            if not any(keyword in card_text.lower() for keyword in car_keywords):
                return None

            # Extract title using multiple selectors
            title = self._extract_text_multi_selector(card, selectors.get('title', ''))

            # If no title found, try to extract from card text
            if not title:
                # Look for car names in the text
                lines = card_text.split('\n')
                for line in lines:
                    line = line.strip()
                    if len(line) > 10 and any(keyword in line.lower() for keyword in ['maruti', 'honda', 'hyundai', 'toyota', 'tata', 'mahindra']):
                        title = line
                        break

            if not title or len(title) < 5:
                logger.debug(f"No valid title found for card {index} on {source}")
                return None

            # Parse make, model, year from title
            make, model, year, variant = self._parse_vehicle_title(title)

            # Extract other fields with fallback to text analysis
            price_text = self._extract_text_multi_selector(card, selectors.get('price', ''))
            if not price_text:
                # Look for price in card text
                price_patterns = [r'₹\s*[\d,]+(?:\.\d+)?\s*(?:lakh|crore)?', r'[\d,]+(?:\.\d+)?\s*(?:lakh|crore)']
                for pattern in price_patterns:
                    match = re.search(pattern, card_text, re.IGNORECASE)
                    if match:
                        price_text = match.group()
                        break

            price_value = self._extract_price_value(price_text)

            location = self._extract_text_multi_selector(card, selectors.get('location', ''))
            if not location:
                # Look for location patterns
                location_patterns = [r'\b(?:mumbai|delhi|bangalore|chennai|kolkata|pune|hyderabad|ahmedabad|jaipur|lucknow)\b']
                for pattern in location_patterns:
                    match = re.search(pattern, card_text, re.IGNORECASE)
                    if match:
                        location = match.group()
                        break

            mileage_text = self._extract_text_multi_selector(card, selectors.get('mileage', ''))
            if not mileage_text:
                # Look for mileage patterns
                mileage_patterns = [r'[\d,]+\s*km', r'[\d,]+\s*kms']
                for pattern in mileage_patterns:
                    match = re.search(pattern, card_text, re.IGNORECASE)
                    if match:
                        mileage_text = match.group()
                        break

            kms_reading = self._extract_mileage_value(mileage_text)

            fuel_type = self._extract_text_multi_selector(card, selectors.get('fuel_type', ''))
            if not fuel_type:
                # Look for fuel type in text
                if 'petrol' in card_text.lower():
                    fuel_type = 'Petrol'
                elif 'diesel' in card_text.lower():
                    fuel_type = 'Diesel'
                elif 'cng' in card_text.lower():
                    fuel_type = 'CNG'

            transmission = self._extract_text_multi_selector(card, selectors.get('transmission', ''))
            if not transmission:
                # Look for transmission in text
                if 'automatic' in card_text.lower():
                    transmission = 'Automatic'
                elif 'manual' in card_text.lower():
                    transmission = 'Manual'

            # Generate unique vehicle ID
            vehicle_id = self._generate_vehicle_id(make, model, year, variant, kms_reading, source, index)

            # Create vehicle data
            vehicle = {
                "vehicle_id": vehicle_id,
                "make": make,
                "model": model,
                "year": year,
                "variant": variant,
                "price": {source: price_value} if price_value > 0 else {},
                "kms_reading": kms_reading,
                "location": location,
                "transmission": transmission,
                "fuel_type": fuel_type,
                "source_platforms": [source],
                "vehicle_details": {
                    "original_title": title,
                    "price_text": price_text,
                    "mileage_text": mileage_text,
                    "source_url": self.sources[source]['base_url'],
                    "card_text_sample": card_text[:200]  # First 200 chars for debugging
                },
                "scraped_at": datetime.now().isoformat()
            }

            # Only return if we have essential data
            if make and (price_value > 0 or year > 0 or kms_reading > 0):
                return vehicle
            else:
                logger.debug(f"Insufficient data for vehicle on {source}: {title}")
                return None
            
        except Exception as e:
            logger.error(f"Error extracting single vehicle: {e}")
            return None
    
    def _extract_text_multi_selector(self, card, selectors: str) -> str:
        """Extract text using multiple CSS selectors"""
        if not selectors:
            return ""
        
        for selector in selectors.split(', '):
            try:
                element = card.select_one(selector.strip())
                if element:
                    text = element.get_text(strip=True)
                    if text:
                        return text
            except Exception:
                continue
        
        return ""
    
    def _parse_vehicle_title(self, title: str) -> tuple:
        """Parse make, model, year, and variant from title"""
        # Common Indian car makes
        indian_makes = [
            'Maruti', 'Suzuki', 'Hyundai', 'Honda', 'Toyota', 'Tata', 'Mahindra',
            'Ford', 'Volkswagen', 'BMW', 'Mercedes', 'Audi', 'Kia', 'Renault', 
            'Nissan', 'Skoda', 'Chevrolet', 'Datsun', 'Jeep', 'MG', 'Isuzu'
        ]
        
        # Extract year (4-digit number between 1990-2030)
        year_match = re.search(r'\b(19[9]\d|20[0-3]\d)\b', title)
        year = int(year_match.group(1)) if year_match else 0
        
        # Extract make
        make = ""
        title_upper = title.upper()
        for make_name in indian_makes:
            if make_name.upper() in title_upper:
                make = make_name
                break
        
        # Extract model and variant
        model = ""
        variant = ""
        
        # Remove year and make from title to get model and variant
        clean_title = title
        if year_match:
            clean_title = clean_title.replace(year_match.group(1), "").strip()
        if make:
            clean_title = re.sub(rf'\b{re.escape(make)}\b', "", clean_title, flags=re.IGNORECASE).strip()
        
        # Split remaining text to get model and variant
        parts = clean_title.split()
        if parts:
            model = parts[0] if parts else ""
            variant = " ".join(parts[1:]) if len(parts) > 1 else ""
        
        return make, model, year, variant
    
    def _extract_price_value(self, price_text: str) -> float:
        """Extract numeric price value from text"""
        if not price_text:
            return 0.0
        
        # Remove currency symbols and normalize
        price_clean = re.sub(r'[₹,\s]', '', price_text.lower())
        
        # Handle lakhs and crores
        multiplier = 1
        if 'lakh' in price_clean:
            multiplier = 100000
            price_clean = price_clean.replace('lakh', '')
        elif 'crore' in price_clean:
            multiplier = 10000000
            price_clean = price_clean.replace('crore', '')
        
        # Extract numeric value
        numbers = re.findall(r'\d+\.?\d*', price_clean)
        if numbers:
            try:
                return float(numbers[0]) * multiplier
            except ValueError:
                return 0.0
        
        return 0.0
    
    def _extract_mileage_value(self, mileage_text: str) -> int:
        """Extract numeric mileage value from text"""
        if not mileage_text:
            return 0
        
        # Remove units and normalize
        mileage_clean = re.sub(r'[,\s]', '', mileage_text.lower())
        mileage_clean = mileage_clean.replace('km', '').replace('kms', '')
        
        # Extract numeric value
        numbers = re.findall(r'\d+', mileage_clean)
        if numbers:
            try:
                return int(numbers[0])
            except ValueError:
                return 0
        
        return 0
    
    def _generate_vehicle_id(self, make: str, model: str, year: int, variant: str, kms: int, source: str, index: int = 0) -> str:
        """Generate unique vehicle ID"""
        key_string = f"{make.lower()}_{model.lower()}_{year}_{variant.lower()}_{kms}_{source}_{index}"
        hash_object = hashlib.md5(key_string.encode())
        return f"vehicle_{hash_object.hexdigest()[:12]}"
    
    async def close(self):
        """Close the session"""
        if self.session:
            await self.session.close()
