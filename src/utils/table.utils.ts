import Table from 'cli-table3';
import chalk from 'chalk';

// Status indicators
export const STATUS_INDICATORS = {
  running: chalk.green('●'),
  active: chalk.green('●'),
  stopped: chalk.red('○'),
  inactive: chalk.yellow('○'),
  error: chalk.red('✖'),
  failed: chalk.red('✖'),
  pending: chalk.gray('◌'),
  starting: chalk.blue('◐'),
  stopping: chalk.yellow('◐'),
  restarting: chalk.blue('◐'),
  deploying: chalk.blue('◐'),
  deployed: chalk.green('●'),
  created: chalk.gray('◌'),
  unknown: chalk.gray('◌'),
};

// Common table configurations
export const TABLE_STYLES = {
  modern: {
    chars: {
      top: '─',
      'top-mid': '┬',
      'top-left': '┌',
      'top-right': '┐',
      bottom: '─',
      'bottom-mid': '┴',
      'bottom-left': '└',
      'bottom-right': '┘',
      left: '│',
      'left-mid': '├',
      mid: '─',
      'mid-mid': '┼',
      right: '│',
      'right-mid': '┤',
      middle: '│',
    },
  },
  compact: {
    compact: true,
    chars: {
      top: '',
      'top-mid': '',
      'top-left': '',
      'top-right': '',
      bottom: '',
      'bottom-mid': '',
      'bottom-left': '',
      'bottom-right': '',
      left: '',
      'left-mid': '',
      mid: '',
      'mid-mid': '',
      right: '',
      'right-mid': '',
      middle: ' ',
    },
  },
};

// Create a standard table for listing resources
export function createResourceTable(
  headers: string[],
  options?: any,
): Table.Table {
  return new Table({
    head: headers.map((h) => chalk.bold.cyan(h)),
    style: {
      head: [],
      border: [],
    },
    ...TABLE_STYLES.modern,
    ...options,
  });
}

// Create a compact info table (for me command, status, etc)
export function createInfoTable(): Table.Table {
  return new Table({
    style: {
      head: [],
      border: [],
    },
    ...TABLE_STYLES.compact,
    colWidths: [20, 50],
  });
}

// Create a key-value table for environment variables
export function createKeyValueTable(): Table.Table {
  return new Table({
    head: [chalk.bold.cyan('Key'), chalk.bold.cyan('Value')],
    style: {
      head: [],
      border: [],
    },
    ...TABLE_STYLES.modern,
    colWidths: [30, 50],
    wordWrap: true,
  });
}

// Format date consistently
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return chalk.green('Today');
  } else if (diffDays === 1) {
    return chalk.green('Yesterday');
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString();
  }
}

// Get status indicator
export function getStatusIndicator(status: string | null | undefined): string {
  if (!status) return STATUS_INDICATORS.unknown;
  const normalizedStatus = status.toLowerCase().trim();
  return STATUS_INDICATORS[normalizedStatus] || STATUS_INDICATORS.unknown;
}

// Format status with color
export function formatStatus(status: string | null | undefined): string {
  if (!status) {
    return `${STATUS_INDICATORS.unknown} ${chalk.gray('unknown')}`;
  }

  const normalizedStatus = status.toLowerCase().trim();
  const indicator = getStatusIndicator(status);

  switch (normalizedStatus) {
    case 'running':
    case 'active':
    case 'deployed':
      return `${indicator} ${chalk.green(status)}`;
    case 'stopped':
      return `${indicator} ${chalk.red(status)}`;
    case 'inactive':
      return `${indicator} ${chalk.yellow(status)}`;
    case 'error':
    case 'failed':
      return `${indicator} ${chalk.red(status)}`;
    case 'pending':
    case 'starting':
    case 'deploying':
    case 'restarting':
      return `${indicator} ${chalk.blue(status)}`;
    case 'stopping':
      return `${indicator} ${chalk.yellow(status)}`;
    case 'created':
      return `${indicator} ${chalk.gray('created')}`;
    case 'unknown':
      return `${indicator} ${chalk.gray('unknown')}`;
    default:
      return `${indicator} ${chalk.gray(status)}`;
  }
}

// Create a progress bar for usage
export function createProgressBar(
  current: number,
  max: number,
  width: number = 20,
): string {
  const percentage = (current / max) * 100;
  const filled = Math.round((percentage / 100) * width);
  const empty = width - filled;

  let color = chalk.green;
  if (percentage >= 100) {
    color = chalk.red;
  } else if (percentage >= 80) {
    color = chalk.yellow;
  }

  const bar = color('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
  return `${bar} ${color(`${Math.round(percentage)}%`)}`;
}

// Truncate long strings with ellipsis
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
}

// Format bytes to human readable
export function formatBytes(bytes: number): string {
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
}
