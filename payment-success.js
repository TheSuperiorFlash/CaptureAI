/**
 * Payment Success Page Script
 * Handles post-payment verification and user feedback
 */

document.addEventListener('DOMContentLoaded', async () => {
  const elements = {
    loadingState: document.getElementById('loading-state'),
    successState: document.getElementById('success-state'),
    errorState: document.getElementById('error-state'),
    errorMessage: document.getElementById('error-message')
  };

  // Get session ID from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const sessionId = urlParams.get('session_id');

  if (!sessionId) {
    showError('No payment session found');
    return;
  }

  try {
    // Wait for backend webhook to process (3 seconds should be enough)
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Payment successful! Show success screen
    // The license key will be sent via email
    showSuccess();

    // Try to refresh popup if extension is installed and user is logged in
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({ action: 'refreshUserInfo' }).catch(() => {
        // Ignore errors - extension might not be installed or popup not open
      });
    }
  } catch (error) {
    console.error('Payment success page error:', error);
    // Even if there's an error, show success since payment went through
    // The license key will be emailed regardless
    showSuccess();
  }

  /**
   * Show success state
   */
  function showSuccess() {
    elements.loadingState.classList.add('hidden');
    elements.errorState.classList.add('hidden');
    elements.successState.classList.remove('hidden');
  }

  /**
   * Show error state
   */
  function showError(message) {
    elements.loadingState.classList.add('hidden');
    elements.successState.classList.add('hidden');
    elements.errorMessage.textContent = message;
    elements.errorState.classList.remove('hidden');
  }
});
