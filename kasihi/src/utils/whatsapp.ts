import { WHATSAPP_CONTACTS } from "@/config/whatsapp";

/**
 * Sends a WhatsApp notification using Fonnte API.
 * 
 * @param target Phone number (string) or array of phone numbers (string[]) in international format (e.g. '6281234567890')
 * @param message The text message content (can contain emojis, bold tags *text*)
 * @returns Object indicating success status and optional error message
 */
export async function sendWhatsAppNotification(
  target: string | string[],
  message: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Clean target numbers (remove spaces, +, -, etc.)
    const cleanNumber = (num: string) => num.replace(/[^0-9]/g, "");

    let targets = "";
    if (Array.isArray(target)) {
      targets = target.map(cleanNumber).filter(Boolean).join(",");
    } else {
      targets = cleanNumber(target);
    }

    if (!targets) {
      return { success: false, error: "No valid target phone numbers provided." };
    }

    const token = process.env.FONNTE_TOKEN;

    // Fallback Mock Log if Fonnte token is not configured in .env.local
    if (!token) {
      console.log(`\n==================================================`);
      console.log(`📱 [WA NOTIFICATION MOCK (FONNTE_TOKEN NOT SET)]`);
      console.log(`To: ${targets}`);
      console.log(`Message:\n${message}`);
      console.log(`==================================================\n`);
      return { success: true };
    }

    const response = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: {
        "Authorization": token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        target: targets,
        message: message,
      }),
    });

    const resData = await response.json();
    if (!response.ok || !resData.status) {
      throw new Error(resData.reason || "Failed to send WhatsApp message via Fonnte");
    }

    console.log(`[WA NOTIFICATION SUCCESS] Sent to: ${targets}`);
    return { success: true };
  } catch (err: any) {
    console.error(`[WA NOTIFICATION ERROR] Target: ${target}, Error:`, err.message || err);
    return { success: false, error: err.message };
  }
}
export { WHATSAPP_CONTACTS };
