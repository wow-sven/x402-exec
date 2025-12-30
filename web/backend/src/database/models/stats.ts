import { getDatabase, handleDatabaseError } from '../db.js';

/**
 * Hook stats data structure from database
 */
interface HookStats {
  total_volume: string | number | null;
  unique_users: number | null;
  total_transactions: number | null;
  network?: string | null;
}

/**
 * Get token decimals for a network
 * BSC networks use 18 decimals, other networks use 6 decimals
 */
function getNetworkDecimals(network: string | null | undefined): number {
  if (!network) return 6; // Default to 6 decimals
  
  const networkLower = network.toLowerCase();
  // BSC networks use 18 decimals
  if (networkLower === 'bsc' || networkLower === 'bsc-testnet') {
    return 18;
  }
  // All other networks use 6 decimals (base, x-layer, etc.)
  return 6;
}

/**
 * Convert volume from source decimals to target decimals
 * @param volume - Volume in source decimals (as string)
 * @param sourceDecimals - Source decimals
 * @param targetDecimals - Target decimals
 * @returns Volume in target decimals (as string)
 */
function convertDecimals(
  volume: string,
  sourceDecimals: number,
  targetDecimals: number
): string {
  if (sourceDecimals === targetDecimals) {
    return volume;
  }
  
  const volumeBigInt = BigInt(volume);
  const decimalsDiff = sourceDecimals - targetDecimals;
  
  if (decimalsDiff > 0) {
    // Convert from higher decimals to lower decimals (e.g., 18 -> 6)
    const divisor = BigInt(10 ** decimalsDiff);
    return (volumeBigInt / divisor).toString();
  } else {
    // Convert from lower decimals to higher decimals (e.g., 6 -> 18)
    const multiplier = BigInt(10 ** Math.abs(decimalsDiff));
    return (volumeBigInt * multiplier).toString();
  }
}

export async function getTempOverallStats() {
  try {
    const db = getDatabase();
    const { data, error } = await db.from('x402_hooks').select('*');
    if (error) {
      throw error;
    }
    return data;
  } catch (error) {
    handleDatabaseError(error, 'getTempOverallStats');
  }
}

/**
 * Get aggregated statistics across all hooks
 * Sums total_volume, unique_users, and total_transactions from all hooks
 */
export async function getAggregatedStats() {
  try {
    const db = getDatabase();
    const { data, error } = await db
      .from('x402_hooks')
      .select('total_volume, unique_users, total_transactions, network');
    
    if (error) {
      throw error;
    }

    // Aggregate the statistics
    const aggregated = {
      total_volume: '0',
      unique_users: 0,
      total_transactions: 0,
    };

    if (data && data.length > 0) {
      // Sum total_volume (handling BigInt/Numeric as string)
      // Convert all volumes to 6 decimals for consistent aggregation
      const TARGET_DECIMALS = 6;
      const totalVolumeSum = (data as HookStats[]).reduce((sum: string, hook: HookStats) => {
        const volume = hook.total_volume ? String(hook.total_volume) : '0';
        const networkDecimals = getNetworkDecimals(hook.network);
        // Convert volume to target decimals (6) before summing
        const normalizedVolume = convertDecimals(volume, networkDecimals, TARGET_DECIMALS);
        return (BigInt(sum) + BigInt(normalizedVolume)).toString();
      }, '0');

      // Sum unique_users (using Set to count unique users across all hooks)
      // Since we're summing unique_users per hook, we need to be careful
      // For now, we'll sum the counts (assuming they represent unique users per hook)
      const uniqueUsersSum = (data as HookStats[]).reduce((sum: number, hook: HookStats) => {
        return sum + (hook.unique_users || 0);
      }, 0);

      // Sum total_transactions
      const totalTransactionsSum = (data as HookStats[]).reduce((sum: number, hook: HookStats) => {
        return sum + (hook.total_transactions || 0);
      }, 0);

      aggregated.total_volume = totalVolumeSum;
      aggregated.unique_users = uniqueUsersSum;
      aggregated.total_transactions = totalTransactionsSum;
    }

    return aggregated;
  } catch (error) {
    handleDatabaseError(error, 'getAggregatedStats');
  }
}

export async function getTempTransactions(page: number, limit: number) {
  try {
    const db = getDatabase();
    const { data, error } = await db.from('x402_transactions').select('*').order('block_timestamp', { ascending: false }).range((page - 1) * limit, page * limit - 1);

    if (error) {
      throw error;
    }
    return data;
  } catch (error) {
    handleDatabaseError(error, 'getTempTransactions');
  }
}

export async function getTempTransactionsCount() {
  try {
    const db = getDatabase();
    const { count, error } = await db.from('x402_transactions').select('*', { count: 'exact', head: true });

    if (error) {
      throw error;
    }
    return count || 0;
  } catch (error) {
    handleDatabaseError(error, 'getTempTransactionsCount');
  }
}

