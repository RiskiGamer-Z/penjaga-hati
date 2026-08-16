import { toast as sonnerToast, ExternalToast } from "sonner";

/**
 * Unified Toast Notification helper.
 * Centralizes all toast messaging across the application.
 */
export const toast = {
  success: (message: string, descriptionOrOptions?: string | ExternalToast, options?: ExternalToast) => {
    if (typeof descriptionOrOptions === "object") {
      return sonnerToast.success(message, descriptionOrOptions);
    }
    return sonnerToast.success(message, { description: descriptionOrOptions, ...options });
  },
  error: (message: string, descriptionOrOptions?: string | ExternalToast, options?: ExternalToast) => {
    if (typeof descriptionOrOptions === "object") {
      return sonnerToast.error(message, descriptionOrOptions);
    }
    return sonnerToast.error(message, { description: descriptionOrOptions, ...options });
  },
  info: (message: string, descriptionOrOptions?: string | ExternalToast, options?: ExternalToast) => {
    if (typeof descriptionOrOptions === "object") {
      return sonnerToast.info(message, descriptionOrOptions);
    }
    return sonnerToast.info(message, { description: descriptionOrOptions, ...options });
  },
  warning: (message: string, descriptionOrOptions?: string | ExternalToast, options?: ExternalToast) => {
    if (typeof descriptionOrOptions === "object") {
      return sonnerToast.warning(message, descriptionOrOptions);
    }
    return sonnerToast.warning(message, { description: descriptionOrOptions, ...options });
  },
  loading: (message: string, descriptionOrOptions?: string | ExternalToast, options?: ExternalToast) => {
    if (typeof descriptionOrOptions === "object") {
      return sonnerToast.loading(message, descriptionOrOptions);
    }
    return sonnerToast.loading(message, { description: descriptionOrOptions, ...options });
  },
  dismiss: (id?: string | number) => {
    return sonnerToast.dismiss(id);
  },
  confirm: (message: string, description?: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const id = sonnerToast(message, {
        description,
        duration: Infinity,
        position: 'top-center',
        action: {
          label: 'Ya, Lanjutkan',
          onClick: () => {
            sonnerToast.dismiss(id);
            resolve(true);
          },
        },
        cancel: {
          label: 'Batal',
          onClick: () => {
            sonnerToast.dismiss(id);
            resolve(false);
          },
        },
        onAutoClose: () => resolve(false),
        onDismiss: () => resolve(false),
      });
    });
  },
};

