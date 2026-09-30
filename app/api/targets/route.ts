import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireManager } from "@/lib/auth";

const body = z.object({
  year: z.number().int(),
  month: z.number().int().min(1).max(12),
  departmentId: z.string(),
  amount: z.number().nonnegative(),
});

export async function GET(req: Request) {
  const u = new URL(req.url);
  const year = Number(u.searchParams.get("year"));
  const month = Number(u.searchParams.get("month"));

  if (!year || !month) {
    return NextResponse.json(
      { error: "year and month required" },
      { status: 400 },
    );
  }

  const rows = await prisma.monthlyTarget.findMany({
    where: { year, month },
    include: {
      department: true,
      employeeTargets: {
        include: { employee: true },
      },
    },
  });

  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  try {
    await requireManager();
  } catch {
    return NextResponse.json(
      { error: "Manager authentication required" },
      { status: 401 },
    );
  }

  try {
    const data = body.parse(await req.json());

    const result = await prisma.$transaction(async (tx) => {
      const active = await tx.employee.findMany({
        where: {
          departmentId: data.departmentId,
          status: "ACTIVE",
        },
        orderBy: { id: "asc" },
      });

      const target = await tx.monthlyTarget.upsert({
        where: {
          year_month_departmentId: {
            year: data.year,
            month: data.month,
            departmentId: data.departmentId,
          },
        },
        create: {
          year: data.year,
          month: data.month,
          departmentId: data.departmentId,
          amount: data.amount,
        },
        update: {
          amount: data.amount,
        },
      });

      const old = await tx.employeeTarget.findMany({
        where: {
          year: data.year,
          month: data.month,
          monthlyTargetId: target.id,
        },
      });

      const manual = new Map(
        old
          .filter((x) => x.mode === "MANUAL")
          .map((x) => [x.employeeId, x]),
      );

      const manualTotal = [...manual.values()].reduce(
        (sum, x) => sum + Number(x.amount),
        0,
      );

      const auto = active.filter((employee) => !manual.has(employee.id));
      const remaining = Math.max(0, data.amount - manualTotal);
      const each = auto.length ? remaining / auto.length : 0;

      await tx.employeeTarget.deleteMany({
        where: {
          year: data.year,
          month: data.month,
          monthlyTargetId: target.id,
          mode: "AUTO",
        },
      });

      for (const employee of auto) {
        await tx.employeeTarget.create({
          data: {
            year: data.year,
            month: data.month,
            employeeId: employee.id,
            monthlyTargetId: target.id,
            mode: "AUTO",
            amount: each,
          },
        });
      }

      return tx.monthlyTarget.findUnique({
        where: { id: target.id },
        include: {
          department: true,
          employeeTargets: {
            include: { employee: true },
          },
        },
      });
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Unable to save target", error);
    return NextResponse.json(
      { error: "Unable to save target" },
      { status: 400 },
    );
  }
}
