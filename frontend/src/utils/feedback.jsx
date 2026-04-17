import { toast } from 'react-toastify';
import { ExternalLink, CheckCircle, XCircle } from 'lucide-react';

const EXPLORER_URL = "https://polygonscan.com/tx/";

export const showPendingToast = (hash) => {
    return toast.loading(
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>Processing Transaction...</span>
            {hash && (
                <a
                    href={`${EXPLORER_URL}${hash}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        fontSize: '0.75rem', color: '#818cf8',
                        textDecoration: 'underline',
                    }}
                >
                    View on Polygonscan <ExternalLink size={10} />
                </a>
            )}
        </div>,
        { theme: 'dark' }
    );
};

export const updateToastToSuccess = (toastId, message) => {
    toast.update(toastId, {
        render: (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle size={18} style={{ color: '#34d399' }} />
                <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>{message}</span>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <XCircle size={18} style={{ color: '#f87171' }} />
                <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>{message}</span>
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
        position: "bottom-right",
        theme: "dark"
    });
};
