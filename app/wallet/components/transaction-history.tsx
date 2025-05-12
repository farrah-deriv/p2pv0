"use client"

import { useEffect, useState } from "react"
import { getTransactionHistory } from "../api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowDownCircle, ArrowUpCircle, RefreshCw, Repeat } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

interface Transaction {
  id: string
  type: "deposit" | "withdrawal" | "trade"
  amount: number
  currency: string
  status: "completed" | "pending" | "failed"
  date: string
  description: string
}

export default function TransactionHistory() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchTransactions = async () => {
      setIsLoading(true)
      try {
        const data = await getTransactionHistory()
        setTransactions(data)
      } catch (error) {
        console.error("Failed to fetch transaction history:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTransactions()
  }, [])

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date)
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "deposit":
        return <ArrowDownCircle className="h-5 w-5 text-green-500" />
      case "withdrawal":
        return <ArrowUpCircle className="h-5 w-5 text-red-500" />
      case "trade":
        return <Repeat className="h-5 w-5 text-blue-500" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completed</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>
      case "failed":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Failed</Badge>
      default:
        return null
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl font-bold">Transaction History</CardTitle>
        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Refresh transactions">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
                <Skeleton className="h-6 w-20" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.length === 0 ? (
              <div className="py-6 text-center text-muted-foreground">No transactions found</div>
            ) : (
              transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                      {getTransactionIcon(transaction.type)}
                    </div>
                    <div>
                      <div className="font-medium capitalize">{transaction.type}</div>
                      <div className="text-sm text-slate-500">{transaction.description}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={cn(
                        "font-medium",
                        transaction.type === "deposit"
                          ? "text-green-600"
                          : transaction.type === "withdrawal"
                            ? "text-red-600"
                            : "",
                      )}
                    >
                      {transaction.type === "deposit" ? "+" : transaction.type === "withdrawal" ? "-" : ""}
                      {formatCurrency(transaction.amount, transaction.currency)}
                    </div>
                    <div className="flex items-center justify-end space-x-2">
                      <div className="text-sm text-slate-500">{formatDate(transaction.date)}</div>
                      {getStatusBadge(transaction.status)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
