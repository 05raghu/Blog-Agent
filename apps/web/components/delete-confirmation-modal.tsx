interface DeleteConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  itemName: string;
  isDeleting?: boolean;
  error?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirmationModal({
  isOpen,
  title,
  message,
  itemName,
  isDeleting = false,
  error,
  onConfirm,
  onCancel,
}: DeleteConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="text-3xl">{error ? '❌' : '⚠️'}</div>
          <h3 className="text-lg font-bold text-slate-900">{error ? 'Cannot Delete' : title}</h3>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Message */}
        {!error && (
          <div className="mb-6">
            <p className="text-sm text-slate-600 mb-3">{message}</p>
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <p className="text-sm font-medium text-red-900">
                "{itemName}"
              </p>
            </div>
          </div>
        )}

        {/* Warning Text */}
        {!error && (
          <p className="text-xs text-slate-500 mb-6">
            This action cannot be undone.
          </p>
        )}

        {/* Buttons */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2 rounded border border-slate-300 text-slate-700 hover:bg-slate-50 transition-all disabled:opacity-50"
          >
            {error ? 'Close' : 'Cancel'}
          </button>
          {!error && (
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isDeleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Deleting...
                </>
              ) : (
                '🗑️ Delete'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
