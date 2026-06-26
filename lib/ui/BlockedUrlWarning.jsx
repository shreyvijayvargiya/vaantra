import { AlertCircle } from "lucide-react";

export default function BlockedUrlWarning({ message, className = "" }) {
	if (!message) return null;

	return (
		<div
			className={`flex items-start gap-2 px-3 py-2.5 text-sm bg-red-50 border border-red-100 rounded-xl ${className}`}
		>
			<AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
			<div>
				<p className="font-semibold text-red-800 mb-0.5">
					This URL can&apos;t be used
				</p>
				<p className="text-red-700 leading-snug m-0">{message}</p>
			</div>
		</div>
	);
}
