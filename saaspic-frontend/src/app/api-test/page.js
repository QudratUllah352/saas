import { API_URL } from "@/lib/api";
import { notFound } from "next/navigation";

export const metadata = {
  title: "Development diagnostic",
  robots: { index: false, follow: false },
};
async function getDeals() {
  const response = await fetch(`${API_URL}/deals`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch deals");
  }

  return response.json();
}

export default async function ApiTestPage() {
  if (process.env.NODE_ENV === "production") notFound();
  const deals = await getDeals();

  return (
    <main style={{ padding: "40px" }}>
      <h1>MongoDB Deals Test</h1>

      <p>Total deals: {deals.length}</p>

      {deals.map((deal) => (
        <div
          key={deal._id}
          style={{
            marginTop: "20px",
            padding: "20px",
            border: "1px solid #ccc",
          }}
        >
          <h2>{deal.product.name}</h2>

          <p>Category: {deal.product.category.name}</p>

          <p>Discount: {deal.discount}</p>

          <p>
            Price: ${deal.price}{" "}
            <del>${deal.oldPrice}</del>
          </p>
        </div>
      ))}
    </main>
  );
}
