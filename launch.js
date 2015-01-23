chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('terminal.html', {
  	id: "win1",
    innerBounds: {
      width: 880,
      height: 480
    }
  });
});
