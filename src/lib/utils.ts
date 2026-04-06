import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateLong(date: Date | string): string {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

export function getMonthName(monthIndex: number): string {
  const months = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];
  return months[monthIndex];
}

export function getSaturdaysOfYear(year: number): Date[] {
  const saturdays: Date[] = [];
  const date = new Date(year, 0, 1);
  // Find first Saturday
  while (date.getDay() !== 6) {
    date.setDate(date.getDate() + 1);
  }
  while (date.getFullYear() === year) {
    saturdays.push(new Date(date));
    date.setDate(date.getDate() + 7);
  }
  return saturdays;
}

export function getSaturdaysOfYearRange(
  startYear: number,
  endYear: number
): Date[] {
  const saturdays: Date[] = [];
  for (let y = startYear; y <= endYear; y++) {
    saturdays.push(...getSaturdaysOfYear(y));
  }
  return saturdays;
}
