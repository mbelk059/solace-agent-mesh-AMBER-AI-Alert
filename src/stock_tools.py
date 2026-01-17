"""
Stock EOD (End of Day) data tools using Marketstack API.
Simplified and robust version.
"""
import requests
from typing import Optional, Dict, Any
from datetime import datetime


# TODO: Remove API key before pushing to GitHub!
DEFAULT_API_KEY = ""  # ⚠️ ADD KEY HERE!!!!


def get_eod_data(
    symbols: str,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    exchange: Optional[str] = None,
    limit: Optional[int] = None,
    offset: Optional[int] = None,
    sort: Optional[str] = None,
    marketstack_api_key: Optional[str] = None
) -> Dict[str, Any]:
    """
    Get end-of-day stock data from Marketstack API.
    
    Args:
        symbols: One or more comma-separated ticker symbols (e.g., 'AAPL' or 'AAPL,MSFT')
        date_from: Start date in YYYY-MM-DD format
        date_to: End date in YYYY-MM-DD format
        exchange: Exchange MIC code (e.g., 'XNAS' for NASDAQ)
        limit: Results per page (1-1000, default 100)
        offset: Number of results to skip
        sort: 'ASC' or 'DESC'
        marketstack_api_key: Your API key
        
    Returns:
        Dict containing EOD data
    """
    
    try:
        # Get API key
        api_key = marketstack_api_key or DEFAULT_API_KEY
        
        if not api_key:
            return {
                "error": "No API key provided",
                "success": False
            }
        
        # Clean up symbols
        symbols = symbols.upper().strip().replace(".", "-")
        
        # Build params - only include non-None values
        params = {
            "access_key": api_key,
            "symbols": symbols
        }
        
        if date_from:
            params["date_from"] = date_from
        if date_to:
            params["date_to"] = date_to
        if exchange:
            params["exchange"] = exchange.upper()
        if limit is not None:
            params["limit"] = min(max(int(limit), 1), 1000)
        if offset is not None:
            params["offset"] = max(int(offset), 0)
        if sort:
            params["sort"] = sort.upper()
        
        # Make request
        url = "https://api.marketstack.com/v2/eod"
        response = requests.get(url, params=params, timeout=30)
        
        # Parse response
        data = response.json()
        
        # Check for errors
        if response.status_code != 200:
            return {
                "error": data.get("error", {}).get("message", "Unknown error"),
                "status_code": response.status_code,
                "success": False,
                "request_url": response.url
            }
        
        if "error" in data:
            return {
                "error": data["error"].get("message", "API error"),
                "success": False
            }
        
        # Success - return data
        return {
            "success": True,
            "symbols": symbols,
            "pagination": data.get("pagination", {}),
            "data": data.get("data", []),
            "count": len(data.get("data", [])),
            "params_used": params
        }
        
    except requests.exceptions.RequestException as e:
        return {
            "error": f"Request failed: {str(e)}",
            "success": False,
            "error_type": "network"
        }
    except Exception as e:
        return {
            "error": f"Unexpected error: {str(e)}",
            "success": False,
            "error_type": "unknown"
        }


def analyze_price_trends(eod_data: list) -> Dict[str, Any]:
    """
    Analyze price trends from EOD data.
    
    Args:
        eod_data: List of EOD data dictionaries
        
    Returns:
        Dict containing trend analysis
    """
    try:
        if not eod_data:
            return {"error": "No data to analyze"}
        
        # Extract prices and volumes
        closes = []
        volumes = []
        
        for item in eod_data:
            if isinstance(item, dict):
                if "close" in item and item["close"] is not None:
                    closes.append(float(item["close"]))
                if "volume" in item and item["volume"] is not None:
                    volumes.append(float(item["volume"]))
        
        if not closes:
            return {"error": "No valid price data"}
        
        # Calculate statistics
        analysis = {
            "price_stats": {
                "current": closes[0] if closes else None,
                "highest": max(closes) if closes else None,
                "lowest": min(closes) if closes else None,
                "average": sum(closes) / len(closes) if closes else None
            },
            "data_points": len(eod_data)
        }
        
        # Calculate change
        if len(closes) > 1:
            change = closes[0] - closes[-1]
            change_pct = (change / closes[-1] * 100) if closes[-1] != 0 else 0
            analysis["price_stats"]["change"] = change
            analysis["price_stats"]["change_percent"] = change_pct
        
        # Volume stats
        if volumes:
            analysis["volume_stats"] = {
                "average": sum(volumes) / len(volumes),
                "highest": max(volumes),
                "lowest": min(volumes)
            }
        
        return analysis
        
    except Exception as e:
        return {
            "error": f"Analysis failed: {str(e)}",
            "error_type": "analysis"
        }


# Test function you can run directly
def test_api():
    """Test the API with a simple call"""
    print("Testing Marketstack API...")
    result = get_eod_data("AAPL", limit=5)
    print(f"Success: {result.get('success')}")
    if result.get('success'):
        print(f"Got {result.get('count')} data points")
        if result.get('data'):
            latest = result['data'][0]
            print(f"Latest close: ${latest.get('close')}")
    else:
        print(f"Error: {result.get('error')}")
    return result


if __name__ == "__main__":
    # Run test if executed directly
    test_api()