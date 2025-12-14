/**
 * Unit Tests for Error Formatting
 *
 * Tests the formatError utility function
 */

const { describe, test, expect } = require('@jest/globals');

/**
 * Format error message with consistent "Error: " prefix
 * (Copy from background.js for testing)
 */
function formatError(message) {
  return `Error: ${message}`;
}

describe('formatError', () => {
  test('should add Error prefix to message', () => {
    const result = formatError('Something went wrong');
    expect(result).toBe('Error: Something went wrong');
  });

  test('should handle empty string', () => {
    const result = formatError('');
    expect(result).toBe('Error: ');
  });

  test('should handle multi-line messages', () => {
    const result = formatError('Line 1\nLine 2\nLine 3');
    expect(result).toBe('Error: Line 1\nLine 2\nLine 3');
  });

  test('should handle messages with special characters', () => {
    const result = formatError('Failed: $pecial Ch@rs!');
    expect(result).toBe('Error: Failed: $pecial Ch@rs!');
  });

  test('should handle messages with numbers', () => {
    const result = formatError('API error (401): Unauthorized');
    expect(result).toBe('Error: API error (401): Unauthorized');
  });

  test('should handle messages with quotes', () => {
    const result = formatError('Cannot find "config" file');
    expect(result).toBe('Error: Cannot find "config" file');
  });

  test('should handle messages with backslashes', () => {
    const result = formatError('Path C:\\Users\\test not found');
    expect(result).toBe('Error: Path C:\\Users\\test not found');
  });

  test('should handle very long messages', () => {
    const longMessage = 'A'.repeat(1000);
    const result = formatError(longMessage);
    expect(result).toBe(`Error: ${longMessage}`);
    expect(result.length).toBe(1007); // 'Error: ' + 1000 characters
  });

  test('should handle messages with HTML tags', () => {
    const result = formatError('<script>alert("xss")</script>');
    expect(result).toBe('Error: <script>alert("xss")</script>');
  });

  test('should handle messages with unicode characters', () => {
    const result = formatError('Unicode: 你好世界 🚀');
    expect(result).toBe('Error: Unicode: 你好世界 🚀');
  });

  test('should handle null converted to string', () => {
    const result = formatError(String(null));
    expect(result).toBe('Error: null');
  });

  test('should handle undefined converted to string', () => {
    const result = formatError(String(undefined));
    expect(result).toBe('Error: undefined');
  });

  test('should preserve whitespace', () => {
    const result = formatError('  spaces  around  ');
    expect(result).toBe('Error:   spaces  around  ');
  });

  test('should handle messages with newlines and tabs', () => {
    const result = formatError('Error\twith\ttabs\nand\nnewlines');
    expect(result).toBe('Error: Error\twith\ttabs\nand\nnewlines');
  });
});
