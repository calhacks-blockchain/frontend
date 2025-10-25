"use client";

import React, { useEffect, useRef } from 'react';
import { createChart, ColorType, CandlestickSeries, Time } from 'lightweight-charts'; // Removed HistogramSeries

interface TradingChartProps {
  launchpadPubkey: string;
}

interface CandleData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  buyCount?: number;
  sellCount?: number;
}

const TradingChart = ({ launchpadPubkey }: TradingChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    // Initialize the chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#131722' },
        textColor: '#D9D9D9',
      },
      grid: {
        vertLines: { color: '#2A2E39' },
        horzLines: { color: '#2A2E39' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 500,
    });

    // Configure the main price scale
    chart.priceScale('right').applyOptions({
      borderColor: '#71649C',
      scaleMargins: {
        top: 0.2,    // 20% margin at top
        bottom: 0.2, // 20% margin at bottom
      },
    });

    // Configure the time scale
    chart.timeScale().fitContent();

    // 1. Add the Candlestick Series for Price
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
      priceScaleId: 'right',
    });

    // 2. --- VOLUME SERIES AND SCALE REMOVED ---
    // const volumeSeries = ... (REMOVED)
    // chart.priceScale('').applyOptions(...) (REMOVED)


    // Fetch and process data from your API
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/ohlcv/${launchpadPubkey}?interval=1m`, {
          cache: 'no-store',
        });
        const { candles } = await response.json() as { candles: CandleData[] };

        // Process candles with continuity - each candle opens at previous close
        let lastClose: number | null = null;
        const priceData = candles.map((candle: CandleData) => {
          const buyCount = candle.buyCount || 0;
          const sellCount = candle.sellCount || 0;
          const totalTrades = buyCount + sellCount;
          
          let adjustedClose = Number(candle.close);
          let adjustedOpen = Number(candle.open);
          let adjustedHigh = Number(candle.high);
          let adjustedLow = Number(candle.low);
          
          // Use previous close as open if we have a previous candle
          if (lastClose !== null) {
            adjustedOpen = lastClose;
            // Adjust high/low to include the open price
            adjustedHigh = Math.max(adjustedHigh, adjustedOpen);
            adjustedLow = Math.min(adjustedLow, adjustedOpen);
          }
          
          // If we have trade data, adjust the close price to reflect trade type dominance
          if (totalTrades > 0) {
            if (buyCount > sellCount) {
              // More buys than sells - ensure close >= open for green candle
              adjustedClose = Math.max(adjustedClose, adjustedOpen);
            } else if (sellCount > buyCount) {
              // More sells than buys - ensure close <= open for red candle
              adjustedClose = Math.min(adjustedClose, adjustedOpen);
            }
            // If equal buys/sells, keep original prices
          }
          
          // Ensure high/low include both open and close
          adjustedHigh = Math.max(adjustedHigh, adjustedClose);
          adjustedLow = Math.min(adjustedLow, adjustedClose);
          
          // Save this close for next candle
          lastClose = adjustedClose;
          
          return {
            time: (new Date(candle.time).getTime() / 1000) as Time,
            open: adjustedOpen,
            high: adjustedHigh,
            low: adjustedLow,
            close: adjustedClose,
          };
        });

        // --- VOLUME DATA PROCESSING REMOVED ---
        // const volumeData = ... (REMOVED)

        // Debug: Log sample candle data to see trade counts
        if (candles.length > 0) {
          console.log('Sample candle data with trade counts:', candles.slice(0, 3).map(c => ({
            time: c.time,
            buyCount: c.buyCount,
            sellCount: c.sellCount,
            open: c.open,
            close: c.close,
            high: c.high,
            low: c.low
          })));
        }

        // Set the data for the price series
        candleSeries.setData(priceData);
        // volumeSeries.setData(volumeData); // (REMOVED)

        // Fit the chart content to the screen
        chart.timeScale().fitContent();

      } catch (error) {
        console.error('Failed to fetch chart data:', error);
      }
    };

    fetchData();

    // Make the chart responsive
    window.addEventListener('resize', handleResize);

    // Cleanup function
    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [launchpadPubkey]);

  return <div ref={chartContainerRef} id="trading-chart-container" />;
};

export default TradingChart;