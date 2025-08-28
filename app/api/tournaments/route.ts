import { NextResponse } from "next/server"

const sampleTournaments = [
  {
    id: 1,
    event_id: 101,
    event_name: "Weekly No-Limit Hold'em",
    event_link: "https://pokerstarscafe.jp/tournaments/101",
    status: "upcoming",
    shop_id: 1,
    shop_name: "PokerStars Cafe",
    official_page: "https://pokerstarscafe.jp/tournaments",
    start_time: "2024-07-10 19:00:00",
    game_rule: "No-Limit Hold'em",
    entry_fee: 5000,
    re_entry: "Allowed once",
    prizes: "1st: 30000 JPY + Ticket\n2nd: 15000 JPY\n3rd: 10000 JPY + Ticket",
    prizes_original: "1st: 30000 JPY + Ticket\n2nd: 15000 JPY\n3rd: 10000 JPY + Ticket",
    address: "東京都渋谷区宇田川町33-8 塚田ビルB1F",
    prefecture: "东京都",
    city_ward: "港区",
    tel: "03-1234-5678",
    total_winners: 3,
    total_value_jpy: 55000,
    reward_categories: "Cash,Tickets",
    rank_list:
      '[{"rank":"1st","reward_summary":"30000 JPY + Ticket","reward_value_jpy":30000},{"rank":"2nd","reward_summary":"15000 JPY","reward_value_jpy":15000},{"rank":"3rd","reward_summary":"10000 JPY + Ticket","reward_value_jpy":10000}]',
    reward_summary: "",
    created_at: "2025-08-28T13:27:28",
    updated_at: "2025-08-28T13:29:15",
  },
  {
    id: 2,
    event_id: 102,
    event_name: "Friday Night Tournament",
    event_link: "https://pokerstarscafe.jp/tournaments/102",
    status: "upcoming",
    shop_id: 1,
    shop_name: "PokerStars Cafe",
    official_page: "https://pokerstarscafe.jp/tournaments",
    start_time: "2024-07-12 20:00:00",
    game_rule: "No-Limit Hold'em",
    entry_fee: 8000,
    re_entry: "Allowed twice",
    prizes: "1st: 50000 JPY\n2nd: 25000 JPY\n3rd: 15000 JPY",
    prizes_original: "1st: 50000 JPY\n2nd: 25000 JPY\n3rd: 15000 JPY",
    address: "東京都渋谷区宇田川町33-8 塚田ビルB1F",
    prefecture: "东京都",
    city_ward: "港区",
    tel: "03-1234-5678",
    total_winners: 3,
    total_value_jpy: 90000,
    reward_categories: "Cash",
    rank_list:
      '[{"rank":"1st","reward_summary":"50000 JPY","reward_value_jpy":50000},{"rank":"2nd","reward_summary":"25000 JPY","reward_value_jpy":25000},{"rank":"3rd","reward_summary":"15000 JPY","reward_value_jpy":15000}]',
    reward_summary: "",
    created_at: "2025-08-28T13:27:28",
    updated_at: "2025-08-28T13:29:15",
  },
]

export async function GET() {
  try {
    console.log("[v0] Attempting to fetch from backend API...")

    const response = await fetch("http://13.231.184.250:5000/api/tournament/query", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
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
