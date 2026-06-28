import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState,
} from "react";
import { Gift } from "lucide-react";
import { toast } from "sonner";
import FeedbackCreditModal from "./FeedbackCreditModal";
import LoginModal from "./LoginModal";
import { subscribeUserFeedbackStatus } from "../api/userFeedback";

const FeedbackCreditContext = createContext(null);

export function FeedbackCreditProvider({ user, children }) {
	const [modalOpen, setModalOpen] = useState(false);
	const [loginOpen, setLoginOpen] = useState(false);
	const [alreadyClaimed, setAlreadyClaimed] = useState(false);
	const pendingOpenRef = useRef(false);

	useEffect(() => {
		if (!user?.uid) {
			setAlreadyClaimed(false);
			return;
		}
		return subscribeUserFeedbackStatus(user.uid, setAlreadyClaimed);
	}, [user?.uid]);

	useEffect(() => {
		if (user?.uid && pendingOpenRef.current) {
			pendingOpenRef.current = false;
			setLoginOpen(false);
			if (!alreadyClaimed) setModalOpen(true);
		}
	}, [user?.uid, alreadyClaimed]);

	const openFeedback = useCallback(() => {
		if (alreadyClaimed) {
			toast.info("You already claimed your free feedback minute.");
			return;
		}
		if (!user?.uid) {
			pendingOpenRef.current = true;
			setLoginOpen(true);
			return;
		}
		setModalOpen(true);
	}, [alreadyClaimed, user?.uid]);

	const requireLogin = useCallback(() => {
		pendingOpenRef.current = true;
		setModalOpen(false);
		setLoginOpen(true);
	}, []);

	return (
		<FeedbackCreditContext.Provider value={{ openFeedback, alreadyClaimed }}>
			{children}
			<FeedbackCreditModal
				open={modalOpen}
				onClose={() => setModalOpen(false)}
				user={user}
				alreadyClaimed={alreadyClaimed}
				onRequireLogin={requireLogin}
				onSuccess={() => setAlreadyClaimed(true)}
			/>
			<LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
		</FeedbackCreditContext.Provider>
	);
}

function useFeedbackCredit() {
	const ctx = useContext(FeedbackCreditContext);
	if (!ctx) {
		throw new Error("FeedbackCreditTrigger must be used within FeedbackCreditProvider");
	}
	return ctx;
}

const LABEL = "Get 1 minute FREE";

/**
 * @param {"fixed" | "sidebar" | "inline" | "icon"} variant
 */
export function FeedbackCreditTrigger({ variant = "fixed", className = "", style }) {
	const { openFeedback, alreadyClaimed } = useFeedbackCredit();

	if (alreadyClaimed) return null;

	const common = {
		type: "button",
		onClick: openFeedback,
		title: LABEL,
	};

	if (variant === "fixed") {
		return (
			<button
				{...common}
				className={`fixed bottom-5 right-5 z-[60] inline-flex items-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 rounded-full shadow-lg shadow-orange-500/30 transition-all ${className}`}
				style={style}
			>
				<Gift className="w-4 h-4 shrink-0" />
				<span>{LABEL}</span>
			</button>
		);
	}

	if (variant === "sidebar") {
		return (
			<button
				{...common}
				className={`w-full mt-2 px-3 py-2.5 text-xs font-semibold text-orange-700 bg-orange-50 border border-orange-200 rounded-xl hover:bg-orange-100 flex items-center justify-center gap-1.5 ${className}`}
				style={style}
			>
				<Gift className="w-3.5 h-3.5" />
				{LABEL}
			</button>
		);
	}

	if (variant === "icon") {
		return (
			<button
				{...common}
				aria-label={LABEL}
				className={`p-2 border-none bg-transparent text-orange-600 hover:text-orange-700 flex items-center shrink-0 ${className}`}
				style={style}
			>
				<Gift className="w-3.5 h-3.5" />
			</button>
		);
	}

	return (
		<button
			{...common}
			className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-orange-700 border border-orange-200 bg-orange-50 rounded-lg hover:bg-orange-100 ${className}`}
			style={style}
		>
			<Gift className="w-3.5 h-3.5" />
			{LABEL}
		</button>
	);
}
