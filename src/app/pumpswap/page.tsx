"use client";

import {
	CategoryScale,
	Chart as ChartJS,
	Legend,
	LineElement,
	LinearScale,
	PointElement,
	ScriptableContext,
	TimeScale,
	Title,
	Tooltip,
} from "chart.js";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";

// Register Chart.js components
ChartJS.register(
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	Title,
	Tooltip,
	Legend,
	TimeScale,
);

interface ChartDataPoint {
	date: number; // Unix timestamp
	totalLiquidityUSD: number;
}

interface PumpSwapData {
	name?: string;
	description?: string;
	tvl?: number;
	chainTvls?: Record<string, number>;
	change_1d?: number;
	change_7d?: number;
	change_1m?: number;
	category?: string;
	tvlPrevDay?: number;
	tvlPrevWeek?: number;
	tvlPrevMonth?: number;
}

interface ChartTooltipContext {
	dataset: {
		label?: string;
	};
	parsed: {
		y: number | null;
	};
}

export default function PumpSwapPage() {
	const [data, setData] = useState<PumpSwapData | null>(null);
	const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [activeTab, setActiveTab] = useState("tvl");

	useEffect(() => {
		const fetchData = async () => {
			try {
				const response = await fetch("/api/pumpswap");
				if (!response.ok) {
					throw new Error("Failed to fetch data");
				}
				const result = await response.json();
				setData(result);
			} catch (err) {
				setError("Failed to load PumpSwap data");
				console.error(err);
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, []);

	const formatCurrency = (value: number) => {
		return new Intl.NumberFormat("en-US", {
			style: "currency",
			currency: "USD",
			maximumFractionDigits: 0,
		}).format(value);
	};

	const formatDate = (timestamp: number) => {
		return new Date(timestamp * 1000).toLocaleDateString("en-US", {
			month: "numeric",
			day: "numeric",
		});
	};

	// Prepare chart options and data
	const chartOptions = {
		responsive: true,
		maintainAspectRatio: false,
		scales: {
			x: {
				grid: {
					display: false,
				},
			},
			y: {
				grid: {
					color: "rgba(0, 0, 0, 0.05)",
				},
				ticks: {
					callback: (value: any) => {
						if (value >= 1000000) {
							return `$${(value / 1000000).toFixed(0)}m`;
						}
						if (value >= 1000) {
							return `$${(value / 1000).toFixed(0)}k`;
						}
						return `$${value}`;
					},
				},
			},
		},
		plugins: {
			legend: {
				display: false,
			},
			tooltip: {
				callbacks: {
					label: (context: ChartTooltipContext) => {
						let label = context.dataset.label || "";
						if (label) {
							label += ": ";
						}
						if (context.parsed.y !== null) {
							label += formatCurrency(context.parsed.y);
						}
						return label;
					},
				},
			},
		},
	};

	const prepareChartData = () => {
		// Get last 30 days of data for the chart
		const recentData = chartData.slice(-30);

		return {
			labels: recentData.map((item) => formatDate(item.date)),
			datasets: [
				{
					label: "Total Value Locked (TVL)",
					data: recentData.map((item) => item.totalLiquidityUSD),
					borderColor: "rgb(34, 197, 94)",
					backgroundColor: "rgba(34, 197, 94, 0.1)",
					borderWidth: 2,
					pointRadius: 0,
					pointHoverRadius: 4,
					fill: true,
					tension: 0.3,
				},
			],
		};
	};

	return (
		<div className="min-h-screen p-8 bg-gray-50">
			<Link
				href="/"
				className="text-blue-500 hover:underline mb-4 inline-block"
			>
				← Back to Home
			</Link>

			<div className="max-w-6xl mx-auto">
				{loading ? (
					<div className="flex justify-center items-center h-64">
						<p>Loading data...</p>
					</div>
				) : error ? (
					<p className="text-red-500">{error}</p>
				) : data ? (
					<>
						<div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
							<h1 className="text-3xl font-bold">{data.name}</h1>
							{data.tvl && (
								<div className="mt-2 md:mt-0">
									<p className="text-sm text-gray-500">Total Value Locked</p>
									<p className="text-2xl font-bold">
										{formatCurrency(data.tvl)}
									</p>
								</div>
							)}
						</div>

						<div className="mb-8">
							<div className="bg-white rounded-lg shadow-sm p-4 mb-4">
								<div className="flex space-x-2 mb-4">
									<button
										type="button"
										className={`px-4 py-2 rounded-md ${activeTab === "tvl" ? "bg-green-600 text-white" : "bg-gray-200"}`}
										onClick={() => setActiveTab("tvl")}
									>
										TVL
									</button>
									<button
										type="button"
										className={`px-4 py-2 rounded-md ${activeTab === "volume" ? "bg-green-600 text-white" : "bg-gray-200"}`}
										onClick={() => setActiveTab("volume")}
									>
										Volume
									</button>
									<button
										type="button"
										className={`px-4 py-2 rounded-md ${activeTab === "fees" ? "bg-green-600 text-white" : "bg-gray-200"}`}
										onClick={() => setActiveTab("fees")}
									>
										Fees
									</button>
									<button
										type="button"
										className={`px-4 py-2 rounded-md ${activeTab === "revenue" ? "bg-green-600 text-white" : "bg-gray-200"}`}
										onClick={() => setActiveTab("revenue")}
									>
										Revenue
									</button>
								</div>

								<div className="h-80 mt-6">
									{chartData.length > 0 ? (
										<Line data={prepareChartData()} options={chartOptions} />
									) : (
										<div className="flex justify-center items-center h-full">
											<p>No chart data available</p>
										</div>
									)}
								</div>
							</div>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
							<div className="bg-white p-6 rounded-lg shadow-sm">
								<h3 className="text-xl font-bold mb-4">Information</h3>
								<p className="text-gray-700 mb-4">{data.description}</p>
								<p className="mb-2">
									<span className="font-semibold text-gray-600">Category:</span>{" "}
									{data.category}
								</p>
							</div>

							<div className="bg-white p-6 rounded-lg shadow-sm">
								<h3 className="text-xl font-bold mb-4">Performance</h3>
								<div className="grid grid-cols-3 gap-4">
									<div
										className={`p-4 rounded-lg ${data.change_1d && data.change_1d >= 0 ? "bg-green-50" : "bg-red-50"}`}
									>
										<p className="text-sm text-gray-500">24h</p>
										<p
											className={`font-bold ${data.change_1d && data.change_1d >= 0 ? "text-green-600" : "text-red-600"}`}
										>
											{data.change_1d ? `${data.change_1d.toFixed(2)}%` : "N/A"}
										</p>
									</div>
									<div
										className={`p-4 rounded-lg ${data.change_7d && data.change_7d >= 0 ? "bg-green-50" : "bg-red-50"}`}
									>
										<p className="text-sm text-gray-500">7d</p>
										<p
											className={`font-bold ${data.change_7d && data.change_7d >= 0 ? "text-green-600" : "text-red-600"}`}
										>
											{data.change_7d ? `${data.change_7d.toFixed(2)}%` : "N/A"}
										</p>
									</div>
									<div
										className={`p-4 rounded-lg ${data.change_1m && data.change_1m >= 0 ? "bg-green-50" : "bg-red-50"}`}
									>
										<p className="text-sm text-gray-500">30d</p>
										<p
											className={`font-bold ${data.change_1m && data.change_1m >= 0 ? "text-green-600" : "text-red-600"}`}
										>
											{data.change_1m ? `${data.change_1m.toFixed(2)}%` : "N/A"}
										</p>
									</div>
								</div>
							</div>
						</div>

						{data.chainTvls && Object.keys(data.chainTvls).length > 0 && (
							<div className="bg-white p-6 rounded-lg shadow-sm">
								<h3 className="text-xl font-bold mb-4">Chain Distribution</h3>
								<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
									{Object.entries(data.chainTvls).map(([chain, value]) => (
										<div key={chain} className="p-4 bg-gray-50 rounded-lg">
											<p className="font-semibold">{chain}</p>
											<p>{formatCurrency(value)}</p>
										</div>
									))}
								</div>
							</div>
						)}
					</>
				) : (
					<p>No data available</p>
				)}
			</div>
		</div>
	);
}
