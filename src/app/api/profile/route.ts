import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, role: true, calle: true, localidad: true, provincia: true, celular: true },
  });

  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(user);
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { calle, localidad, provincia, celular, currentPassword, newPassword } = body;

  const updateData: Record<string, string | null> = {};

  if (calle !== undefined) updateData.calle = calle || null;
  if (localidad !== undefined) updateData.localidad = localidad || null;
  if (provincia !== undefined) updateData.provincia = provincia || null;
  if (celular !== undefined) updateData.celular = celular || null;

  if (newPassword) {
    if (!currentPassword) {
      return NextResponse.json({ error: "Ingresá tu contraseña actual" }, { status: 400 });
    }
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      return NextResponse.json({ error: "La contraseña actual es incorrecta" }, { status: 400 });
    }
    updateData.password = await bcrypt.hash(newPassword, 10);
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: updateData,
    select: { id: true, name: true, email: true, role: true, calle: true, localidad: true, provincia: true, celular: true },
  });

  return NextResponse.json(updated);
}
