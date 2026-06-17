/**
 * premiumScheduler.ts
 *
 * Bull/Redis queue for:
 *   1. Checking due premiums on a cron schedule
 *   2. Sending SMS reminders via mock (or real) SMS provider
 */
import Queue, { Job } from "bull";
import { PrismaClient, Policy } from "@prisma/client";

const prisma = new PrismaClient();
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

// ── Queue definitions ──────────────────────────────────────────────────────

export const premiumCheckQueue = new Queue<void>("premium-check", REDIS_URL);
export const smsReminderQueue = new Queue<{ phone: string; policyId: number; message: string }>(
  "sms-reminder",
  REDIS_URL
);

// ── SMS sender (mock / real) ───────────────────────────────────────────────

async function sendSms(phone: string, message: string): Promise<void> {
  if (process.env.AFRICASTALKING_API_KEY && process.env.AFRICASTALKING_USERNAME) {
    // Real Africa's Talking integration
    const response = await fetch("https://api.africastalking.com/version1/messaging", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
        apiKey: process.env.AFRICASTALKING_API_KEY,
      },
      body: new URLSearchParams({
        username: process.env.AFRICASTALKING_USERNAME,
        to: phone,
        message,
        from: "CoverChain",
      }).toString(),
    });
    if (!response.ok) {
      const err = await response.text();
      console.error(`[SMS] Failed to send to ${phone}: ${err}`);
      return;
    }
  }
  // Mock fallback
  console.log(`[SMS MOCK] To: ${phone} | Message: ${message}`);
}

// ── Workers ────────────────────────────────────────────────────────────────

/**
 * Scan all active policies, find those with premiums due in ≤24h,
 * and enqueue an SMS reminder for each.
 */
premiumCheckQueue.process(async (_job: Job<void>) => {
  const nowMs = Date.now();
  const windowMs = 24 * 60 * 60 * 1000; // 24 hours

  const activePolicies = await prisma.policy.findMany({
    where: { status: "ACTIVE" },
    include: { user: true },
  });

  let queued = 0;
  for (const policy of activePolicies) {
    if (!policy.lastPremiumAt) continue;

    const nextDueMs = policy.lastPremiumAt.getTime() + policy.premiumInterval * 1000;
    const overdueMs = nowMs - nextDueMs;

    if (overdueMs > 0) {
      // Policy is lapsed — mark it and notify
      await prisma.policy.update({ where: { id: policy.id }, data: { status: "LAPSED" } });
      const phone = policy.user?.phone;
      if (phone) {
        await smsReminderQueue.add({
          phone,
          policyId: policy.contractId,
          message: `CoverChain: Policy ${policy.contractId} has lapsed. Dial *384# and select 'Pay Premium' to reactivate.`,
        });
        queued++;
      }
    } else if (nextDueMs - nowMs <= windowMs) {
      // Premium due within 24h — send reminder
      const phone = policy.user?.phone;
      if (phone) {
        const hoursLeft = Math.ceil((nextDueMs - nowMs) / 3600000);
        await smsReminderQueue.add({
          phone,
          policyId: policy.contractId,
          message: `CoverChain: Your ${policy.productType.replace(/_/g, " ")} premium (Policy ${policy.contractId}) is due in ${hoursLeft}h. Dial *384# to pay.`,
        });
        queued++;
      }
    }
  }

  console.log(`[PremiumCheck] Checked ${activePolicies.length} policies, queued ${queued} reminders`);
});

/** Send each queued SMS reminder */
smsReminderQueue.process(async (job: Job<{ phone: string; policyId: number; message: string }>) => {
  const { phone, message } = job.data;
  await sendSms(phone, message);
});

// ── Cron scheduling ────────────────────────────────────────────────────────

/** Schedule a premium check every 6 hours */
export function startPremiumScheduler(): void {
  premiumCheckQueue.add(undefined, {
    repeat: { cron: "0 */6 * * *" }, // every 6 hours
    removeOnComplete: true,
    removeOnFail: false,
  });

  premiumCheckQueue.on("completed", (job) => {
    console.log(`[PremiumCheck] Job ${job.id} completed`);
  });

  premiumCheckQueue.on("failed", (job, err) => {
    console.error(`[PremiumCheck] Job ${job?.id} failed: ${err.message}`);
  });

  smsReminderQueue.on("failed", (job, err) => {
    console.error(`[SMS] Job ${job?.id} failed: ${err.message}`);
  });

  console.log("[PremiumScheduler] Started — checking every 6 hours");
}

/** Manually trigger a single premium check (useful for testing) */
export async function triggerImmediateCheck(): Promise<void> {
  await premiumCheckQueue.add(undefined, { removeOnComplete: true });
}
