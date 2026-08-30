import numpy as np
from typing import List, Optional, Dict
from models import TechnicalIndicators


def calculate_sma(prices: List[float], period: int) -> Optional[float]:
    """Calculate Simple Moving Average."""
    if len(prices) < period:
        return None
    return sum(prices[-period:]) / period

def calculate_ema(prices: List[float], period: int) -> Optional[float]:
    """Calculate Exponential Moving Average."""
    if len(prices) < period:
        return None
    
    multiplier = 2 / (period + 1)
    ema = prices[0]
    
    for price in prices[1:]:
        ema = (price * multiplier) + (ema * (1 - multiplier))
    
    return ema

def calculate_rsi(prices: List[float], period: int = 14) -> Optional[float]:
    """Calculate Relative Strength Index."""
    if len(prices) < period + 1:
        return None
    
    deltas = np.diff(prices)
    gains = np.where(deltas > 0, deltas, 0)
    losses = np.where(deltas < 0, -deltas, 0)
    
    avg_gain = np.mean(gains[-period:])
    avg_loss = np.mean(losses[-period:])
    
    if avg_loss == 0:
        return 100
    
    rs = avg_gain / avg_loss
    rsi = 100 - (100 / (1 + rs))
    
    return rsi

def calculate_macd(prices: List[float], fast: int = 12, slow: int = 26, signal: int = 9) -> Dict:
    """Calculate MACD indicator."""
    if not prices:
        return {'macd': 0.0, 'signal': 0.0, 'histogram': 0.0}
    
    if len(prices) < slow:
        actual_fast = max(2, min(fast, len(prices) // 2))
        actual_slow = max(3, len(prices))
    else:
        actual_fast = fast
        actual_slow = slow

    ema_fast = calculate_ema(prices, actual_fast) or prices[-1]
    ema_slow = calculate_ema(prices, actual_slow) or prices[0]
    
    macd_line = ema_fast - ema_slow
    signal_line = macd_line * 0.85
    histogram = macd_line - signal_line
    
    return {
        'macd': macd_line,
        'signal': signal_line,
        'histogram': histogram
    }

def calculate_bollinger_bands(prices: List[float], period: int = 20, std_dev: int = 2) -> Dict:
    """Calculate Bollinger Bands."""
    if len(prices) < period:
        return {}
    
    sma = calculate_sma(prices, period)
    if sma is None:
        return {}
    
    std = np.std(prices[-period:])
    
    return {
        'middle': sma,
        'upper': sma + (std_dev * std),
        'lower': sma - (std_dev * std)
    }

def calculate_technical_indicators(price_data: List[Dict]) -> TechnicalIndicators:
    """Calculate all technical indicators from price data."""
    if not price_data:
        return TechnicalIndicators(price=0)
    
    prices = [data['price'] for data in price_data]
    volumes = [data.get('volume', 0) for data in price_data]
    
    current_price = prices[-1]
    
    # Moving averages
    dma_20 = calculate_sma(prices, 20)
    dma_50 = calculate_sma(prices, 50)
    dma_200 = calculate_sma(prices, 200)
    
    # RSI
    rsi = calculate_rsi(prices)
    
    # MACD
    macd_data = calculate_macd(prices)
    
    # Bollinger Bands
    bollinger_data = calculate_bollinger_bands(prices)
    
    # Momentum (price change over 10 periods)
    momentum = None
    if len(prices) >= 10:
        momentum = ((prices[-1] - prices[-10]) / prices[-10]) * 100
    
    # Volatility (standard deviation of returns)
    volatility = None
    if len(prices) >= 20:
        returns = np.diff(prices[-20:]) / prices[-20:-1]
        volatility = np.std(returns) * 100
    
    # 52-week high/low
    fifty_two_week_high = max(prices[-252:]) if len(prices) >= 252 else max(prices)
    fifty_two_week_low = min(prices[-252:]) if len(prices) >= 252 else min(prices)
    
    # Support/Resistance (simplified - recent lows/highs)
    support = min(prices[-20:]) if len(prices) >= 20 else min(prices)
    resistance = max(prices[-20:]) if len(prices) >= 20 else max(prices)
    
    return TechnicalIndicators(
        price=current_price,
        dma_20=dma_20,
        dma_50=dma_50,
        dma_200=dma_200,
        rsi=rsi,
        macd=macd_data.get('macd'),
        macd_signal=macd_data.get('signal'),
        macd_histogram=macd_data.get('histogram'),
        bollinger_upper=bollinger_data.get('upper'),
        bollinger_lower=bollinger_data.get('lower'),
        bollinger_middle=bollinger_data.get('middle'),
        volume=volumes[-1] if volumes else None,
        momentum=momentum,
        volatility=volatility,
        fifty_two_week_high=fifty_two_week_high,
        fifty_two_week_low=fifty_two_week_low,
        support=support,
        resistance=resistance
    )

def generate_sample_price_data(base_price: float, days: int = 252) -> List[Dict]:
    """Generate sample price data for demo purposes."""
    np.random.seed(42)
    prices = []
    price = base_price
    
    for i in range(days):
        change = np.random.normal(0, 0.02)  # 2% daily volatility
        price = price * (1 + change)
        volume = np.random.randint(1000000, 5000000)
        prices.append({
            'price': max(price, 1),  # Ensure positive price
            'volume': volume
        })
    
    return prices
