import { notFound } from "next/navigation";

// Needlestick PEP has been removed — this PGD is not suitable for
// pharmacy-level supply without specialist oversight.
export default function Page() {
  notFound();
}
