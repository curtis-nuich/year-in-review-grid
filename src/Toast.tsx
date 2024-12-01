import { X } from "lucide-react";

interface ToastProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
}

const Toast = ({ message, isVisible, onClose }: ToastProps) => {
  if (!isVisible) return null;
  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-md shadow-lg flex items-center gap-2">
      {message}
      <button onClick={onClose}>
        <X size={16} />
      </button>
    </div>
  );
};

export { Toast };
