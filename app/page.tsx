"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, Filter, MapPin, Calendar, Trophy, Pen as Yen, Clock, Store, ExternalLink } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Slider } from "@/components/ui/slider"
import Link from "next/link"

interface Tournament {
  id: number
  event_id: number
  event_name: string
  event_link: string
  status: string
  shop_id: number
  shop_name: string
  official_page: string
  start_time: string
  game_rule: string
  entry_fee: number
  re_entry: string
  prizes: string
  prizes_original: string
  address: string
  prefecture: string
  city_ward: string
  tel: string
  total_winners: number
  total_value_jpy: number
  reward_categories: string
  rank_list: string
  reward_summary: string
  created_at: string
  updated_at: string
}

interface Config {
  data: {
    all_city_ward: string[]
    all_prefecture: string[]
  }
}

export default function TournamentsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [locationFilter, setLocationFilter] = useState("all")
  const [shopFilter, setShopFilter] = useState("all")
  const [entryFeeRange, setEntryFeeRange] = useState([0, 100000])

  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [config, setConfig] = useState<Config | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch tournaments and config data in parallel
        const [tournamentsResponse, configResponse] = await Promise.all([
          fetch("/api/tournaments"),
          fetch("/api/tournaments/config"),
        ])

        if (!tournamentsResponse.ok) {
          throw new Error(`Tournament API error: ${tournamentsResponse.status}`)
        }

        if (!configResponse.ok) {
          throw new Error(`Config API error: ${configResponse.status}`)
        }

        const tournamentsData = await tournamentsResponse.json()
        const configData = await configResponse.json()

        console.log("[v0] Tournaments data:", tournamentsData)
        console.log("[v0] Config data:", configData)

        setTournaments(Array.isArray(tournamentsData) ? tournamentsData : [])
        setConfig(configData)
      } catch (err) {
        console.error("[v0] API fetch error:", err)
        setError(err instanceof Error ? err.message : "データの取得に失敗しました")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const uniquePrefectures = useMemo(() => {
    if (!config?.data?.all_prefecture) return []
    return config.data.all_prefecture.sort()
  }, [config])

  const uniqueShops = useMemo(() => {
    const shops = [...new Set(tournaments.map((t) => t.shop_name))]
    return shops.sort()
  }, [tournaments])

  const filteredTournaments = useMemo(() => {
    return tournaments.filter((tournament) => {
      const matchesSearch =
        tournament.event_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tournament.shop_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tournament.prizes.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesLocation = locationFilter === "all" || tournament.prefecture === locationFilter

      const matchesShop = shopFilter === "all" || tournament.shop_name === shopFilter

      const matchesEntryFee = tournament.entry_fee >= entryFeeRange[0] && tournament.entry_fee <= entryFeeRange[1]

      return matchesSearch && matchesLocation && matchesShop && matchesEntryFee
    })
  }, [searchTerm, locationFilter, shopFilter, entryFeeRange, tournaments])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ja-JP", {
      style: "currency",
      currency: "JPY",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getGoogleMapsUrl = (prefecture: string, cityWard: string, shopName: string) => {
    const query = encodeURIComponent(`${prefecture} ${cityWard} ${shopName}`)
    return `https://www.google.com/maps/search/?api=1&query=${query}`
  }

  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString)
    const dateStr = `${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}`
    const timeStr = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`
    return { dateStr, timeStr }
  }

  const getLateRegTime = (startTime: string) => {
    const date = new Date(startTime)
    date.setHours(date.getHours() + 2)
    return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`
  }

  if (loading) {
    return (
      <div
        className="min-h-screen p-4 md:p-8 flex items-center justify-center"
        style={{
          backgroundImage: "url('/bg.jpeg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="absolute inset-0 bg-black/30 -z-10" />
        <Card className="backdrop-blur-md bg-white/10 border-white/20">
          <CardContent className="p-8 text-center">
            <div className="text-white text-lg">トーナメントデータを読み込み中...</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div
        className="min-h-screen p-4 md:p-8 flex items-center justify-center"
        style={{
          backgroundImage: "url('/bg.jpeg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="absolute inset-0 bg-black/30 -z-10" />
        <Card className="backdrop-blur-md bg-white/10 border-white/20">
          <CardContent className="p-8 text-center">
            <div className="text-red-300 text-lg mb-4">エラーが発生しました</div>
            <div className="text-white/80 mb-4">{error}</div>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              再試行
            </button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen p-4 md:p-8"
      style={{
        backgroundImage: "url('/bg.jpeg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="absolute inset-0 bg-black/30 -z-10" />
      <div className="max-w-7xl mx-auto space-y-6 relative">
        {/* Header */}
        <Card className="backdrop-blur-md bg-white/10 border-white/20">
          <CardHeader>
            <CardTitle className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
              <Trophy className="h-8 w-8" />
              日本ポーカートーナメント検索
            </CardTitle>
            <p className="text-white/80">日本全国のポーカートーナメント情報を検索・フィルタリングできます</p>
          </CardHeader>
        </Card>

        {/* Filters */}
        <Card className="backdrop-blur-md bg-white/10 border-white/20">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="w-full">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 h-4 w-4" />
                  <Input
                    placeholder="トーナメント名、店舗名、賞金詳細で検索..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/60"
                  />
                </div>
              </div>

              <div className="flex flex-col lg:flex-row gap-4 items-end">
                <div className="flex flex-col sm:flex-row gap-4 flex-1">
                  <Select value={locationFilter} onValueChange={setLocationFilter}>
                    <SelectTrigger className="w-full sm:w-48 bg-white/10 border-white/20 text-white">
                      <SelectValue placeholder="都道府県" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全ての都道府県</SelectItem>
                      {uniquePrefectures.map((prefecture) => (
                        <SelectItem key={prefecture} value={prefecture}>
                          {prefecture}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={shopFilter} onValueChange={setShopFilter}>
                    <SelectTrigger className="w-full sm:w-48 bg-white/10 border-white/20 text-white">
                      <SelectValue placeholder="店舗名" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全ての店舗</SelectItem>
                      {uniqueShops.map((shop) => (
                        <SelectItem key={shop} value={shop}>
                          {shop}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-full lg:w-80 space-y-2">
                  <label className="text-white/80 text-sm font-medium flex items-center gap-2">
                    <Yen className="h-4 w-4" />
                    参加費: {formatCurrency(entryFeeRange[0])} - {formatCurrency(entryFeeRange[1])}
                  </label>
                  <Slider
                    value={entryFeeRange}
                    onValueChange={setEntryFeeRange}
                    max={100000}
                    min={0}
                    step={5000}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card className="backdrop-blur-md bg-white/10 border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              <span>検索結果 ({filteredTournaments.length}件)</span>
              <Filter className="h-5 w-5" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/20">
                    <TableHead className="text-white/80">トーナメント名</TableHead>
                    <TableHead className="text-white/80">参加費</TableHead>
                    <TableHead className="text-white/80">賞金詳細</TableHead>
                    <TableHead className="text-white/80">開催日</TableHead>
                    <TableHead className="text-white/80">開始時間</TableHead>
                    <TableHead className="text-white/80">店舗・開催地</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTournaments.map((tournament) => {
                    const { dateStr, timeStr } = formatDateTime(tournament.start_time)
                    const lateRegTime = getLateRegTime(tournament.start_time)

                    return (
                      <TableRow key={tournament.id} className="border-white/20 hover:bg-white/5">
                        <TableCell className="text-white font-medium">
                          <Link
                            href={tournament.event_link || `/tournament/${tournament.id}`}
                            className="hover:text-blue-300 hover:underline transition-colors flex items-center gap-1"
                          >
                            {tournament.event_name}
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        </TableCell>
                        <TableCell className="text-white/80 font-semibold">
                          {formatCurrency(tournament.entry_fee)}
                        </TableCell>
                        <TableCell className="text-white/80 max-w-xs">
                          <div className="truncate" title={tournament.prizes}>
                            {tournament.prizes.replace(/\n/g, ", ")}
                          </div>
                        </TableCell>
                        <TableCell className="text-white/80">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {dateStr}
                          </div>
                        </TableCell>
                        <TableCell className="text-white/80">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {timeStr}
                            </div>
                            <div className="text-xs text-white/60 pl-5">遅刻登録: {lateRegTime}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-white/80">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1">
                              <Store className="h-4 w-4" />
                              <Link
                                href={tournament.official_page || `/shop/${encodeURIComponent(tournament.shop_name)}`}
                                className="hover:text-blue-300 hover:underline transition-colors"
                              >
                                {tournament.shop_name}
                              </Link>
                            </div>
                            <div className="text-xs text-white/60 pl-5">
                              <a
                                href={getGoogleMapsUrl(
                                  tournament.prefecture,
                                  tournament.city_ward,
                                  tournament.shop_name,
                                )}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-blue-300 hover:underline transition-colors flex items-center gap-1"
                              >
                                <MapPin className="h-3 w-3" />
                                {tournament.prefecture}, {tournament.city_ward}
                                <ExternalLink className="h-2 w-2" />
                              </a>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>

            {filteredTournaments.length === 0 && (
              <div className="text-center py-8 text-white/60">検索条件に一致するトーナメントが見つかりませんでした</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
