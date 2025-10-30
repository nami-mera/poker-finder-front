import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const sampleTournaments = [
  {
    id: 5,
    event_id: 316169,
    event_name: "Daily Turbo 3K★",
    event_link: "https://pokerguild.jp/tourneys/316169",
    start_date: "2025-09-03",
    start_time: "13:00",
    late_time: "16:00",
    entry_fee: 3000,
    prizes_original:
      "Daily Turbo 3K★\nステータス | 待機中\n1位: 22,000 Coin\n2位: 11,000 Coin\n3位: 5,000 Coin\n4位: Tournament Ticket",
    reward_categories: '[\n  "コイン",\n  "チケット"\n]',
    reward_summary: "1st: 22000コイン, 2nd: 11000コイン, 3rd: 5000コイン, 4th: Tournament Ticket",
    shop_id: 166,
    shop_name: "GoodGame Poker Live SHIBUYA",
    shop_link: "https://pokerguild.jp/venues/166",
    official_page: "https://ggpokerlive.jp/",
    prefecture: "東京都",
    city_ward: "渋谷区",
    created_at: "2025-08-29T19:20:40",
    updated_at: "2025-08-29T19:20:40",
  },
]

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
    console.log("[v0] Attempting to fetch from backend API...")

    const { searchParams } = new URL(request.url)
    const backendParams = new URLSearchParams()

    // Map frontend parameters to backend parameters
    if (searchParams.get("key_word")) {
      backendParams.append("key_word", searchParams.get("key_word")!)
    }
    if (searchParams.get("prefecture")) {
      backendParams.append("prefecture", searchParams.get("prefecture")!)
    }
    if (searchParams.get("city_ward")) {
      backendParams.append("city_ward", searchParams.get("city_ward")!)
    }
    if (searchParams.get("shop_name")) {
      backendParams.append("shop_name", searchParams.get("shop_name")!)
    }
    if (searchParams.get("reward_categories")) {
      backendParams.append("reward_categories", searchParams.get("reward_categories")!)
    }
    if (searchParams.get("min_entry_fee")) {
      backendParams.append("min_entry_fee", searchParams.get("min_entry_fee")!)
    }
    if (searchParams.get("max_entry_fee")) {
      backendParams.append("max_entry_fee", searchParams.get("max_entry_fee")!)
    }
    if (searchParams.get("start_date")) {
      backendParams.append("start_date", searchParams.get("start_date")!)
    }
    if (searchParams.get("end_date")) {
      backendParams.append("end_date", searchParams.get("end_date")!)
    }

    console.log("[v0] Backend query parameters:", backendParams.toString())

    const backendUrl = `${BACKEND_BASE_URL}/api/tournament/query${backendParams.toString() ? "?" + backendParams.toString() : ""}`
    console.log("[v0] Backend URL:", backendUrl)

    const clientIP = getClientIP(request)
    const userAgent = request.headers.get("user-agent") || "unknown"
    const referer = request.headers.get("referer") || ""
    const acceptLanguage = request.headers.get("accept-language") || ""

    const response = await fetch(backendUrl, {
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
    })

    console.log("[v0] Backend response status:", response.status)
    console.log("[v0] Backend response headers:", Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorText = await response.text()
      console.log("[v0] Backend error response:", errorText)
      throw new Error(`HTTP error! status: ${response.status}, response: ${errorText}`)
    }

    const responseText = await response.text()
    console.log("[v0] Backend response text:", responseText.substring(0, 200) + "...")

    try {
      const data = JSON.parse(responseText)
      console.log("[v0] Successfully parsed JSON from backend")
      if (data && data.data && Array.isArray(data.data)) {
        console.log("[v0] Returning tournament data array:", data.data.length, "tournaments")
        return NextResponse.json(data.data)
      } else {
        console.log("[v0] Unexpected data structure, using sample data")
        return NextResponse.json(sampleTournaments)
      }
    } catch (parseError) {
      console.log("[v0] Failed to parse JSON, using sample data:", parseError)
      return NextResponse.json(sampleTournaments)
    }
  } catch (error) {
    console.error("[v0] Tournament API Error:", error)
    console.log("[v0] Falling back to sample tournament data")
    return NextResponse.json(sampleTournaments)
  }
}
