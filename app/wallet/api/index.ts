export async function getWalletBalance() {
  return {
    totalBalance: 0.0,
    currency: "USD",
  }
}

export async function depositFunds(amount: number) {
  return {
    success: true,
    message: "Deposit initiated successfully",
  }
}

export async function withdrawFunds(amount: number) {
  return {
    success: true,
    message: "Withdrawal initiated successfully",
  }
}

export async function transferFunds(amount: number, recipient: string) {
  return {
    success: true,
    message: "Transfer initiated successfully",
  }
}
