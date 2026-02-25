// Script to sync subscription plans with NowPayments
// Run once to register the 3 plans (Basico, Pro, Elite)

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

async function syncPlans() {
  console.log("Sincronizando planes con NowPayments...")
  console.log("URL:", `${BASE_URL}/api/payments/sync-plans`)

  try {
    const res = await fetch(`${BASE_URL}/api/payments/sync-plans`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    })

    const data = await res.json()

    if (!res.ok) {
      console.error("Error:", data)
      process.exit(1)
    }

    console.log("Resultado:", JSON.stringify(data, null, 2))
    console.log("\nPlanes sincronizados exitosamente!")
  } catch (err) {
    console.error("Error de conexion:", err.message)
    process.exit(1)
  }
}

syncPlans()
