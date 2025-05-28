"use client";

import React, { useEffect, ReactNode } from "react";
import ReactDOM from "react-dom";
import { X } from "lucide-react";

interface ModalProps {
  /** Whether the modal is visible */
  isOpen: boolean;
  /** Called when the user clicks the overlay or wants to close */
  onClose: () => void;
  /** Any valid React nodes (text, elements, etc.) to show inside the modal */
  children: ReactNode;
}

export default function Modal({ isOpen, onClose, children }: ModalProps) {
  // On mount, ensure there is a <div id="modal-root"> in <body>
  useEffect(() => {
    let modalRoot = document.getElementById("modal-root");
    if (!modalRoot) {
      modalRoot = document.createElement("div");
      modalRoot.setAttribute("id", "modal-root");
      document.body.appendChild(modalRoot);
    }
  }, []);

  // If the modal is not open, render nothing
  if (!isOpen) {
    return null;
  }

  // Find the container that we’ll portal into
  const modalRoot = document.getElementById("modal-root");
  if (!modalRoot) {
    // In practice, this should never happen (we create it in useEffect),
    // but this check satisfies TypeScript’s type system.
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

  // The `!` after modalRoot tells TypeScript “trust me, this isn’t null now.”
  return ReactDOM.createPortal(modalContent, modalRoot!);
}
