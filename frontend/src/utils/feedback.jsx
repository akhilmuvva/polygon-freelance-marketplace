import React from 'react';
import { toast } from 'react-toastify';
import { ExternalLink, CheckCircle, XCircle, Loader2 } from 'lucide-react';

const EXPLORER_URL = "https://amoy.polygonscan.com/tx/";

export const showPendingToast = (hash) => {
    return toast.loading(
        <div className="flex flex-col gap-1">
            <span className="font-bold text-sm">Processing Transaction...</span>
            {hash && (
                <a
                    href={`${EXPLORER_URL}${hash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 underline"
                >
                    View on Polygonscan <ExternalLink size={10} />
                </a>
            )}
        </div>
    );
};

export const updateToastToSuccess = (toastId, message) => {
    toast.update(toastId, {
        render: (
            <div className="flex items-center gap-2">
                <CheckCircle size={18} className="text-emerald-400" />
                <span className="font-bold text-sm">{message}</span>
            </div>
        ),
        type: "success",
        isLoading: false,
        autoClose: 5000,
        closeButton: true,
        icon: false // Custom icon used
    });
};

export const updateToastToError = (toastId, error) => {
    let message = "Transaction Failed";

    if (error?.code === 4001 || error?.message?.includes("User rejected")) {
        message = "Transaction Cancelled";
    } else if (error?.message?.includes("insufficient funds")) {
        message = "Insufficient Funds";
    } else if (error?.shortMessage) {
        message = error.shortMessage;
    }

    toast.update(toastId, {
        render: (
            <div className="flex items-center gap-2">
                <XCircle size={18} className="text-red-400" />
                <span className="font-bold text-sm">{message}</span>
            </div>
        ),
        type: "error",
        isLoading: false,
        autoClose: 5000,
        closeButton: true,
        icon: false
    });
};

export const handleError = (error) => {
    let message = "Operation Failed";

    if (error?.code === 4001 || error?.message?.includes("User rejected")) {
        message = "Transaction Cancelled";
    } else if (error?.shortMessage) {
        message = error.shortMessage;
    } else if (typeof error === 'string') {
        message = error;
    }

    toast.error(message, {
        position: "bottom-right"
    });
};
