// Saves options to chrome.storage.sync.
function save_options() {
  chrome.storage.sync.set({
    first_view: document.getElementById('first_view').value,
    enterprise: document.getElementById('enterprise').value
  }, function() {
    // Update status to let user know options were saved.
    var status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(function() {
      status.textContent = '';
    }, 750);
  });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
  chrome.storage.sync.get({
    first_view: 'im',
    enterprise: ''
  }, function(items) {
    document.getElementById('first_view').value = items.first_view;
    document.getElementById('enterprise').value = items.enterprise;
  });
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);
