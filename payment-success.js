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
    // Wait a moment for backend to process webhook
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Verify user is authenticated and tier is updated
    const user = await AuthService.getCurrentUser();

    if (user.tier === 'pro') {
      // Success! Show success screen
      showSuccess();

      // Refresh popup if it's open
      chrome.runtime.sendMessage({ action: 'refreshUserInfo' }).catch(() => {
        // Ignore errors - popup might not be open
      });
    } else {
      // Payment went through but tier not updated yet
      // Wait a bit more and try again
      await new Promise(resolve => setTimeout(resolve, 3000));

      const retryUser = await AuthService.getCurrentUser();

      if (retryUser.tier === 'pro') {
        showSuccess();
      } else {
        showError('Payment successful, but tier update pending. Please refresh your extension.');
      }
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    showError(error.message || 'Failed to verify payment. Please contact support if you were charged.');
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
