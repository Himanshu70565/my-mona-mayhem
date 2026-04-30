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
	}

	// Treat 429 (rate limit) and 503 (service unavailable) as retryable
	if (error instanceof Error && error.message.includes('429')) {
		return true;
	}
	if (error instanceof Error && error.message.includes('503')) {
		return true;
	}

	// Don't retry 404 or auth errors
	if (error instanceof Error && error.message.includes('404')) {
		return false;
	}
	if (error instanceof Error && error.message.includes('401')) {
		return false;
	}
	if (error instanceof Error && error.message.includes('403')) {
		return false;
	}

	return false;
}
