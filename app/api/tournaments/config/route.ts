import { NextResponse } from "next/server"

const sampleConfig = {
  data: {
    all_city_ward: ["港区"],
    all_prefecture: ["東京都"],
    all_shop_name: [
      "BARRLE IKEBUKURO",
      "GoodGame Poker Live SHIBUYA",
      "ResPo",
      "UNIVERSE",
      "ガットショット 上野池之端店",
    ],
  },
}
const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL || "https://api.eriri.cc";


export async function GET() {
  try {
    console.log("[v0] Attempting to fetch config from backend API...")

    const response = await fetch(`${BACKEND_BASE_URL}/api/tournament/config`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0 (compatible; v0-app/1.0)",
        Connection: "keep-alive",
      },
      cache: "no-store",
    })

    console.log("[v0] Config backend response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.log("[v0] Config backend error response:", errorText)
      throw new Error(`HTTP error! status: ${response.status}, response: ${errorText}`)
    }

    const responseText = await response.text()
    console.log("[v0] Config backend response text:", responseText)

    try {
      const data = JSON.parse(responseText)
      console.log("[v0] Successfully parsed config JSON from backend")
      return NextResponse.json(data)
    } catch (parseError) {
      console.log("[v0] Failed to parse config JSON, using sample data:", parseError)
      return NextResponse.json(sampleConfig)
    }
  } catch (error) {
    console.error("[v0] Config API Error:", error)
    console.log("[v0] Falling back to sample config data")
    return NextResponse.json(sampleConfig)
  }
}
