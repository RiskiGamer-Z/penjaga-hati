/**
 * WhatsApp Contact Numbers Configuration
 * 
 * Target phone numbers should be in international format without '+' or spaces.
 * Example: '6281234567890' (Indonesia country code: 62)
 */
export const WHATSAPP_CONTACTS = {
  // List of Customer Service / Admin numbers that receive notification when a user orders a service
  CS_NUMBERS: [
    "6285172081518",
    "6285172081519"
  ],
  
  // Owner number for payout approvals or analytical updates
  OWNER_NUMBER: "6285172081518",
  
  // CS display contact (used for user support links in dashboard)
  CS_DEFAULT_DISPLAY: "+62 851-7208-1518"
};
