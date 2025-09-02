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

type SortField = "entry_fee" | "start_date" | "shop_name" | null
type SortDirection = "asc" | "desc"

export default function TournamentsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [locationFilter, setLocationFilter] = useState("all")
  const [shopFilter, setShopFilter] = useState<string[]>([])
  const [rewardCategoriesFilter, setRewardCategoriesFilter] = useState<string[]>([])
  const [entryFeeRange, setEntryFeeRange] = useState([0, 30000])
  const [hasNoUpperLimit, setHasNoUpperLimit] = useState(false)

  const today = new Date().toISOString().split("T")[0]
  const sevenDaysLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  const [startDate, setStartDate] = useState(today)
  const [endDate, setEndDate] = useState(sevenDaysLater)

  const [sortField, setSortField] = useState<SortField>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20

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

      const params = new URLSearchParams()
      if (searchTerm) params.append("key_word", searchTerm)
      if (locationFilter !== "all") params.append("prefecture", locationFilter)
      if (shopFilter.length > 0) params.append("shop_name", shopFilter.join(","))
      if (rewardCategoriesFilter.length > 0) params.append("reward_categories", rewardCategoriesFilter.join(","))
      params.append("min_entry_fee", entryFeeRange[0].toString())
      if (!hasNoUpperLimit) {
        params.append("max_entry_fee", entryFeeRange[1].toString())
      }
      params.append("start_date", `${startDate} 00:00:00`)
      params.append("end_date", `${endDate} 23:59:59`)

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
      setCurrentPage(1)
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

      let matchesRewardCategories = rewardCategoriesFilter.length === 0
      if (!matchesRewardCategories) {
        try {
          const rewardCats = JSON.parse(tournament.reward_categories)
          if (Array.isArray(rewardCats)) {
            matchesRewardCategories = rewardCategoriesFilter.some((filter) => rewardCats.includes(filter))
          }
        } catch (e) {
          matchesRewardCategories = rewardCategoriesFilter.includes(tournament.reward_categories)
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
      } else if (sortField === "shop_name") {
        aValue = a.shop_name.toLowerCase()
        bValue = b.shop_name.toLowerCase()
        if (sortDirection === "asc") {
          return aValue.localeCompare(bValue)
        } else {
          return bValue.localeCompare(aValue)
        }
      }

      if (sortDirection === "asc") {
        return aValue - bValue
      } else {
        return bValue - aValue
      }
    })
  }, [filteredTournaments, sortField, sortDirection])

  const paginatedTournaments = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return sortedTournaments.slice(startIndex, endIndex)
  }, [sortedTournaments, currentPage, itemsPerPage])

  const totalPages = Math.ceil(sortedTournaments.length / itemsPerPage)

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
    setCurrentPage(1)
  }

  const handleShopToggle = (shopName: string) => {
    setShopFilter((prev) => (prev.includes(shopName) ? prev.filter((s) => s !== shopName) : [...prev, shopName]))
    setCurrentPage(1)
  }

  const handleRewardCategoryToggle = (category: string) => {
    setRewardCategoriesFilter((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category],
    )
    setCurrentPage(1)
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
    const startDate = new Date(today.getTime() + 0 * 24 * 60 * 60 * 1000)
    const endDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)

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

  const formatRewardSummary = (rewardSummary: string) => {
    return rewardSummary
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
  }

  if (initialLoading) {
    return (
      <div
        className="min-h-screen p-4 md:p-8 flex items-center justify-center fixed inset-0"
        style={{
          backgroundImage: "url('/bg.jpeg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundAttachment: "fixed",
        }}
      >
        <div className="absolute inset-0 bg-black/30" />
        <Card className="backdrop-blur-md bg-white/10 border-white/20 relative z-10">
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
        className="min-h-screen p-4 md:p-8 flex items-center justify-center fixed inset-0"
        style={{
          backgroundImage: "url('/bg.jpeg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundAttachment: "fixed",
        }}
      >
        <div className="absolute inset-0 bg-black/30" />
        <Card className="backdrop-blur-md bg-white/10 border-white/20 relative z-10">
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
      className="min-h-screen p-4 md:p-8 fixed inset-0 overflow-auto"
      style={{
        backgroundImage: "url('/bg.jpeg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="absolute inset-0 bg-black/30" />
      <div className="w-full space-y-6 relative z-10">
        {/* Filters */}
        <Card className="backdrop-blur-md bg-white/10 border-white/20">
          <CardHeader>
            <CardTitle className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
              <Trophy className="h-8 w-8" />
              ポーカートーナメントを選ぶ
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-white/80 text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    開催日（開始）
                  </label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-white/10 border-white/20 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-white/80 text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    開催日（終了）
                  </label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-white/10 border-white/20 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-white/80 text-sm font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    都道府県
                  </label>
                  <Select value={locationFilter} onValueChange={setLocationFilter}>
                    <SelectTrigger className="w-full bg-white/10 border-white/20 text-white">
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
                </div>

                <div className="space-y-2">
                  <label className="text-white/80 text-sm font-medium flex items-center gap-2">
                    <Store className="h-4 w-4" />
                    店舗名
                  </label>
                  <Select>
                    <SelectTrigger className="w-full bg-white/10 border-white/20 text-white">
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                <div className="lg:col-span-2 space-y-2">
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

                <div className="space-y-2">
                  <label className="text-white/80 text-sm font-medium flex items-center gap-2">
                    <Trophy className="h-4 w-4" />
                    賞品カテゴリ
                  </label>
                  <Select>
                    <SelectTrigger className="w-full bg-white/10 border-white/20 text-white">
                      <SelectValue
                        placeholder={
                          rewardCategoriesFilter.length === 0
                            ? "賞品カテゴリ"
                            : `${rewardCategoriesFilter.length}カテゴリ選択中`
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {uniqueRewardCategories.map((category) => (
                        <div key={category} className="flex items-center space-x-2 px-2 py-1 hover:bg-gray-100">
                          <Checkbox
                            id={`category-${category}`}
                            checked={rewardCategoriesFilter.includes(category)}
                            onCheckedChange={() => handleRewardCategoryToggle(category)}
                          />
                          <label htmlFor={`category-${category}`} className="text-sm cursor-pointer flex-1">
                            {category}
                          </label>
                        </div>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-white/80 text-sm font-medium flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    キーワード検索
                  </label>
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
                    <button
                      onClick={() => fetchData(true)}
                      disabled={refreshing}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white rounded-md transition-colors flex items-center gap-2 whitespace-nowrap"
                    >
                      {refreshing ? "更新中..." : "データ更新"}
                    </button>
                  </div>
                </div>
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
                    <TableHead
                      className="text-white/80 cursor-pointer hover:text-white transition-colors w-44"
                      onClick={() => handleSort("shop_name")}
                    >
                      <div className="flex items-center gap-1">
                        店舗・開催地
                        {getSortIcon("shop_name")}
                      </div>
                    </TableHead>
                    <TableHead className="text-white/80 w-50">トーナメント名</TableHead>
                    <TableHead
                      className="text-white/80 cursor-pointer hover:text-white transition-colors min-w-[100px]"
                      onClick={() => handleSort("entry_fee")}
                    >
                      <div className="flex items-center gap-1">
                        参加費
                        {getSortIcon("entry_fee")}
                      </div>
                    </TableHead>
                    <TableHead className="text-white/80 w-50">賞金詳細</TableHead>
                    <TableHead
                      className="text-white/80 cursor-pointer hover:text-white transition-colors min-w-[100px]"
                      onClick={() => handleSort("start_date")}
                    >
                      <div className="flex items-center gap-1">
                        開催日
                        {getSortIcon("start_date")}
                      </div>
                    </TableHead>
                    <TableHead className="text-white/80 min-w-[120px]">開始時間</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedTournaments.map((tournament) => {
                    const { dateStr, timeStr } = formatDateTime(tournament.start_time)
                    const lateRegTime = getLateRegTime(tournament.late_time)

                    return (
                      <TableRow key={tournament.id} className="border-white/20 hover:bg-white/5">
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
                                target="_blank"
                                rel="noopener noreferrer"
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
                        <TableCell className="text-white w-32 font-medium">
                          <Link
                            href={tournament.event_link || `/tournament/${tournament.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-blue-300 hover:underline transition-colors flex items-center gap-1"
                          >
                            <span className="break-words whitespace-normal leading-tight">{tournament.event_name}</span>
                            <ExternalLink className="h-3 w-3 flex-shrink-0" />
                          </Link>
                        </TableCell>
                        <TableCell className="text-white/80 font-semibold">
                          {formatCurrency(tournament.entry_fee)}
                        </TableCell>
                        <TableCell className="text-white/80 w-60">
                          <div className="flex flex-col gap-1">
                            {formatRewardSummary(tournament.reward_summary).map((item, index) => (
                              <span key={index} className="bg-white/10 px-2 py-1 rounded text-xs">
                                {item}
                              </span>
                            ))}
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
                            <div className="text-xs text-white/60 pl-5">受付締切: {lateRegTime}</div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>

            {sortedTournaments.length === 0 && (
              <div className="text-center py-8 text-white/60">検索条件に一致するトーナメントが見つかりませんでした</div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/20">
                <div className="text-white/60 text-sm">
                  {sortedTournaments.length}件中 {(currentPage - 1) * itemsPerPage + 1}-
                  {Math.min(currentPage * itemsPerPage, sortedTournaments.length)}件を表示
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 bg-white/10 text-white rounded hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    前へ
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum
                      if (totalPages <= 5) {
                        pageNum = i + 1
                      } else if (currentPage <= 3) {
                        pageNum = i + 1
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i
                      } else {
                        pageNum = currentPage - 2 + i
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-1 rounded transition-colors ${
                            currentPage === pageNum
                              ? "bg-blue-600 text-white"
                              : "bg-white/10 text-white hover:bg-white/20"
                          }`}
                        >
                          {pageNum}
                        </button>
                      )
                    })}
                  </div>
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 bg-white/10 text-white rounded hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    次へ
                  </button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
