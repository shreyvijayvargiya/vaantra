import { AppAuthLoadingShell, GlobalStyles } from "./index";
import Dashboard from "../app/components/Dashboard";
import DashboardShell from "../app/components/DashboardShell";

/**
 * Authenticated app: sidebar + translate workflow. Guests are redirected to /.
 * Used by /app and /app/[id] so each translation group has a shareable URL (id = group document id).
 */
export default function AuthenticatedAppShell() {
	return (
		<DashboardShell
			DashboardComponent={Dashboard}
			AppAuthLoadingShellComponent={AppAuthLoadingShell}
			GlobalStylesComponent={GlobalStyles}
		/>
	);
}
