import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

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
const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL || "https://api.eriri.cc"

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for")
  const realIP = request.headers.get("x-real-ip")
  const cfConnectingIP = request.headers.get("cf-connecting-ip")

  if (forwarded) {
    return forwarded.split(",")[0].trim()
  }
  if (realIP) {
    return realIP
  }
  if (cfConnectingIP) {
    return cfConnectingIP
  }

  return request.ip || "unknown"
}

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] Attempting to fetch config from backend API...")

    const clientIP = getClientIP(request)
    const userAgent = request.headers.get("user-agent") || "unknown"
    const referer = request.headers.get("referer") || ""
    const acceptLanguage = request.headers.get("accept-language") || ""

    const response = await fetch(`${BACKEND_BASE_URL}/api/tournament/config`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": userAgent,
        Connection: "keep-alive",
        "X-Client-IP": clientIP,
        "X-Original-User-Agent": userAgent,
        "X-Client-Referer": referer,
        "X-Client-Accept-Language": acceptLanguage,
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
