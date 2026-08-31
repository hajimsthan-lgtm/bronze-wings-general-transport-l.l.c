import { QueryClient } from '@tanstack/react-query';


export const queryClientInstance = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
			staleTime: 30 * 1000, // 30s — avoid refetch storms when switching tabs/pages
			retry: (failureCount, error) => {
				// Don't retry rate-limit (429) errors — retrying immediately makes them worse
				const status = error?.response?.status || error?.code;
				const isRateLimit = status === 429 || error?.message?.includes('Rate limit');
				if (isRateLimit) return false;
				return failureCount < 1;
			},
			retryDelay: (attempt) => Math.min(1000 * Math.pow(2, attempt), 4000),
		},
	},
});