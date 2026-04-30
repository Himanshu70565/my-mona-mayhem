/**
 * Retry logic with exponential backoff for resilience
 */

export interface RetryOptions {
	maxRetries?: number;
	initialDelayMs?: number;
	maxDelayMs?: number;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
	maxRetries: 3,
	initialDelayMs: 100,
	maxDelayMs: 5000,
};

async function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withRetry<T>(
	fn: () => Promise<T>,
	options: RetryOptions = {}
): Promise<T> {
	const opts = { ...DEFAULT_OPTIONS, ...options };

	let lastError: Error | null = null;
	let delay = opts.initialDelayMs;

	for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
		try {
			return await fn();
		} catch (error) {
			lastError = error instanceof Error ? error : new Error(String(error));

			const isLastAttempt = attempt === opts.maxRetries;
			if (isLastAttempt) {
				break;
			}

			// Check if error is retryable (network, rate limit, or server error)
			const isRetryable = isRetryableError(error);
			if (!isRetryable) {
				throw error;
			}

			// Exponential backoff with jitter
			const jitter = Math.random() * 0.1 * delay;
			await sleep(Math.min(delay + jitter, opts.maxDelayMs));
			delay = Math.min(delay * 2, opts.maxDelayMs);
		}
	}

	throw lastError || new Error('Max retries exceeded');
}

function isRetryableError(error: unknown): boolean {
	// Treat network errors as retryable
	if (error instanceof Error) {
		const msg = error.message.toLowerCase();
		if (msg.includes('fetch') || msg.includes('network')) {
			return true;
		}

		// Extract HTTP status code from error message (e.g., "GitHub returned 500: ...")
		const statusMatch = msg.match(/(\d{3})/);
		if (statusMatch) {
			const statusCode = parseInt(statusMatch[1], 10);
			
			// Don't retry client errors (4xx)
			if (statusCode >= 400 && statusCode < 500) {
				// Exception: 429 (rate limit) and 408 (timeout) are retryable
				if (statusCode === 429 || statusCode === 408) {
					return true;
				}
				return false;
			}
			
			// Retry all server errors (5xx)
			if (statusCode >= 500 && statusCode < 600) {
				return true;
			}
		}
	}

	return false;
}
