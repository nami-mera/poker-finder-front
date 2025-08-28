"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, Filter, MapPin, Calendar, Trophy, Pen as Yen, Clock, Store, ExternalLink } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Slider } from "@/components/ui/slider"
import Link from "next/link"

interface Tournament {
  id: string
  name: string
  date: string
  startTime: string
  lateRegTime: string
  shopName: string
  prefecture: string
  ward: string
  entryFee: number
  prizeDescription: string
  status: "upcoming" | "ongoing" | "completed"
  participants: number
  maxParticipants: number
}

const mockTournaments: Tournament[] = [
  {
    id: "1",
    name: "Tokyo Championship Series",
    date: "02/15",
    startTime: "19:00",
    lateRegTime: "21:30",
    shopName: "ポーカースタジアム渋谷",
    prefecture: "東京都",
    ward: "渋谷区",
    entryFee: 50000,
    prizeDescription: "優勝200万円、2位80万円、3位40万円",
    status: "upcoming",
    participants: 156,
    maxParticipants: 200,
  },
  {
    id: "2",
    name: "Osaka Poker Masters",
    date: "02/20",
    startTime: "18:30",
    lateRegTime: "20:45",
    shopName: "梅田ポーカーハウス",
    prefecture: "大阪府",
    ward: "北区",
    entryFee: 30000,
    prizeDescription: "優勝150万円、2位60万円、3位30万円",
    status: "upcoming",
    participants: 89,
    maxParticipants: 150,
  },
  {
    id: "3",
    name: "Kyoto Spring Festival",
    date: "03/01",
    startTime: "17:00",
    lateRegTime: "19:00",
    shopName: "四条ポーカークラブ",
    prefecture: "京都府",
    ward: "中京区",
    entryFee: 25000,
    prizeDescription: "優勝100万円、2位40万円、3位20万円",
    status: "upcoming",
    participants: 67,
    maxParticipants: 120,
  },
  {
    id: "4",
    name: "Nagoya High Roller",
    date: "02/25",
    startTime: "20:00",
    lateRegTime: "22:30",
    shopName: "栄ポーカーアリーナ",
    prefecture: "愛知県",
    ward: "中区",
    entryFee: 100000,
    prizeDescription: "優勝500万円、2位200万円、3位100万円",
    status: "upcoming",
    participants: 34,
    maxParticipants: 80,
  },
  {
    id: "5",
    name: "Fukuoka Weekly Tournament",
    date: "02/18",
    startTime: "19:30",
    lateRegTime: "21:00",
    shopName: "天神ポーカーラウンジ",
    prefecture: "福岡県",
    ward: "中央区",
    entryFee: 15000,
    prizeDescription: "優勝60万円、2位24万円、3位12万円",
    status: "ongoing",
    participants: 45,
    maxParticipants: 60,
  },
  {
    id: "6",
    name: "Sapporo Winter Series",
    date: "01/30",
    startTime: "18:00",
    lateRegTime: "20:30",
    shopName: "すすきのポーカーホール",
    prefecture: "北海道",
    ward: "中央区",
    entryFee: 40000,
    prizeDescription: "優勝180万円、2位72万円、3位36万円",
    status: "completed",
    participants: 120,
    maxParticipants: 120,
  },
]

export default function TournamentsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [locationFilter, setLocationFilter] = useState("all")
  const [shopFilter, setShopFilter] = useState("all")
  const [entryFeeRange, setEntryFeeRange] = useState([0, 100000])

  const uniquePrefectures = useMemo(() => {
    const prefectures = [...new Set(mockTournaments.map((t) => t.prefecture))]
    return prefectures.sort()
  }, [])

  const uniqueShops = useMemo(() => {
    const shops = [...new Set(mockTournaments.map((t) => t.shopName))]
    return shops.sort()
  }, [])

  const filteredTournaments = useMemo(() => {
    return mockTournaments.filter((tournament) => {
      const matchesSearch =
        tournament.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tournament.shopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tournament.prizeDescription.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesLocation = locationFilter === "all" || tournament.prefecture === locationFilter

      const matchesShop = shopFilter === "all" || tournament.shopName === shopFilter

      const matchesEntryFee = tournament.entryFee >= entryFeeRange[0] && tournament.entryFee <= entryFeeRange[1]

      return matchesSearch && matchesLocation && matchesShop && matchesEntryFee
    })
  }, [searchTerm, locationFilter, shopFilter, entryFeeRange])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ja-JP", {
      style: "currency",
      currency: "JPY",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getGoogleMapsUrl = (prefecture: string, ward: string, shopName: string) => {
    const query = encodeURIComponent(`${prefecture} ${ward} ${shopName}`)
    return `https://www.google.com/maps/search/?api=1&query=${query}`
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
                  {filteredTournaments.map((tournament) => (
                    <TableRow key={tournament.id} className="border-white/20 hover:bg-white/5">
                      <TableCell className="text-white font-medium">
                        <Link
                          href={`/tournament/${tournament.id}`}
                          className="hover:text-blue-300 hover:underline transition-colors flex items-center gap-1"
                        >
                          {tournament.name}
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </TableCell>
                      <TableCell className="text-white/80 font-semibold">
                        {formatCurrency(tournament.entryFee)}
                      </TableCell>
                      <TableCell className="text-white/80 max-w-xs">
                        <div className="truncate" title={tournament.prizeDescription}>
                          {tournament.prizeDescription}
                        </div>
                      </TableCell>
                      <TableCell className="text-white/80">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {tournament.date}
                        </div>
                      </TableCell>
                      <TableCell className="text-white/80">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {tournament.startTime}
                          </div>
                          <div className="text-xs text-white/60 pl-5">遅刻登録: {tournament.lateRegTime}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-white/80">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <Store className="h-4 w-4" />
                            <Link
                              href={`/shop/${encodeURIComponent(tournament.shopName)}`}
                              className="hover:text-blue-300 hover:underline transition-colors"
                            >
                              {tournament.shopName}
                            </Link>
                          </div>
                          <div className="text-xs text-white/60 pl-5">
                            <a
                              href={getGoogleMapsUrl(tournament.prefecture, tournament.ward, tournament.shopName)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-blue-300 hover:underline transition-colors flex items-center gap-1"
                            >
                              <MapPin className="h-3 w-3" />
                              {tournament.prefecture}, {tournament.ward}
                              <ExternalLink className="h-2 w-2" />
                            </a>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
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
