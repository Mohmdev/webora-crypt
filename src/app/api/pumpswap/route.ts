import { NextResponse } from "next/server";

export async function GET() {
	try {
		// Fetch basic protocol data
		const response = await fetch("https://api.llama.fi/protocol/pumpswap", {
			headers: {
				accept: "*/*",
			},
			cache: "no-store",
		});

		if (!response.ok) {
			throw new Error(`Failed to fetch data: ${response.status}`);
		}

		const data = await response.json();

		return NextResponse.json(data);
	} catch (error) {
		console.error("Error fetching DefiLlama data:", error);
		return NextResponse.json(
			{ error: "Failed to fetch data from DefiLlama" },
			{ status: 500 },
		);
	}
}
