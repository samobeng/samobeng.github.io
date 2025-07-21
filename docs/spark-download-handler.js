function triggerDownload(url) {
  const a = document.createElement('a');
  a.href = url;
  a.target = '_blank'; // Opens in new tab (optional)
  a.rel = 'noopener noreferrer';
  a.download = ''; // Hint to browser that it's a download
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
