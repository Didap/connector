import cronstrue from "cronstrue";
import parser from "cron-parser";

export function describeCron(expr: string, locale: string = "en"): string {
  try {
    return cronstrue.toString(expr, { locale });
  } catch {
    return "invalid cron expression";
  }
}

export function nextRun(expr: string, timezone: string = "Europe/Rome"): Date | null {
  try {
    const it = parser.parseExpression(expr, { tz: timezone });
    return it.next().toDate();
  } catch {
    return null;
  }
}

export function isValidCron(expr: string): boolean {
  try {
    parser.parseExpression(expr);
    return true;
  } catch {
    return false;
  }
}
