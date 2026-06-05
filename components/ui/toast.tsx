"use client"

import { useEffect, useState } from "react"
import { AlertCircle, CheckCircle, Info, X, XCircle } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"

type ToastType = "success" | "error" | "info" | "warning"

interface ToastProps {
  message: string
  type?: ToastType
  duration?: number
  onClose?: () => void
  isVisible?: boolean
}

const toastIcons = {
  success: <CheckCircle className="h-5 w-5" style={{ color: "#C9A96E" }} />,
  error: <XCircle className="h-5 w-5 text-red-400" />,
  warning: <AlertCircle className="h-5 w-5 text-amber-400" />,
  info: <Info className="h-5 w-5 text-blue-400" />,
}

const toastStyles = {
  success: {
    background: "#1C1C1C",
    border: "1px solid rgba(201,169,110,0.4)",
    boxShadow: "0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(201,169,110,0.1)",
    color: "#FAFAF8",
  },
  error: {
    background: "#1C1C1C",
    border: "1px solid rgba(229,115,115,0.4)",
    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
    color: "#FAFAF8",
  },
  warning: {
    background: "#1C1C1C",
    border: "1px solid rgba(251,191,36,0.4)",
    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
    color: "#FAFAF8",
  },
  info: {
    background: "#1C1C1C",
    border: "1px solid rgba(96,165,250,0.4)",
    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
    color: "#FAFAF8",
  },
}

export function Toast({
  message,
  type = "success",
  duration = 3000,
  onClose,
  isVisible = true,
}: ToastProps) {
  const [visible, setVisible] = useState(isVisible)

  useEffect(() => {
    setVisible(isVisible)
  }, [isVisible])

  useEffect(() => {
    if (visible && duration > 0) {
      const timer = setTimeout(() => {
        setVisible(false)
        onClose?.()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [visible, duration, onClose])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          style={{
            position: "fixed",
            top: "24px",
            right: "24px",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            gap: "12px",
            width: "320px",
            padding: "14px 16px",
            borderRadius: "8px",
            fontFamily: "'Poppins', sans-serif",
            fontSize: "0.85rem",
            ...toastStyles[type],
          }}
          initial={{ opacity: 0, x: 50, scale: 0.85 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 50, scale: 0.85, transition: { duration: 0.15 } }}
          transition={{ type: "spring", bounce: 0.25 }}
        >
          <div style={{ flexShrink: 0 }}>{toastIcons[type]}</div>
          <p style={{ flex: 1, margin: 0 }}>{message}</p>
          <button
            onClick={() => { setVisible(false); onClose?.() }}
            style={{
              flexShrink: 0,
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "4px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "rgba(250,250,248,0.4)",
              transition: "color 0.2s ease",
            }}
            onMouseOver={e => (e.currentTarget.style.color = "#FAFAF8")}
            onMouseOut={e => (e.currentTarget.style.color = "rgba(250,250,248,0.4)")}
          >
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
