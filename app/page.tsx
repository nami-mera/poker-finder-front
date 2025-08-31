"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Search,
  MapPin,
  Calendar,
  Trophy,
  Pen as Yen,
  Clock,
  Store,
  ExternalLink,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Slider } from "@/components/ui/slider"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Checkbox } from "@/components/ui/checkbox"
import Link from "next/link"

interface Tournament {
  id: number
  event_id: number
  event_name: string
  event_link: string
  start_date: string
  start_time: string
  late_time: string
  entry_fee: number
  prizes_original: string
  reward_categories: string
  reward_summary: string
  shop_id: number
  shop_name: string
  shop_link: string
  official_page: string
  prefecture: string
  city_ward: string
  created_at: string
  updated_at: string
}

interface Config {
  data: {
    all_prefecture: string[]
    all_shop_name: string[]
  }
}

type SortField = "entry_fee" | "start_date" | null
type SortDirection = "asc" | "desc"

export default function TournamentsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [locationFilter, setLocationFilter] = useState("all")
  const [shopFilter, setShopFilter] = useState<string[]>([])
  const [rewardCategoriesFilter, setRewardCategoriesFilter] = useState("all")
  const [entryFeeRange, setEntryFeeRange] = useState([0, 30000])
  const [hasNoUpperLimit, setHasNoUpperLimit] = useState(false)

  const [dateRange, setDateRange] = useState([0, 7]) // 0 = today, positive = future, negative = past

  const [sortField, setSortField] = useState<SortField>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")

  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [config, setConfig] = useState<Config | null>(null)
  const [initialLoading, setInitialLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setInitialLoading(true)
      }
      setError(null)

      const today = new Date()
      const startDate = new Date(today.getTime() + dateRange[0] * 24 * 60 * 60 * 1000)
      const endDate = new Date(today.getTime() + dateRange[1] * 24 * 60 * 60 * 1000)

      const params = new URLSearchParams()
      if (searchTerm) params.append("key_word", searchTerm)
      if (locationFilter !== "all") params.append("prefecture", locationFilter)
      if (shopFilter.length > 0) params.append("shop_name", shopFilter.join(","))
      if (rewardCategoriesFilter !== "all") params.append("reward_categories", rewardCategoriesFilter)
      params.append("min_entry_fee", entryFeeRange[0].toString())
      if (!hasNoUpperLimit) {
        params.append("max_entry_fee", entryFeeRange[1].toString())
      }
      params.append("start_date", `${startDate.toISOString().split("T")[0]} 00:00:00`)
      params.append("end_date", `${endDate.toISOString().split("T")[0]} 23:59:59`)

      const [tournamentsResponse, configResponse] = await Promise.all([
        fetch(`/api/tournaments?${params.toString()}`),
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
      console.log("[v0] Tournaments data type:", typeof tournamentsData, Array.isArray(tournamentsData))
      console.log("[v0] Tournaments length:", Array.isArray(tournamentsData) ? tournamentsData.length : "not array")

      setTournaments(Array.isArray(tournamentsData) ? tournamentsData : [])
      setConfig(configData)
    } catch (err) {
      console.error("[v0] API fetch error:", err)
      setError(err instanceof Error ? err.message : "データの取得に失敗しました")
    } finally {
      if (isRefresh) {
        setRefreshing(false)
      } else {
        setInitialLoading(false)
      }
    }
  }

  useEffect(() => {
    fetchData(false)
  }, [])

  const uniquePrefectures = useMemo(() => {
    if (!config?.data?.all_prefecture) return []
    return config.data.all_prefecture.sort()
  }, [config])

  const uniqueShops = useMemo(() => {
    if (!config?.data?.all_shop_name) return []
    return config.data.all_shop_name.sort()
  }, [config])

  const uniqueRewardCategories = useMemo(() => {
    const categories = new Set<string>()
    tournaments.forEach((tournament) => {
      try {
        const rewardCats = JSON.parse(tournament.reward_categories)
        if (Array.isArray(rewardCats)) {
          rewardCats.forEach((cat) => categories.add(cat))
        }
      } catch (e) {
        if (tournament.reward_categories) {
          categories.add(tournament.reward_categories)
        }
      }
    })
    return Array.from(categories).sort()
  }, [tournaments])

  const filteredTournaments = useMemo(() => {
    console.log("[v0] Filtering tournaments:", tournaments.length, "tournaments")
    console.log("[v0] Search term:", searchTerm)
    console.log("[v0] Location filter:", locationFilter)
    console.log("[v0] Shop filter:", shopFilter)
    console.log("[v0] Reward categories filter:", rewardCategoriesFilter)
    console.log("[v0] Entry fee range:", entryFeeRange)

    const filtered = tournaments.filter((tournament) => {
      const matchesSearch =
        tournament.event_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tournament.shop_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tournament.reward_summary.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesLocation = locationFilter === "all" || tournament.prefecture === locationFilter

      const matchesShop = shopFilter.length === 0 || shopFilter.includes(tournament.shop_name)

      let matchesRewardCategories = rewardCategoriesFilter === "all"
      if (!matchesRewardCategories) {
        try {
          const rewardCats = JSON.parse(tournament.reward_categories)
          if (Array.isArray(rewardCats)) {
            matchesRewardCategories = rewardCats.includes(rewardCategoriesFilter)
          }
        } catch (e) {
          matchesRewardCategories = tournament.reward_categories === rewardCategoriesFilter
        }
      }

      const matchesEntryFee = hasNoUpperLimit
        ? tournament.entry_fee >= entryFeeRange[0]
        : tournament.entry_fee >= entryFeeRange[0] && tournament.entry_fee <= entryFeeRange[1]

      console.log("[v0] Tournament:", tournament.event_name, {
        matchesSearch,
        matchesLocation,
        matchesShop,
        matchesRewardCategories,
        matchesEntryFee,
        prefecture: tournament.prefecture,
        locationFilter,
      })

      return matchesSearch && matchesLocation && matchesShop && matchesRewardCategories && matchesEntryFee
    })

    console.log("[v0] Filtered tournaments count:", filtered.length)
    return filtered
  }, [searchTerm, locationFilter, shopFilter, rewardCategoriesFilter, entryFeeRange, hasNoUpperLimit, tournaments])

  const sortedTournaments = useMemo(() => {
    if (!sortField) return filteredTournaments

    return [...filteredTournaments].sort((a, b) => {
      let aValue: any, bValue: any

      if (sortField === "entry_fee") {
        aValue = a.entry_fee
        bValue = b.entry_fee
      } else if (sortField === "start_date") {
        aValue = new Date(a.start_date).getTime()
        bValue = new Date(b.start_date).getTime()
      }

      if (sortDirection === "asc") {
        return aValue - bValue
      } else {
        return bValue - aValue
      }
    })
  }, [filteredTournaments, sortField, sortDirection])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const handleShopToggle = (shopName: string) => {
    setShopFilter((prev) => (prev.includes(shopName) ? prev.filter((s) => s !== shopName) : [...prev, shopName]))
  }

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

  const formatDateTime = (timeString: string) => {
    const dateStr = new Date().toLocaleDateString("ja-JP", { month: "2-digit", day: "2-digit" })
    return { dateStr, timeStr: timeString }
  }

  const getLateRegTime = (lateTime: string) => {
    return lateTime
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4" />
    return sortDirection === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
  }

  const formatDateRange = () => {
    const today = new Date()
    const startDate = new Date(today.getTime() + dateRange[0] * 24 * 60 * 60 * 1000)
    const endDate = new Date(today.getTime() + dateRange[1] * 24 * 60 * 60 * 1000)

    const formatDate = (date: Date) => {
      return date.toLocaleDateString("ja-JP", { month: "2-digit", day: "2-digit" })
    }

    return `${formatDate(startDate)} - ${formatDate(endDate)}`
  }

  const getDayLabel = (dayOffset: number) => {
    if (dayOffset === 0) return "今日"
    if (dayOffset === 1) return "明日"
    if (dayOffset === -1) return "昨日"
    if (dayOffset > 0) return `${dayOffset}日後`
    return `${Math.abs(dayOffset)}日前`
  }

  if (initialLoading) {
    return (
      <div
        className="min-h-screen p-4 md:p-8 flex items-center justify-center"
        style={{
          backgroundImage: "url('/bg2.jpeg')",
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
          backgroundImage: "url('/bg2.jpeg')",
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
    <TooltipProvider>
      <div
        className="min-h-screen p-4 md:p-8"
        style={{
          backgroundImage: "url('/bg2.jpeg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="absolute inset-0 bg-black/30 -z-10" />
        <div className="max-w-7xl mx-auto space-y-6 relative">
          {/* Filters */}
          <Card className="backdrop-blur-md bg-white/10 border-white/20">
            <CardHeader>
              <CardTitle className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
                <Trophy className="h-8 w-8" />
                ポーカートーナメントを選ぶ
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex gap-2">
                  <div className="relative flex-1">
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
                  <div className="w-full lg:w-80 space-y-2">
                    <label className="text-white/80 text-sm font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      開催日: {formatDateRange()} ({getDayLabel(dateRange[0])} - {getDayLabel(dateRange[1])})
                    </label>
                    <Slider
                      value={dateRange}
                      onValueChange={setDateRange}
                      max={7}
                      min={-7}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-white/60">
                      <span>7日前</span>
                      <span>今日</span>
                      <span>7日後</span>
                    </div>
                  </div>

                  <div className="w-full lg:w-80 space-y-2">
                    <label className="text-white/80 text-sm font-medium flex items-center gap-2">
                      <Yen className="h-4 w-4" />
                      参加費: {formatCurrency(entryFeeRange[0])} -{" "}
                      {hasNoUpperLimit ? "上限なし" : formatCurrency(entryFeeRange[1])}
                    </label>
                    <Slider
                      value={entryFeeRange}
                      onValueChange={setEntryFeeRange}
                      max={30000}
                      min={0}
                      step={1000}
                      className="w-full"
                      disabled={hasNoUpperLimit}
                    />
                    <div className="flex items-center space-x-2">
                      <Checkbox id="no-upper-limit" checked={hasNoUpperLimit} onCheckedChange={setHasNoUpperLimit} />
                      <label htmlFor="no-upper-limit" className="text-white/80 text-sm">
                        上限なし
                      </label>
                    </div>
                  </div>

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

                    <div className="w-full sm:w-48">
                      <Select>
                        <SelectTrigger className="bg-white/10 border-white/20 text-white">
                          <SelectValue
                            placeholder={shopFilter.length === 0 ? "店舗名" : `${shopFilter.length}店舗選択中`}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {uniqueShops.map((shop) => (
                            <div key={shop} className="flex items-center space-x-2 px-2 py-1 hover:bg-gray-100">
                              <Checkbox
                                id={`shop-${shop}`}
                                checked={shopFilter.includes(shop)}
                                onCheckedChange={() => handleShopToggle(shop)}
                              />
                              <label htmlFor={`shop-${shop}`} className="text-sm cursor-pointer flex-1">
                                {shop}
                              </label>
                            </div>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Select value={rewardCategoriesFilter} onValueChange={setRewardCategoriesFilter}>
                      <SelectTrigger className="w-full sm:w-48 bg-white/10 border-white/20 text-white">
                        <SelectValue placeholder="賞品カテゴリ" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">全てのカテゴリ</SelectItem>
                        {uniqueRewardCategories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <button
                    onClick={() => fetchData(true)}
                    disabled={refreshing}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white rounded-md transition-colors flex items-center gap-2 whitespace-nowrap"
                  >
                    {refreshing ? "更新中..." : "データ更新"}
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <Card className="backdrop-blur-md bg-white/10 border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <span>検索結果 ({sortedTournaments.length}件)</span>
                <div className="flex items-center gap-2">
                  {refreshing && <div className="text-sm text-white/60">更新中...</div>}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`overflow-x-auto transition-opacity duration-200 ${refreshing ? "opacity-60" : "opacity-100"}`}
              >
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/20">
                      <TableHead className="text-white/80 w-64">トーナメント名</TableHead>
                      <TableHead
                        className="text-white/80 cursor-pointer hover:text-white transition-colors"
                        onClick={() => handleSort("entry_fee")}
                      >
                        <div className="flex items-center gap-1">
                          参加費
                          {getSortIcon("entry_fee")}
                        </div>
                      </TableHead>
                      <TableHead className="text-white/80 w-64">賞金詳細</TableHead>
                      <TableHead
                        className="text-white/80 cursor-pointer hover:text-white transition-colors"
                        onClick={() => handleSort("start_date")}
                      >
                        <div className="flex items-center gap-1">
                          開催日
                          {getSortIcon("start_date")}
                        </div>
                      </TableHead>
                      <TableHead className="text-white/80">開始時間</TableHead>
                      <TableHead className="text-white/80">店舗・開催地</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedTournaments.map((tournament) => {
                      const { dateStr, timeStr } = formatDateTime(tournament.start_time)
                      const lateRegTime = getLateRegTime(tournament.late_time)

                      return (
                        <TableRow key={tournament.id} className="border-white/20 hover:bg-white/5">
                          <TableCell className="text-white font-medium w-64">
                            <Link
                              href={tournament.event_link || `/tournament/${tournament.id}`}
                              className="hover:text-blue-300 hover:underline transition-colors flex items-center gap-1 break-words"
                            >
                              <span className="break-words">{tournament.event_name}</span>
                              <ExternalLink className="h-3 w-3 flex-shrink-0" />
                            </Link>
                          </TableCell>
                          <TableCell className="text-white/80 font-semibold">
                            {formatCurrency(tournament.entry_fee)}
                          </TableCell>
                          <TableCell className="text-white/80 w-64">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="break-words whitespace-normal cursor-help">
                                  {tournament.reward_summary}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-md p-4 bg-gray-900 text-white border border-gray-700">
                                <div className="whitespace-pre-wrap text-sm">
                                  {tournament.prizes_original.replace(/\\n/g, "\n")}
                                </div>
                              </TooltipContent>
                            </Tooltip>
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
                                  href={
                                    tournament.shop_link ||
                                    tournament.official_page ||
                                    `/shop/${encodeURIComponent(tournament.shop_name)}`
                                  }
                                  className="hover:text-blue-300 hover:underline transition-colors break-words"
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

              {sortedTournaments.length === 0 && (
                <div className="text-center py-8 text-white/60">
                  検索条件に一致するトーナメントが見つかりませんでした
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </TooltipProvider>
  )
}
