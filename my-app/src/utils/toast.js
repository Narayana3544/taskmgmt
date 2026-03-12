/**
 * Toast utility — wraps react-hot-toast for consistent usage.
 *
 * Usage:
 *   import { showToast } from '../utils/toast';
 *   showToast.success("Leave request submitted");
 *   showToast.error("Failed to save changes");
 *   showToast.info("Timesheet reminder sent");
 */
import toast from "react-hot-toast";

const defaultOptions = {
  duration: 4000,
  style: {
    fontFamily: "'Inter', sans-serif",
    fontSize: "14px",
    borderRadius: "8px",
    padding: "12px 16px",
  },
};

export const showToast = {
  success: (message, options = {}) =>
    toast.success(message, {
      ...defaultOptions,
      ...options,
      style: { ...defaultOptions.style, ...options.style },
    }),

  error: (message, options = {}) =>
    toast.error(message, {
      ...defaultOptions,
      duration: 5000,
      ...options,
      style: { ...defaultOptions.style, ...options.style },
    }),

  info: (message, options = {}) =>
    toast(message, {
      ...defaultOptions,
      icon: "ℹ️",
      ...options,
      style: { ...defaultOptions.style, ...options.style },
    }),

  warning: (message, options = {}) =>
    toast(message, {
      ...defaultOptions,
      icon: "⚠️",
      ...options,
      style: {
        ...defaultOptions.style,
        background: "#FEF3C7",
        color: "#92400E",
        ...options.style,
      },
    }),

  promise: (promise, messages, options = {}) =>
    toast.promise(promise, messages, { ...defaultOptions, ...options }),
};

export default showToast;
