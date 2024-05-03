import { revalidatePath } from "next/cache";

export async function POST() {
  revalidatePath("/isr/demand");

  return new Response(null, { status: 200 });
}
