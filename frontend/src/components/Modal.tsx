"use client";

import React, { useEffect, ReactNode } from "react";
import ReactDOM from "react-dom";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

export default function Modal({ isOpen, onClose, children }: ModalProps) {
  useEffect(() => {
    let modalRoot = document.getElementById("modal-root");
    if (!modalRoot) {
      modalRoot = document.createElement("div");
      modalRoot.setAttribute("id", "modal-root");
      document.body.appendChild(modalRoot);
    }
  }, []);

  if (!isOpen) {
    return null;
  }

  const modalRoot = document.getElementById("modal-root");
  if (!modalRoot) {
    return null;
  }

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      aria-modal="true"
      role="dialog"
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/80"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal box */}
      <div className="relative rounded-2xl shadow-xl p-6 w-full max-w-xl z-10 ">
        {/* Close button in top-right corner */}
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-10 right-10"
        >
          <X size={24} />
        </button>

        {children}
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, modalRoot!);
}
