/**
 * Shows and hides the help panel
 */
function toggleHelp() {
  document.querySelector('.help').classList.toggle('hidden');
  document.body.classList.toggle('dim');
}

(function() {

  // Create and init the terminal
  var term = new Terminal('container');

  // Capture key presses
  document.body.addEventListener('keydown', function(e) {
    if (e.keyCode == 27) { // Esc
      toggleHelp();
      e.stopPropagation();
      e.preventDefault();
    }
  }, false);

  term.output('Press Esc for options.<br/>');

  var ansiConv = new AnsiConverter();

  var host = '149.210.199.92';
  var port = 7000;
  connect(host, port);

  var button = document.getElementById('connect');
  button.addEventListener('click', function() {
    var host = document.getElementById('host').value;
    var port = parseInt(document.getElementById('port').value, 10);
    tcpClient.disconnect();
    connect(host, port);
    toggleHelp();
  });

  /**
   * Connects to a host and port
   *
   * @param {String} host The remote host to connect to
   * @param {Number} port The port to connect to at the remote host
   */
  function connect(host, port) {
    tcpClient = new TcpClient(host, port);
    tcpClient.connect(function() {
      term.output('Connected to ' + host + ':' + port + '<br/>');
      tcpClient.addResponseListener(function(data) {
        // Run response through ANSI colorizer.
        //console.log(data);
        // TODO this fails when the color code is split over 2 packages
        var formattedData = ansiConv.formatAnsi(data);
        // Split into multiple lines.
        var lines = formattedData.split('\n');
        // Render response in the terminal.
        var output = lines.join('<br/>');
        term.output(output);
      });
    });
  }

})();
