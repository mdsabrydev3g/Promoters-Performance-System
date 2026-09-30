import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireManager } from "@/lib/auth";
import { assertMonthOpen } from "@/lib/month-lock";

const schema = z.object({
  invoiceNumber: z.string().trim().min(1),
  date: z.string(),
  employeeId: z.string(),
  amount: z.number().nonnegative(),
  warranty: z.number().nonnegative().default(0),
  agency: z.number().nonnegative().default(0),
  notes: z.string().optional(),
});

export async function GET(req: Request) {
  const u = new URL(req.url);
  const year = Number(u.searchParams.get("year"));
  const month = Number(u.searchParams.get("month"));
  if (!year || month < 1 || month > 12) {
    return NextResponse.json({ error: "Invalid year/month" }, { status: 400 });
  }
  const from = new Date(Date.UTC(year, month - 1, 1));
  const to = new Date(Date.UTC(year, month, 1));
  const rows = await prisma.invoice.findMany({
    where: { date: { gte: from, lt: to } },
    include: { employee: { include: { department: true, company: true } } },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  try {
    await requireManager();
  } catch {
    return NextResponse.json({ error: "Manager authentication required" }, { status: 401 });
  }

  try {
    const d = schema.parse(await req.json());
    const date = new Date(d.date);
    if (Number.isNaN(date.getTime())) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;
    await assertMonthOpen(year, month);

    const employee = await prisma.employee.findUnique({ where: { id: d.employeeId } });
    if (!employee || employee.status !== "ACTIVE") {
      return NextResponse.json({ error: "Active employee not found" }, { status: 404 });
    }

    const row = await prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.create({
        data: {
          invoiceNumber: d.invoiceNumber,
          date,
          employeeId: d.employeeId,
          amount: d.amount,
          warranty: d.warranty,
          agency: d.agency,
          notes: d.notes,
        },
        include: { employee: true },
      });
      await tx.auditLog.create({
        data: {
          action: "CREATE",
          entity: "Invoice",
          entityId: invoice.id,
          details: { invoiceNumber: invoice.invoiceNumber, year, month },
        },
      });
      return invoice;
    });
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "";
    if (message === "MONTH_LOCKED") {
      return NextResponse.json({ error: "Month is locked" }, { status: 423 });
    }
    return NextResponse.json({ error: "Invalid or duplicate invoice" }, { status: 400 });
  }
}
